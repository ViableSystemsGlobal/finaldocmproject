# QR Code Member Submission System - Setup Guide

## 🎯 Overview
A complete system for collecting member details via QR code with admin approval workflow.

**Flow:** QR Code → Public Form → Admin Review → Approved Contacts

---

## ✅ What's Been Built

### 1. **Database Table** ✨
- **Table:** `contact_submissions`
- **Location:** `create_contact_submissions_table.sql`
- **Fields:**
  - Personal: first_name, last_name, email, phone, date_of_birth, location, occupation
  - Status: pending/approved/rejected
  - Tracking: submitted_at, reviewed_at, reviewed_by, admin_notes
- **RLS Policies:**
  - ✅ Public can INSERT (submit form)
  - ✅ Authenticated can SELECT/UPDATE/DELETE (admin review)

### 2. **Website - Public Form** 🌐
- **URL:** `https://docmchurch.org/submit-details`
- **File:** `apps/web/src/app/submit-details/page.tsx`
- **Component:** `apps/web/src/components/forms/SubmitDetailsForm.tsx`
- **Features:**
  - Beautiful, mobile-optimized design
  - 3 required fields (first_name, last_name, email)
  - 4 optional fields (phone, date_of_birth, location, occupation)
  - Client-side validation
  - Success/error handling
  - Duplicate detection

### 3. **API Route** 🔌
- **Endpoint:** `/api/submit-contact`
- **File:** `apps/web/src/app/api/submit-contact/route.ts`
- **Features:**
  - POST method for submissions
  - Email validation
  - Duplicate checking (both pending submissions and existing contacts)
  - Error handling
  - Logging

### 4. **Admin Review Page** 👨‍💼
- **URL:** `http://localhost:3001/people/pending-contacts`
- **File:** `apps/admin/src/app/(admin)/people/pending-contacts/page.tsx`
- **Features:**
  - Statistics dashboard (pending/approved/rejected counts)
  - Sortable table of all submissions
  - View details dialog
  - Approve action (creates contact with lifecycle='member')
  - Reject action (marks as rejected)
  - Admin notes field
  - Real-time refresh

### 5. **QR Code Generator** 📱
- **URL:** `http://localhost:3001/tools/qr-code`
- **File:** `apps/admin/src/app/(admin)/tools/qr-code/page.tsx`
- **Features:**
  - Beautiful gradient QR code
  - Customizable size (200px - 1000px)
  - Download as PNG (digital use)
  - Download as SVG (print quality)
  - Print function with formatted page
  - URL preview and copy
  - Usage tips and placement ideas

### 6. **Navigation** 🧭
- **Updated:** `apps/admin/src/components/Layout/AdminLayout.tsx`
- **New Menu Items:**
  - People → Pending Contacts (with UserCheck icon)
  - Tools → QR Code Generator (new section)

---

## 🚀 Setup Instructions

### Step 1: Create Database Table
1. Open your Supabase Dashboard → SQL Editor
2. Copy the contents of `create_contact_submissions_table.sql`
3. Run the SQL script
4. You should see success message: "✅ contact_submissions table created successfully!"

### Step 2: Verify Table Creation
Run this query in Supabase SQL Editor:
```sql
SELECT * FROM contact_submissions LIMIT 1;
```
You should see an empty result (no errors).

### Step 3: Test the Website Form
1. Open: `https://docmchurch.org/submit-details` (production)
   - Or: `http://localhost:3000/submit-details` (development)
2. Fill in the form with test data
3. Submit
4. You should see: "Thank You! 🎉"

### Step 4: Review in Admin
1. Open: `http://localhost:3001/people/pending-contacts`
2. You should see your test submission in the table
3. Click on the row to view details
4. Click "Approve & Add to Contacts"
5. Check `/people/contacts` - your submission should be there!

### Step 5: Generate QR Code
1. Go to: `http://localhost:3001/tools/qr-code`
2. The QR code for `https://docmchurch.org/submit-details` is auto-generated
3. Download as PNG or SVG
4. Test scanning with your phone - should open the form

---

## 📱 How to Use

### For Church Staff:
1. **Generate QR Code:**
   - Admin → Tools → QR Code Generator
   - Download PNG for digital use (bulletins, screens)
   - Download SVG for printing (posters, large banners)

2. **Place QR Code:**
   - Church bulletins
   - Welcome desk signage
   - Digital screens/presentations
   - Event materials
   - Social media graphics

3. **Review Submissions:**
   - Admin → People → Pending Contacts
   - Review details
   - Add admin notes if needed
   - Approve (adds to contacts) or Reject

### For Members:
1. Scan QR code with phone camera
2. Fill out the form (3 required, 4 optional fields)
3. Submit
4. Wait for admin approval
5. Welcome to the community! 🎉

---

## 🎨 QR Code Usage Ideas

### Digital Placements:
- 📺 Display screens in lobby
- 📱 Church app home screen
- 💻 Website homepage
- 📧 Email signatures
- 🎥 Livestream overlays

### Print Placements:
- 📄 Weekly bulletins
- 🪧 Welcome desk table tents
- 🚪 Entry door posters
- 🪑 Seat cards
- 📋 Event registration tables
- 🎁 Welcome packets

---

## 🔧 Technical Details

### Database Schema:
```sql
contact_submissions (
  id UUID PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  location TEXT,
  occupation TEXT,
  status TEXT DEFAULT 'pending', -- pending/approved/rejected
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  tenant_id UUID NOT NULL
)
```

### API Response:
**Success (201):**
```json
{
  "success": true,
  "message": "Your details have been submitted successfully!",
  "submissionId": "uuid-here"
}
```

**Error (400/409/500):**
```json
{
  "error": "Error message here",
  "code": "DUPLICATE_SUBMISSION" // optional
}
```

### Duplicate Prevention:
- ✅ Checks if email exists in pending submissions
- ✅ Checks if email exists in contacts table
- ✅ Returns appropriate error message

---

## 📊 Approval Workflow

```
┌─────────────┐
│ Member Scans│
│   QR Code   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Fill Form  │
│  & Submit   │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│  Pending    │────▶│ Admin Reviews│
│ Submission  │     │   Details    │
└─────────────┘     └──────┬───────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
              ┌──────────┐  ┌──────────┐
              │ APPROVE  │  │  REJECT  │
              └────┬─────┘  └────┬─────┘
                   │             │
                   ▼             ▼
         ┌──────────────┐  ┌──────────┐
         │ Add to       │  │ Mark as  │
         │ Contacts     │  │ Rejected │
         │ (lifecycle:  │  └──────────┘
         │  member)     │
         └──────────────┘
```

---

## 🐛 Troubleshooting

### Issue: "Failed to submit your details"
**Solution:**
1. Check if `contact_submissions` table exists in Supabase
2. Verify RLS policies are set correctly (run the SQL script again)
3. Check browser console for errors
4. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env`

### Issue: "No pending submissions showing in admin"
**Solution:**
1. Check if you're logged in to admin
2. Refresh the page
3. Check browser console for errors
4. Verify RLS policy allows authenticated users to SELECT

### Issue: "QR code not displaying"
**Solution:**
1. Check if `qr-code-styling` package is installed
2. Run: `cd apps/admin && pnpm install`
3. Restart the dev server
4. Check browser console for errors

### Issue: "Approve button not working"
**Solution:**
1. Check if `contacts` table exists
2. Verify user has permission to insert contacts
3. Check browser console for errors
4. Verify `tenant_id` is set correctly

---

## 📈 Statistics & Tracking

### View Submission Stats:
```sql
-- Total submissions by status
SELECT 
  status, 
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM contact_submissions
GROUP BY status;

-- Submissions over time (last 30 days)
SELECT 
  DATE(submitted_at) as date,
  COUNT(*) as submissions
FROM contact_submissions
WHERE submitted_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(submitted_at)
ORDER BY date DESC;

-- Average approval time
SELECT 
  AVG(EXTRACT(EPOCH FROM (reviewed_at - submitted_at)) / 3600) as avg_hours
FROM contact_submissions
WHERE status = 'approved';
```

---

## 🎉 Success Metrics

After implementing this system, you can track:
- 📊 Number of submissions per week/month
- ⏱️ Average time from submission to approval
- ✅ Approval rate (approved vs rejected)
- 📱 Engagement rate (scans vs submissions)
- 🎯 Most popular placement locations (via UTM parameters in QR URL)

---

## 🔒 Security Features

✅ **Client-side validation** - Fast feedback for users
✅ **Server-side validation** - Protect against malicious requests
✅ **RLS policies** - Database-level security
✅ **Duplicate prevention** - Avoid spam submissions
✅ **Email validation** - Ensure valid contact info
✅ **Audit trail** - Track who approved/rejected and when
✅ **Admin notes** - Document decisions

---

## 🚀 Next Steps (Optional Enhancements)

### Future Features:
1. **Email Notifications:**
   - Notify admin when new submission arrives
   - Notify submitter when approved/rejected

2. **Bulk Actions:**
   - Approve/reject multiple submissions at once
   - Export submissions to Excel

3. **Custom Fields:**
   - Allow admins to add custom questions to form
   - Store in `custom_fields` JSON column

4. **Analytics Dashboard:**
   - Submission trends over time
   - Approval rate metrics
   - Popular submission times

5. **QR Code Tracking:**
   - Add UTM parameters to track which QR code was scanned
   - Analytics on most effective placements

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify all environment variables are set
4. Ensure database table and RLS policies are created correctly

---

## ✅ Checklist

Before going live:
- [ ] Database table created in Supabase
- [ ] Test submission from website form works
- [ ] Test approval workflow in admin works
- [ ] Approved submission appears in Contacts
- [ ] QR code generates and downloads correctly
- [ ] QR code scans correctly on mobile devices
- [ ] Print a test QR code and verify it scans
- [ ] Brief church staff on approval process
- [ ] Place QR codes in strategic locations
- [ ] Monitor first few submissions

---

**System Status:** ✅ READY FOR DEPLOYMENT

**Created:** October 24, 2025
**Version:** 1.0.0

