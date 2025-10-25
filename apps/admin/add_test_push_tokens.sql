-- Add test push tokens to mobile users for testing push notifications
-- This script adds test Expo push tokens to users who don't have any devices

UPDATE mobile_app_users 
SET devices = CASE 
  WHEN devices = '[]'::jsonb OR devices IS NULL THEN
    jsonb_build_array(
      jsonb_build_object(
        'device_id', 'test-device-' || id::text,
        'device_name', 'Test iPhone',
        'platform', 'ios',
        'os_version', '17.0',
        'app_version', '1.0.0',
        'push_token', 'ExponentPushToken[test-' || substring(id::text, 1, 8) || ']',
        'last_used', NOW(),
        'registered_at', NOW()
      )
    )
  ELSE devices
END,
updated_at = NOW()
WHERE status = 'active' 
  AND (devices = '[]'::jsonb OR devices IS NULL OR jsonb_array_length(devices) = 0);

-- Show results
SELECT 
  id,
  auth_user_id,
  jsonb_array_length(devices) as device_count,
  devices->0->>'push_token' as first_push_token,
  status
FROM mobile_app_users 
WHERE status = 'active'
ORDER BY created_at DESC; 