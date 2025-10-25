-- Add test birthday data to existing contacts
-- This script adds birthdays to existing contacts for testing

-- First, let's add birthdays to some existing contacts
DO $$
DECLARE
  contact_record RECORD;
  birthday_dates DATE[] := ARRAY[
    CURRENT_DATE + INTERVAL '1 day',      -- Tomorrow
    CURRENT_DATE + INTERVAL '2 days',     -- Day after tomorrow
    CURRENT_DATE + INTERVAL '3 days',     -- 3 days from now
    CURRENT_DATE + INTERVAL '5 days',     -- 5 days from now
    CURRENT_DATE + INTERVAL '7 days',     -- 1 week from now
    CURRENT_DATE - INTERVAL '1 year' + INTERVAL '1 day',  -- Birthday tomorrow (last year)
    CURRENT_DATE - INTERVAL '2 years' + INTERVAL '3 days', -- Birthday in 3 days (2 years ago)
    CURRENT_DATE - INTERVAL '25 years' + INTERVAL '5 days', -- Birthday in 5 days (25 years ago)
    '1990-01-15'::DATE,                   -- Static birthday
    '1985-12-25'::DATE,                   -- Christmas birthday
    '1992-07-04'::DATE,                   -- 4th of July birthday
    '1988-03-17'::DATE                    -- St. Patrick's Day birthday
  ];
  i INTEGER := 1;
BEGIN
  -- Update existing contacts with birthdays
  FOR contact_record IN (
    SELECT id, first_name, last_name 
    FROM public.contacts 
    WHERE date_of_birth IS NULL 
    ORDER BY created_at 
    LIMIT 12
  ) LOOP
    UPDATE public.contacts 
    SET date_of_birth = birthday_dates[i]
    WHERE id = contact_record.id;
    
    RAISE NOTICE 'Added birthday % to contact % % (ID: %)', 
      birthday_dates[i], contact_record.first_name, contact_record.last_name, contact_record.id;
    
    i := i + 1;
    IF i > array_length(birthday_dates, 1) THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- If we don't have enough contacts, create some test contacts with birthdays
  IF i <= array_length(birthday_dates, 1) THEN
    FOR j IN i..array_length(birthday_dates, 1) LOOP
      INSERT INTO public.contacts (first_name, last_name, email, date_of_birth, lifecycle)
      VALUES (
        CASE j
          WHEN 1 THEN 'John'
          WHEN 2 THEN 'Jane'
          WHEN 3 THEN 'Michael'
          WHEN 4 THEN 'Sarah'
          WHEN 5 THEN 'David'
          WHEN 6 THEN 'Emily'
          WHEN 7 THEN 'Chris'
          WHEN 8 THEN 'Amanda'
          WHEN 9 THEN 'Robert'
          WHEN 10 THEN 'Lisa'
          WHEN 11 THEN 'Kevin'
          WHEN 12 THEN 'Rachel'
          ELSE 'Test'
        END,
        CASE j
          WHEN 1 THEN 'Smith'
          WHEN 2 THEN 'Johnson'
          WHEN 3 THEN 'Williams'
          WHEN 4 THEN 'Brown'
          WHEN 5 THEN 'Jones'
          WHEN 6 THEN 'Garcia'
          WHEN 7 THEN 'Miller'
          WHEN 8 THEN 'Davis'
          WHEN 9 THEN 'Rodriguez'
          WHEN 10 THEN 'Wilson'
          WHEN 11 THEN 'Martinez'
          WHEN 12 THEN 'Anderson'
          ELSE 'User'
        END,
        LOWER(
          CASE j
            WHEN 1 THEN 'john.smith'
            WHEN 2 THEN 'jane.johnson'
            WHEN 3 THEN 'michael.williams'
            WHEN 4 THEN 'sarah.brown'
            WHEN 5 THEN 'david.jones'
            WHEN 6 THEN 'emily.garcia'
            WHEN 7 THEN 'chris.miller'
            WHEN 8 THEN 'amanda.davis'
            WHEN 9 THEN 'robert.rodriguez'
            WHEN 10 THEN 'lisa.wilson'
            WHEN 11 THEN 'kevin.martinez'
            WHEN 12 THEN 'rachel.anderson'
            ELSE 'test.user'
          END || '@testchurch.com'
        ),
        birthday_dates[j],
        'member'
      );
      
      RAISE NOTICE 'Created test contact with birthday %', birthday_dates[j];
    END LOOP;
  END IF;
END $$;

-- Show the results
SELECT 
  id,
  first_name,
  last_name,
  email,
  date_of_birth,
  CASE 
    WHEN date_of_birth IS NULL THEN 'No birthday'
    WHEN EXTRACT(MONTH FROM date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE) 
         AND EXTRACT(DAY FROM date_of_birth) = EXTRACT(DAY FROM CURRENT_DATE) THEN 'Today!'
    WHEN EXTRACT(MONTH FROM date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE + INTERVAL '1 day') 
         AND EXTRACT(DAY FROM date_of_birth) = EXTRACT(DAY FROM CURRENT_DATE + INTERVAL '1 day') THEN 'Tomorrow'
    WHEN date_of_birth IS NOT NULL THEN 
      CASE 
        WHEN EXTRACT(MONTH FROM date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE) 
             AND EXTRACT(DAY FROM date_of_birth) > EXTRACT(DAY FROM CURRENT_DATE) THEN 
          (EXTRACT(DAY FROM date_of_birth) - EXTRACT(DAY FROM CURRENT_DATE))::TEXT || ' days'
        ELSE 'Not this week'
      END
  END AS birthday_status
FROM public.contacts 
WHERE date_of_birth IS NOT NULL
ORDER BY date_of_birth;

SELECT 'Test birthday data added successfully! Check the dashboard for upcoming birthdays.' AS status; 