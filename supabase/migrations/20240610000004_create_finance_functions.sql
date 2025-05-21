-- Function to calculate the sum of transactions for the current year
CREATE OR REPLACE FUNCTION public.sum_transactions_ytd()
RETURNS numeric AS $$
DECLARE
  total numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total
  FROM public.transactions
  WHERE EXTRACT(YEAR FROM transacted_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate the sum of expenses for the current year
CREATE OR REPLACE FUNCTION public.sum_expenses_ytd()
RETURNS numeric AS $$
DECLARE
  total numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total
  FROM public.expenses
  WHERE EXTRACT(YEAR FROM spent_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate the current book value of all assets
CREATE OR REPLACE FUNCTION public.sum_asset_book_values()
RETURNS numeric AS $$
DECLARE
  total numeric;
BEGIN
  SELECT COALESCE(SUM(cost - accumulated_depreciation), 0)
  INTO total
  FROM public.assets;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql; 