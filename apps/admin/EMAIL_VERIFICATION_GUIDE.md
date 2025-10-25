# Email Verification System for DOCM Church Mobile App

## Overview

This email verification system is designed for mobile app users to verify their email addresses using 6-digit codes sent via Hostinger SMTP. The system is centralized in the admin app and provides APIs that the mobile app can consume.

## Features

✅ **6-digit verification codes** (primary method)  
✅ **Hostinger SMTP integration** (cost-effective)  
✅ **Security**: Codes are hashed before storage  
✅ **Rate limiting**: 1-minute cooldown between sends  
✅ **Expiration**: 24-hour token expiry  
✅ **Beautiful email templates** with HTML and plain text  
✅ **Deep link support** (ready for future enhancement)  

## Database Schema

The system adds these fields to the `contacts` table:

```sql
email_verified BOOLEAN DEFAULT false
email_verification_token TEXT (stores hashed verification code)
email_verification_expires TIMESTAMPTZ
email_verification_sent_at TIMESTAMPTZ
```

## API Endpoints

### 1. Send Verification Email
**Endpoint:** `POST /api/auth/send-verification`

```json
{
  "email": "user@example.com",
  "firstName": "John",
  "contactId": "uuid-optional",
  "includeDeepLink": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully",
  "contactId": "user-uuid",
  "emailSent": true,
  "expiresAt": "2024-01-02T12:00:00Z"
}
```

### 2. Verify Email Code
**Endpoint:** `POST /api/auth/verify-email`

```json
{
  "email": "user@example.com",
  "verificationCode": "123456",
  "contactId": "uuid-optional"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully!",
  "contactId": "user-uuid",
  "email": "user@example.com",
  "firstName": "John",
  "verified": true
}
```

### 3. Resend Verification Email
**Endpoint:** `POST /api/auth/resend-verification`

```json
{
  "email": "user@example.com",
  "contactId": "uuid-optional"
}
```

## Testing

### Test the entire system:
```bash
curl -X POST http://localhost:3003/api/auth/test-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "firstName": "Test User"}'
```

### Test with a real email:
```bash
# 1. Send verification
curl -X POST http://localhost:3003/api/auth/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "firstName": "Your Name"}'

# 2. Check your email for the 6-digit code

# 3. Verify the code
curl -X POST http://localhost:3003/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "verificationCode": "123456"}'
```

## Mobile App Integration

### Registration Flow
1. User enters email and name in mobile app
2. App calls `POST /api/auth/send-verification`
3. User receives email with 6-digit code
4. User enters code in app
5. App calls `POST /api/auth/verify-email`
6. User is now verified and can access full app features

### Code Example (React Native)
```javascript
// Send verification
const sendVerification = async (email, firstName) => {
  const response = await fetch('http://your-admin-url:3003/api/auth/send-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, firstName })
  });
  return response.json();
};

// Verify code
const verifyEmail = async (email, verificationCode) => {
  const response = await fetch('http://your-admin-url:3003/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, verificationCode })
  });
  return response.json();
};
```

## Error Handling

The system handles these scenarios:
- **Invalid codes**: Returns error with helpful message
- **Expired codes**: Prompts user to request new code
- **Rate limiting**: Prevents spam with 1-minute cooldown
- **Already verified**: Graceful handling of duplicate verification
- **Network errors**: Proper error responses for debugging

## Security Features

- **Hashed storage**: Verification codes are hashed with SHA-256
- **Time expiration**: Codes expire after 24 hours
- **Rate limiting**: Prevents email spam
- **Contact isolation**: Each contact has their own verification state

## Email Template

The system sends beautiful HTML emails with:
- DOCM Church branding
- Large, easy-to-read verification code
- Clear instructions
- Professional styling
- Plain text fallback

## Hostinger SMTP Configuration

Uses existing Hostinger setup:
- **Host**: smtp.hostinger.com
- **Port**: 465 (secure)
- **Account**: no-reply@docmchurch.org (system emails)
- **Rate limit**: ~100-300 emails/hour (sufficient for church use)

## Next Steps

1. **Test the system** with real email addresses
2. **Run the database migration** in production
3. **Integrate with mobile app** registration flow
4. **Optional**: Add deep link support later for one-click verification

## Troubleshooting

### Common Issues:
- **Database errors**: Ensure migration has been run
- **Email not sending**: Check Hostinger SMTP credentials
- **Port conflicts**: Admin should run on 3003, web on 3001
- **CORS issues**: Configure CORS for mobile app domain

### Debug Mode:
Check admin server logs for detailed debugging information with emoji indicators:
- 📧 Email sending
- 🔑 Code generation  
- 🔍 Verification attempts
- ✅ Success
- ❌ Errors 