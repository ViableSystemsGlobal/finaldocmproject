-- Finance Management SQL Queries
-- This file contains useful SQL queries for managing and reporting on financial data

-- ========================
-- TRANSACTIONS QUERIES
-- ========================

-- Get all transactions for current year, ordered by date
SELECT 
  t.id,
  t.amount,
  t.currency,
  t.category,
  t.payment_method,
  t.transacted_at,
  COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '') AS donor_name
FROM 
  transactions t
LEFT JOIN 
  contacts c ON t.contact_id = c.id
WHERE 
  EXTRACT(YEAR FROM t.transacted_at) = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY 
  t.transacted_at DESC;

-- Get transaction totals by month for the current year
SELECT 
  TO_CHAR(t.transacted_at, 'Month') AS month,
  EXTRACT(MONTH FROM t.transacted_at) AS month_num,
  SUM(t.amount) AS total_amount
FROM 
  transactions t
WHERE 
  EXTRACT(YEAR FROM t.transacted_at) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY 
  month, month_num
ORDER BY 
  month_num;

-- Get transaction totals by category for current year
SELECT 
  t.category,
  SUM(t.amount) AS total_amount
FROM 
  transactions t
WHERE 
  EXTRACT(YEAR FROM t.transacted_at) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY 
  t.category
ORDER BY 
  total_amount DESC;

-- Get top donors for current year
SELECT 
  COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '') AS donor_name,
  SUM(t.amount) AS total_donated
FROM 
  transactions t
LEFT JOIN 
  contacts c ON t.contact_id = c.id
WHERE 
  EXTRACT(YEAR FROM t.transacted_at) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND t.contact_id IS NOT NULL
GROUP BY 
  donor_name
ORDER BY 
  total_donated DESC
LIMIT 10;

-- ========================
-- EXPENSES QUERIES
-- ========================

-- Get all expenses for current year, ordered by date
SELECT 
  e.id,
  e.amount,
  e.category,
  e.vendor,
  e.spent_at,
  e.notes
FROM 
  expenses e
WHERE 
  EXTRACT(YEAR FROM e.spent_at) = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY 
  e.spent_at DESC;

-- Get expense totals by month for the current year
SELECT 
  TO_CHAR(e.spent_at, 'Month') AS month,
  EXTRACT(MONTH FROM e.spent_at) AS month_num,
  SUM(e.amount) AS total_amount
FROM 
  expenses e
WHERE 
  EXTRACT(YEAR FROM e.spent_at) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY 
  month, month_num
ORDER BY 
  month_num;

-- Get expense totals by category for current year
SELECT 
  e.category,
  SUM(e.amount) AS total_amount
FROM 
  expenses e
WHERE 
  EXTRACT(YEAR FROM e.spent_at) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY 
  e.category
ORDER BY 
  total_amount DESC;

-- ========================
-- ASSETS QUERIES
-- ========================

-- Get all assets with current book value
SELECT 
  a.id,
  a.name,
  a.purchase_date,
  a.cost,
  a.accumulated_depreciation,
  (a.cost - a.accumulated_depreciation) AS book_value,
  a.depreciation_method,
  a.life_years
FROM 
  assets a
ORDER BY 
  a.purchase_date DESC;

-- Get total book value of all assets
SELECT 
  SUM(a.cost - a.accumulated_depreciation) AS total_book_value
FROM 
  assets a;

-- ========================
-- COMBINED FINANCE QUERIES
-- ========================

-- Get financial summary for current year
SELECT
  (SELECT SUM(amount) FROM transactions WHERE EXTRACT(YEAR FROM transacted_at) = EXTRACT(YEAR FROM CURRENT_DATE)) AS total_income,
  (SELECT SUM(amount) FROM expenses WHERE EXTRACT(YEAR FROM spent_at) = EXTRACT(YEAR FROM CURRENT_DATE)) AS total_expenses,
  (
    (SELECT SUM(amount) FROM transactions WHERE EXTRACT(YEAR FROM transacted_at) = EXTRACT(YEAR FROM CURRENT_DATE)) - 
    (SELECT SUM(amount) FROM expenses WHERE EXTRACT(YEAR FROM spent_at) = EXTRACT(YEAR FROM CURRENT_DATE))
  ) AS net_income,
  (SELECT SUM(cost - accumulated_depreciation) FROM assets) AS total_asset_value;

-- Get monthly financial summary for current year
WITH monthly_transactions AS (
  SELECT 
    EXTRACT(MONTH FROM transacted_at) AS month_num,
    TO_CHAR(transacted_at, 'Month') AS month_name,
    SUM(amount) AS income
  FROM 
    transactions
  WHERE 
    EXTRACT(YEAR FROM transacted_at) = EXTRACT(YEAR FROM CURRENT_DATE)
  GROUP BY 
    month_num, month_name
),
monthly_expenses AS (
  SELECT 
    EXTRACT(MONTH FROM spent_at) AS month_num,
    TO_CHAR(spent_at, 'Month') AS month_name,
    SUM(amount) AS expenses
  FROM 
    expenses
  WHERE 
    EXTRACT(YEAR FROM spent_at) = EXTRACT(YEAR FROM CURRENT_DATE)
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

-- ========================
-- DASHBOARD METRICS QUERIES
-- ========================

-- Year-to-date financial overview
SELECT
  'YTD Income' AS metric,
  (SELECT SUM(amount) FROM transactions WHERE EXTRACT(YEAR FROM transacted_at) = EXTRACT(YEAR FROM CURRENT_DATE)) AS value
UNION ALL
SELECT
  'YTD Expenses' AS metric,
  (SELECT SUM(amount) FROM expenses WHERE EXTRACT(YEAR FROM spent_at) = EXTRACT(YEAR FROM CURRENT_DATE)) AS value
UNION ALL
SELECT
  'YTD Net Income' AS metric,
  (
    (SELECT SUM(amount) FROM transactions WHERE EXTRACT(YEAR FROM transacted_at) = EXTRACT(YEAR FROM CURRENT_DATE)) - 
    (SELECT SUM(amount) FROM expenses WHERE EXTRACT(YEAR FROM spent_at) = EXTRACT(YEAR FROM CURRENT_DATE))
  ) AS value
UNION ALL
SELECT
  'Total Asset Value' AS metric,
  (SELECT SUM(cost - accumulated_depreciation) FROM assets) AS value; 