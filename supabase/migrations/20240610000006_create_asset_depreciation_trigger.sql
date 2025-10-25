-- Function to update all assets' accumulated depreciation
CREATE OR REPLACE FUNCTION public.update_all_assets_depreciation()
RETURNS void AS $$
DECLARE
  asset_id uuid;
BEGIN
  FOR asset_id IN SELECT id FROM assets
  LOOP
    PERFORM public.update_asset_depreciation(asset_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function that will run when assets are updated
CREATE OR REPLACE FUNCTION public.update_asset_depreciation_on_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the depreciation value for the specific asset
  PERFORM public.update_asset_depreciation(NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger on the assets table for UPDATE operations
-- This ensures depreciation is updated whenever assets are modified
CREATE TRIGGER trigger_update_asset_depreciation_on_update
AFTER UPDATE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION public.update_asset_depreciation_on_change();

-- Create a function to automatically update asset depreciation daily
CREATE OR REPLACE FUNCTION public.daily_asset_depreciation_update()
RETURNS void AS $$
BEGIN
  -- Update all assets depreciation
  PERFORM public.update_all_assets_depreciation();
END;
$$ LANGUAGE plpgsql;

-- Create a function to generate monthly financial reports
CREATE OR REPLACE FUNCTION public.generate_monthly_financial_report(year_param integer, month_param integer)
RETURNS TABLE (
  category text,
  income numeric,
  expenses numeric,
  net numeric
) AS $$
BEGIN
  RETURN QUERY
  -- Get transaction totals by category
  WITH transaction_categories AS (
    SELECT 
      category,
      SUM(amount) AS total_amount
    FROM 
      transactions
    WHERE 
      EXTRACT(YEAR FROM transacted_at) = year_param
      AND EXTRACT(MONTH FROM transacted_at) = month_param
    GROUP BY 
      category
  ),
  -- Get expense totals by category
  expense_categories AS (
    SELECT 
      category,
      SUM(amount) AS total_amount
    FROM 
      expenses
    WHERE 
      EXTRACT(YEAR FROM spent_at) = year_param
      AND EXTRACT(MONTH FROM spent_at) = month_param
    GROUP BY 
      category
  ),
  -- Combine all categories
  all_categories AS (
    SELECT DISTINCT category FROM transaction_categories
    UNION
    SELECT DISTINCT category FROM expense_categories
  )
  -- Generate report
  SELECT 
    ac.category,
    COALESCE(tc.total_amount, 0) AS income,
    COALESCE(ec.total_amount, 0) AS expenses,
    COALESCE(tc.total_amount, 0) - COALESCE(ec.total_amount, 0) AS net
  FROM 
    all_categories ac
  LEFT JOIN 
    transaction_categories tc ON ac.category = tc.category
  LEFT JOIN 
    expense_categories ec ON ac.category = ec.category
  ORDER BY 
    ac.category;
END;
$$ LANGUAGE plpgsql;

-- Function to get year-over-year comparison
CREATE OR REPLACE FUNCTION public.get_year_over_year_comparison(current_year_param integer, previous_year_param integer)
RETURNS TABLE (
  metric text,
  current_year_value numeric,
  previous_year_value numeric,
  difference numeric,
  percentage_change numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH current_year_data AS (
    SELECT 
      'Income' AS metric,
      (SELECT COALESCE(SUM(amount), 0) FROM transactions 
       WHERE EXTRACT(YEAR FROM transacted_at) = current_year_param) AS value
    UNION ALL
    SELECT 
      'Expenses' AS metric,
      (SELECT COALESCE(SUM(amount), 0) FROM expenses 
       WHERE EXTRACT(YEAR FROM spent_at) = current_year_param) AS value
    UNION ALL
    SELECT 
      'Net Income' AS metric,
      (
        (SELECT COALESCE(SUM(amount), 0) FROM transactions 
         WHERE EXTRACT(YEAR FROM transacted_at) = current_year_param) -
        (SELECT COALESCE(SUM(amount), 0) FROM expenses 
         WHERE EXTRACT(YEAR FROM spent_at) = current_year_param)
      ) AS value
  ),
  previous_year_data AS (
    SELECT 
      'Income' AS metric,
      (SELECT COALESCE(SUM(amount), 0) FROM transactions 
       WHERE EXTRACT(YEAR FROM transacted_at) = previous_year_param) AS value
    UNION ALL
    SELECT 
      'Expenses' AS metric,
      (SELECT COALESCE(SUM(amount), 0) FROM expenses 
       WHERE EXTRACT(YEAR FROM spent_at) = previous_year_param) AS value
    UNION ALL
    SELECT 
      'Net Income' AS metric,
      (
        (SELECT COALESCE(SUM(amount), 0) FROM transactions 
         WHERE EXTRACT(YEAR FROM transacted_at) = previous_year_param) -
        (SELECT COALESCE(SUM(amount), 0) FROM expenses 
         WHERE EXTRACT(YEAR FROM spent_at) = previous_year_param)
      ) AS value
  )
  SELECT 
    cy.metric,
    cy.value AS current_year_value,
    py.value AS previous_year_value,
    cy.value - py.value AS difference,
    CASE 
      WHEN py.value = 0 THEN NULL -- Avoid division by zero
      ELSE ((cy.value - py.value) / NULLIF(py.value, 0)) * 100
    END AS percentage_change
  FROM 
    current_year_data cy
  JOIN 
    previous_year_data py ON cy.metric = py.metric;
END;
$$ LANGUAGE plpgsql; 