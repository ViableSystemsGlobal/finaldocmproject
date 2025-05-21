-- Function to calculate transactions for a specific month/year
CREATE OR REPLACE FUNCTION public.sum_transactions_by_month(month_param integer, year_param integer)
RETURNS numeric AS $$
DECLARE
  total numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total
  FROM public.transactions
  WHERE EXTRACT(MONTH FROM transacted_at) = month_param
  AND EXTRACT(YEAR FROM transacted_at) = year_param;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate expenses for a specific month/year
CREATE OR REPLACE FUNCTION public.sum_expenses_by_month(month_param integer, year_param integer)
RETURNS numeric AS $$
DECLARE
  total numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total
  FROM public.expenses
  WHERE EXTRACT(MONTH FROM spent_at) = month_param
  AND EXTRACT(YEAR FROM spent_at) = year_param;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate transactions by category for the current year
CREATE OR REPLACE FUNCTION public.sum_transactions_by_category(category_param text)
RETURNS numeric AS $$
DECLARE
  total numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total
  FROM public.transactions
  WHERE EXTRACT(YEAR FROM transacted_at) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND category = category_param;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate expenses by category for the current year
CREATE OR REPLACE FUNCTION public.sum_expenses_by_category(category_param text)
RETURNS numeric AS $$
DECLARE
  total numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total
  FROM public.expenses
  WHERE EXTRACT(YEAR FROM spent_at) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND category = category_param;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to get financial overview for a specific year
CREATE OR REPLACE FUNCTION public.get_financial_overview(year_param integer)
RETURNS TABLE (
  metric text,
  value numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'Income' AS metric,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions 
     WHERE EXTRACT(YEAR FROM transacted_at) = year_param) AS value
  UNION ALL
  SELECT 'Expenses' AS metric,
    (SELECT COALESCE(SUM(amount), 0) FROM expenses 
     WHERE EXTRACT(YEAR FROM spent_at) = year_param) AS value
  UNION ALL
  SELECT 'Net Income' AS metric,
    (
      (SELECT COALESCE(SUM(amount), 0) FROM transactions 
       WHERE EXTRACT(YEAR FROM transacted_at) = year_param) -
      (SELECT COALESCE(SUM(amount), 0) FROM expenses 
       WHERE EXTRACT(YEAR FROM spent_at) = year_param)
    ) AS value
  UNION ALL
  SELECT 'Assets Book Value' AS metric,
    (SELECT COALESCE(SUM(cost - accumulated_depreciation), 0) FROM assets) AS value;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly financial data for a specific year
CREATE OR REPLACE FUNCTION public.get_monthly_financials(year_param integer)
RETURNS TABLE (
  month_name text,
  month_num integer,
  income numeric,
  expenses numeric,
  net numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH monthly_transactions AS (
    SELECT 
      EXTRACT(MONTH FROM transacted_at)::integer AS month_num,
      TO_CHAR(transacted_at, 'Month') AS month_name,
      SUM(amount) AS income
    FROM 
      transactions
    WHERE 
      EXTRACT(YEAR FROM transacted_at) = year_param
    GROUP BY 
      month_num, month_name
  ),
  monthly_expenses AS (
    SELECT 
      EXTRACT(MONTH FROM spent_at)::integer AS month_num,
      TO_CHAR(spent_at, 'Month') AS month_name,
      SUM(amount) AS expenses
    FROM 
      expenses
    WHERE 
      EXTRACT(YEAR FROM spent_at) = year_param
    GROUP BY 
      month_num, month_name
  ),
  all_months AS (
    SELECT
      m AS month_num,
      TO_CHAR(TO_DATE(m::text, 'MM'), 'Month') AS month_name
    FROM
      generate_series(1, 12) AS m
  )
  SELECT 
    a.month_name,
    a.month_num,
    COALESCE(t.income, 0) AS income,
    COALESCE(e.expenses, 0) AS expenses,
    COALESCE(t.income, 0) - COALESCE(e.expenses, 0) AS net
  FROM 
    all_months a
  LEFT JOIN 
    monthly_transactions t ON a.month_num = t.month_num
  LEFT JOIN 
    monthly_expenses e ON a.month_num = e.month_num
  ORDER BY 
    a.month_num;
END;
$$ LANGUAGE plpgsql;

-- Function to get top donors for a specific year
CREATE OR REPLACE FUNCTION public.get_top_donors(year_param integer, limit_param integer DEFAULT 10)
RETURNS TABLE (
  donor_name text,
  total_donated numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '') AS donor_name,
    SUM(t.amount) AS total_donated
  FROM 
    transactions t
  LEFT JOIN 
    contacts c ON t.contact_id = c.id
  WHERE 
    EXTRACT(YEAR FROM t.transacted_at) = year_param
    AND t.contact_id IS NOT NULL
  GROUP BY 
    donor_name
  ORDER BY 
    total_donated DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Function to update asset accumulated depreciation based on current date
CREATE OR REPLACE FUNCTION public.update_asset_depreciation(asset_id_param uuid)
RETURNS void AS $$
DECLARE
  asset_record assets%ROWTYPE;
  years_since_purchase NUMERIC;
  new_depreciation NUMERIC;
BEGIN
  -- Get the asset record
  SELECT * INTO asset_record FROM assets WHERE id = asset_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Asset with ID % not found', asset_id_param;
  END IF;
  
  -- Calculate years since purchase (can be a fraction)
  years_since_purchase := EXTRACT(EPOCH FROM (CURRENT_DATE - asset_record.purchase_date)) / (60 * 60 * 24 * 365.25);
  
  -- Cap at the asset's life_years
  years_since_purchase := LEAST(years_since_purchase, asset_record.life_years::numeric);
  
  -- Calculate depreciation based on method
  IF asset_record.depreciation_method = 'straight-line' THEN
    -- Straight-line: evenly over the life
    new_depreciation := asset_record.cost * (years_since_purchase / asset_record.life_years);
  ELSE
    -- Double-declining balance: more rapid at start
    -- This is a simplified calculation
    new_depreciation := asset_record.cost * (1 - POWER(1 - (2.0 / asset_record.life_years), years_since_purchase));
  END IF;
  
  -- Update the asset with new depreciation value
  UPDATE assets 
  SET accumulated_depreciation = new_depreciation
  WHERE id = asset_id_param;
END;
$$ LANGUAGE plpgsql; 