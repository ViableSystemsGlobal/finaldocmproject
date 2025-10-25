# 🌟 Word of the Year - Setup Guide

## 🎯 Overview
A beautiful, prominent section on your homepage displaying your church's annual spiritual theme with a linked sermon series.

---

## ✅ What's Been Built

### 1. **Database Table** 📊
- **Table:** `annual_themes`
- **File:** `create_word_of_year_table.sql`
- **Fields:**
  - year, theme_word, description
  - sermon_id (links to sermon)
  - scripture_reference
  - background_image_url
  - is_active (only one active at a time)
- **Features:**
  - ✅ Automatic trigger ensures only 1 active theme
  - ✅ Stores history of past years
  - ✅ RLS enabled (public can view active, admins can manage)

### 2. **Admin Management Page** 👨‍💼
- **URL:** `/settings/word-of-year`
- **File:** `apps/admin/src/app/(admin)/settings/word-of-year/page.tsx`
- **Features:**
  - Set year, word, description
  - Link to sermon series (dropdown)
  - Scripture reference field
  - Background image with preview
  - **Live preview** of how it looks on homepage
  - View past themes history

### 3. **API Route** 🔌
- **Endpoint:** `/api/word-of-year`
- **File:** `apps/web/src/app/api/word-of-year/route.ts`
- **Returns:** Active theme with sermon details

### 4. **Homepage Section** 🌐
- **Component:** `apps/web/src/components/sections/word-of-year.tsx`
- **Placement:** After Hero, Before Events (most visible!)
- **Features:**
  - Full-width dramatic section
  - Gradient background OR custom image
  - Huge bold word display
  - Scripture reference
  - Description
  - CTA button to sermon
  - Beautiful animations
  - Responsive design

---

## 🏗️ Homepage Structure (NEW)

```
1. Hero Section (Welcome!)
   ↓
2. 🌟 WORD OF THE YEAR ← NEW! (Most prominent placement)
   ↓
3. Upcoming Events
   ↓
4. Testimonials
5. About Snapshot
6. Latest Sermon
7. Get Involved
8. Newsletter
9. Location Map
```

---

## 🚀 Setup Instructions

### Step 1: Create Database Table
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `create_word_of_year_table.sql`
3. Run the SQL
4. Success! ✅

### Step 2: Set Your First Word of the Year
1. Login to admin: `http://localhost:3001/login`
2. Go to: `/settings/word-of-year`
3. Fill in:
   - **Year:** 2025
   - **Word:** "Rest" (or your word)
   - **Description:** What God is saying through this word
   - **Scripture:** Matthew 11:28-30 (optional)
   - **Sermon:** Select related sermon (optional)
   - **Background Image:** URL (optional)
4. Click "Save Word of the Year"

### Step 3: View on Homepage
1. Open: `https://docmchurch.org` (or `http://localhost:3000`)
2. The Word of the Year section appears right after the hero!
3. Beautiful, full-width, can't miss it! ✨

---

## 🎨 Design Specifications

### **Visual Style:**
- **Size:** Full-width section, 24rem padding (96px top/bottom)
- **Background:** 
  - Default: Purple → Pink gradient
  - Optional: Custom image with 70-80% dark overlay
- **Word Display:** 
  - Desktop: 9xl font (128px)
  - Tablet: 8xl font (96px)
  - Mobile: 7xl font (72px)
  - All uppercase, white text
- **Description:** 
  - 2xl font (24px)
  - Max 3 lines
  - White with 90% opacity
- **CTA Button:**
  - White background, dark text
  - "Watch Message Series" with play icon
  - Hover: Scale up 105%

### **Content Hierarchy:**
1. Year badge (small, top)
2. The Word (MASSIVE, center)
3. Scripture (medium, yellow highlight)
4. Description (large, readable)
5. CTA button (prominent)

---

## 📱 Responsive Behavior

**Desktop (1024px+):**
- Word: 9xl (128px)
- Full description visible
- Button + sermon info side-by-side

**Tablet (768px-1023px):**
- Word: 8xl (96px)
- Full description
- Buttons stack vertically

**Mobile (<768px):**
- Word: 7xl (72px)
- Description may wrap more
- Full-width button

---

## 🎬 Example Usage

### **Example 1: "Rest" Theme**
```
Year: 2025
Word: "Rest"
Scripture: Matthew 11:28-30
Description: This year, God is calling us to find rest in Him, 
to pause from our striving and trust in His perfect goodness 
and faithfulness. In a world that never stops, we choose to 
rest in His presence.
Sermon: "Finding Rest in God" series
Background: Peaceful nature image
```

### **Example 2: "Breakthrough" Theme**
```
Year: 2025
Word: "Breakthrough"
Scripture: Isaiah 43:19
Description: God is doing a new thing! This year is about 
breaking through barriers, stepping into new territories, 
and seeing God move in unprecedented ways.
Sermon: "Breakthrough Faith" series  
Background: Sunrise/mountain image
```

### **Example 3: "Unity" Theme**
```
Year: 2025
Word: "Unity"
Scripture: Psalm 133:1
Description: As one body in Christ, we're called to walk in 
unity, love, and harmony. Together, we're stronger, and God 
commands His blessing where there is unity.
Sermon: "One Church, One Mission" series
Background: People holding hands image
```

---

## 🔧 Admin Features

### **Management Page:** `/settings/word-of-year`

**Features:**
- ✅ Simple form (year, word, description)
- ✅ Sermon dropdown (all published sermons)
- ✅ Scripture reference field
- ✅ Background image with preview
- ✅ **Live preview** of homepage display
- ✅ Save button
- ✅ View past themes section

**Smart Features:**
- Auto-deactivates old theme when saving new one
- Only one theme active at a time
- Keeps history of all past themes
- Preview shows exactly how it will look

---

## 🎯 User Flow

### **For Admins:**
1. Go to `/settings/word-of-year`
2. Fill in the form
3. See live preview
4. Save
5. Done! Instantly visible on homepage

### **For Visitors:**
1. Visit homepage
2. See Word of the Year right after welcome
3. Read the theme
4. Click "Watch Message Series"
5. Engage with the spiritual focus!

---

## 📊 Benefits

✅ **Unified Focus**
- Entire church aligned on one theme
- Reinforces message throughout the year

✅ **Prominent Visibility**
- First thing visitors see after landing
- Can't be missed
- Sets spiritual tone immediately

✅ **Easy to Update**
- Update once per year (or as needed)
- Simple admin interface
- Instant website updates

✅ **Connects to Content**
- Links directly to sermon series
- Scripture reference included
- Creates cohesive experience

✅ **Historical Record**
- View past years' themes
- Track spiritual journey
- Reference for future planning

---

## 🚀 Quick Start Checklist

- [ ] Run SQL: `create_word_of_year_table.sql` in Supabase
- [ ] Go to: `/settings/word-of-year` in admin
- [ ] Fill in 2025 word (e.g., "Rest")
- [ ] Add description
- [ ] Select related sermon (optional)
- [ ] Add scripture reference (optional)
- [ ] Save
- [ ] View homepage - it's there! ✨

---

## 🎨 Customization Options

### **Background:**
- Use default gradient (purple → pink)
- Upload custom image (recommended: 1920x600px)
- Use solid color with CSS update

### **Text:**
- Word length: 1-3 words works best
- Description: 2-3 sentences optimal
- Scripture: Short reference (e.g., "John 3:16")

### **Sermon Link:**
- Can link to single sermon or series
- Optional (can skip if no sermon yet)
- Automatically gets sermon title, speaker, thumbnail

---

## 💡 Pro Tips

1. **Change annually:** Update in January for new year
2. **Coordinate with leadership:** Get pastor's input on the word
3. **Build sermon series:** Create matching sermon series
4. **Use high-quality images:** If using custom background
5. **Keep description concise:** 2-3 sentences max for readability
6. **Test on mobile:** Ensure word isn't too long for small screens

---

## 🐛 Troubleshooting

### "Word not showing on homepage"
**Solution:**
1. Check if theme is set to `is_active = true` in admin
2. Clear browser cache (Cmd+Shift+R)
3. Verify SQL was run in correct Supabase project

### "Can't save in admin"
**Solution:**
1. Check if database table exists
2. Verify you're logged in
3. Check browser console for errors

### "Background image not showing"
**Solution:**
1. Verify image URL is publicly accessible
2. Check image format (jpg, png, webp)
3. Try a different image URL

---

## 📈 Future Enhancements (Optional)

### **Could Add:**
- Email announcement when word changes
- Social media sharing (auto-generate graphics)
- Prayer points related to the theme
- Study guide download
- Multiple languages
- Video announcement from pastor
- Monthly focus areas under main theme

---

## ✅ System Status

**Created:** October 24, 2025  
**Version:** 1.0.0  
**Status:** ✅ READY FOR DEPLOYMENT

**Files:**
- `create_word_of_year_table.sql`
- `apps/admin/src/app/(admin)/settings/word-of-year/page.tsx`
- `apps/web/src/app/api/word-of-year/route.ts`
- `apps/web/src/components/sections/word-of-year.tsx`
- `apps/web/src/app/page.tsx` (updated)

---

**🎉 Your homepage now has a powerful, prominent Word of the Year section!**

