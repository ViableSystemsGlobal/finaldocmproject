# Complete Integrated Church System Architecture

This document consolidates the end-to-end architecture plans for the DOCM Complete Integrated Church System (CICS), covering guiding principles, technology stack, data domains, UI modules, navigation, integration patterns, and deployment workflows. Use this as a single reference for Cursor AI prompts and ongoing development.

---

## 10. Domain-Specific Flows & Database Structures

Below is a summary of the key user flows and the underlying tables/fields for each major domain in CICS. Use this as a reference when writing queries, UI code, and Cursor AI prompts.

### 10.1 People Domain

**Primary Flows**

* **Soul Winning → Visitor → Member**: Contact created → soul\_winning row inserted (saved flag, inviter) → follow-up workflow → visitor row inserted → member row inserted → welcome workflow.
* **Follow-Up**: staff creates follow\_up → assigned → notifications → status updates.
* **Group Management**: create group → add group\_membership rows → schedule meetings → record attendance.

**Key Tables & Fields**

```sql
people.contacts (
  id UUID PK,
  first_name TEXT, last_name TEXT,
  phone TEXT, email TEXT,
  tenant_id UUID, campus_id UUID,
  lifecycle TEXT,            -- 'soul','visitor','member'
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

people.soul_winning (
  contact_id UUID FK,
  created_at TIMESTAMPTZ,
  saved BOOL,
  inviter_type TEXT,
  inviter_contact_id UUID,
  inviter_name TEXT,
  notes TEXT
);

people.visitors (
  contact_id UUID FK,
  created_at TIMESTAMPTZ,
  first_visit DATE,
  converted BOOL,
  saved BOOL,
  notes TEXT
);

people.members (
  contact_id UUID FK,
  created_at TIMESTAMPTZ,
  joined_at DATE,
  notes TEXT
);

people.follow_ups (
  id UUID PK,
  contact_id UUID FK,
  type TEXT,
  status TEXT,
  assigned_to UUID,
  created_at TIMESTAMPTZ,
  next_action_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT
);

people.groups (
  id UUID PK,
  name TEXT,
  type TEXT,
  campus_id UUID,
  custom_fields JSONB,
  status TEXT
);

people.group_memberships (
  group_id UUID FK,
  contact_id UUID FK,
  role TEXT
);

people.transport_requests (
  id UUID PK,
  event_id UUID FK,
  contact_id UUID FK,
  pickup_location GEOGRAPHY,
  status TEXT,
  assigned_driver UUID,
  assigned_vehicle UUID,
  created_at TIMESTAMPTZ
);

people.mobile_app_users (
  id UUID PK,
  contact_id UUID FK,
  registered_at TIMESTAMPTZ,
  last_active TIMESTAMPTZ,
  status TEXT,
  devices JSONB
);
```

### 10.2 Events Domain

**Primary Flows**

* **Event Creation & Recurrence**: insert events row → configure recurrence\_rule → system expands instances or handles on‑read.
* **Registration & Check-In**: user registers (registrations row) → event occurs → attendance records created.
* **Invitation & Transport**: invitations sent → transport\_requests created → route optimization → driver assignment.

**Key Tables & Fields**

```sql
events.events (
  id UUID PK,
  name TEXT,
  description TEXT,
  location TEXT,
  capacity INT,
  event_date TIMESTAMPTZ,
  is_recurring BOOL,
  recurrence_rule TEXT,
  recurrence_end DATE,
  recurrence_count INT,
  created_at TIMESTAMPTZ
);

events.event_images (
  id UUID PK,
  event_id UUID FK,
  url TEXT,
  alt_text TEXT,
  sort_order INT,
  created_at TIMESTAMPTZ
);

events.registrations (
  id UUID PK,
  event_id UUID FK,
  contact_id UUID FK,
  status TEXT,
  created_at TIMESTAMPTZ
);

events.invitations (
  id UUID PK,
  event_id UUID FK,
  recipient_contact_id UUID,
  channel TEXT,
  sent_at TIMESTAMPTZ,
  status TEXT
);

events.event_exceptions (
  id UUID PK,
  event_id UUID FK,
  occurrence_date TIMESTAMPTZ,
  override_data JSONB
);
```

### 10.3 Finance Domain

**Primary Flows**

* **Donation Processing**: user gives → Stripe webhook → finance.transactions Created → thank-you workflow.
* **Expense Approval**: staff submits expense → approver reviews → status updates → finance.bank\_accounts balance updated.
* **Budget vs. Actual**: budget\_lines loaded → periodic budget check jobs → variance alerts.

**Key Tables & Fields**

```sql
finance.chart_of_accounts (
  account_id TEXT PK,
  name TEXT,
  type TEXT,
  fund_id UUID,
  parent_id TEXT,
  created_at TIMESTAMPTZ
);

finance.bank_accounts (
  id UUID PK,
  name TEXT,
  institution TEXT,
  account_number TEXT,
  routing_number TEXT,
  currency TEXT,
  current_balance NUMERIC,
  created_at TIMESTAMPTZ
);

finance.budgets (
  id UUID PK,
  name TEXT,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ
);

finance.budget_lines (
  budget_id UUID FK,
  account_id TEXT FK,
  amount NUMERIC
);

finance.transactions (
  id UUID PK,
  contact_id UUID FK,
  type TEXT,
  category TEXT,
  amount NUMERIC,
  status TEXT,
  tx_ref TEXT,
  currency TEXT,
  created_at TIMESTAMPTZ
);

finance.expenses (
  id UUID PK,
  account_id TEXT FK,
  amount NUMERIC,
  vendor TEXT,
  status TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ
);

finance.assets (
  id UUID PK,
  name TEXT,
  category TEXT,
  acquisition_date DATE,
  cost NUMERIC,
  current_book_value NUMERIC,
  depreciation_method TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
);

finance.donor_statements (
  id UUID PK,
  donor_id UUID FK,
  year INT,
  pdf_url TEXT,
  generated_at TIMESTAMPTZ
);
```

### 10.4 Communications & Content

* **Email/SMS/WhatsApp**: `comms.messages`, `comms.templates`, `comms.campaigns`.
* **Page Builder**: `content.pages`, `content.page_sections` (config JSONB).
* **Media**: `media.assets`, `media.sermons` (YouTube sync).

---

## 11. Using This Document

* **Reference**: Use sections 4–10 for Cursor AI prompts or developer guidance.
* **Keep Updated**: As your schema or flows evolve, append here so output remains accurate.

---

*End of CICS Architecture Spec*

## 1. Guiding Principles

* **Single Source of Truth**: All data (people, events, giving, communications, content) lives in Supabase Postgres and Storage.
* **API-First, Headless**: Public site (Next.js), Admin dashboard (Next.js), and Mobile app (Expo) consume the same backend via secure APIs.
* **Prompt-Driven Development**: Each feature is defined by a Cursor AI prompt that generates schema, UI, tests, and docs in one PR.
* **Security by Default**: Supabase Auth + RLS, role-based permissions, encrypted webhooks, and audit logs from day one.
* **Modular & Extensible**: Each domain (People, Events, Finance, Communications, Content) is a self-contained schema slice, UI module, and CI pipeline.

---

## 2. Technology Stack & Deployment

| Layer                    | Technology                                                            |
| ------------------------ | --------------------------------------------------------------------- |
| **Web & Admin Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui             |
| **Mobile App**           | Expo (React Native), React Navigation                                 |
| **Backend & Database**   | Supabase (Postgres, Auth, Storage, Edge Functions, Realtime)          |
| **Payments**             | Stripe                                                                |
| **Messaging**            | Resend (Email), Twilio (SMS), 360dialog (WhatsApp), FCM (Push)        |
| **Maps & Routing**       | Google Maps Platform                                                  |
| **CI/CD & Previews**     | GitHub Actions, Cursor AI PR checks, Vercel Preview, Expo EAS Preview |
| **Observability**        | Sentry (Clients), Logflare (Edge), pg\_stat\_statements               |

---

## 3. Admin Navigation Sidebar

```
Dashboard

Reports & Analytics
 ├─ People Reports
 ├─ Attendance Reports
 ├─ Financial Reports
 ├─ Communication Reports
 └─ Custom Dashboards

People
 ├─ Members
 ├─ Visitors
 ├─ Ministries & Groups
 ├─ Attendance
 ├─ Discipleship Groups
 ├─ Outreach
 │   ├─ Follow-Ups
 │   ├─ Soul Winning
 │   └─ Prayer Requests
 ├─ Transport Requests
 └─ Mobile App Users

Events
 ├─ Calendar
 ├─ Registrations
 ├─ Invitations
 └─ Transport

Giving & Finance
 ├─ Giving & Income
 ├─ Expenses
 ├─ Assets
 ├─ Chart of Accounts
 ├─ Bank Accounts
 ├─ Budgets & Forecasts
 └─ Donor Statements

Communications
 ├─ Announcements
 ├─ Email Campaigns
 ├─ SMS Campaigns
 ├─ WhatsApp Campaigns
 └─ Push Notifications

Content & Media
 ├─ Pages
 ├─ Page Sections
 └─ Media Library

Settings
 ├─ Church Profile
 ├─ Roles & Permissions
 ├─ Custom Fields
 ├─ Message Templates
 ├─ Workflows
 ├─ Metrics Config
 ├─ Integrations (YouTube, Stripe, Maps)
 └─ Audit Logs & System
```

## 3.1 Main Dashboard

The **Dashboard** landing page provides a high-level overview and quick actions:

### 3.1.1 Metric Cards

* **Total Members**
* **New Members** (in selected period)
* **Attendance Rate** (unique attendees / total members)
* **Today's Events** (count of events scheduled today)
* **Total Giving Today** (sum of completed transactions)
* **Pending Follow-Ups** (count of follow\_up records with status = Pending)

### 3.1.2 Quick Actions

* **Add Member** → opens New Member form
* **Create Event** → opens Event creation wizard
* **Send Message** → opens Communications composer
* **Record Expense** → opens Expense entry form

### 3.1.3 Recent Activity Feed

A scrolling list showing the last 10 system events:

* New registrations
* Completed check-ins
* Recent transactions
* Follow-up status changes

### 3.1.4 Navigation Shortcuts

Tiles linking to: Members list, Visitors list, Event calendar, Finance overview

All dashboard data is tenant-scoped and refreshed in real-time via Supabase Realtime or periodic queries. ├─ Church Profile ├─ Roles & Permissions ├─ Custom Fields ├─ Message Templates ├─ Workflows ├─ Metrics Config ├─ Integrations (YouTube, Stripe, Maps) └─ Audit Logs & System

```

---

## 4. Data Domains

### 4.1 People Domain

- **people.contacts**: master table with `lifecycle` (`soul`/`visitor`/`member`) and common fields.
- **people.soul_winning**: rows per contact per outreach, with `saved`, `inviter_*` data.
- **people.visitors**: first visit, conversion flag, notes.
- **people.members**: join date, notes.
- **people.follow_ups**: universal follow-up logs tied to `contact_id`.
- **people.groups** & **people.group_memberships**: for small-group, ministry, discipleship groups.
- **people.transport_requests**: event-scoped ride requests; drivers, vehicles, route plans.
- **people.mobile_app_users**: tracks installs, devices, activity, status.

### 4.2 Events Domain

- **events.events**: event metadata, `is_recurring`, `recurrence_rule` (RRULE), `recurrence_end`/`count`.
- **events.event_images**: flyers & gallery images.
- **events.registrations**, **events.invitations**.
- **events.event_exceptions**: overrides for individual recurrence instances.

### 4.3 Finance Domain

- **finance.chart_of_accounts**: ledger accounts (Asset, Liability, Equity, Revenue, Expense).
- **finance.bank_accounts**: account details, current balance, reconciliation.
- **finance.budgets** & **finance.budget_lines** for planning & variance.
- **finance.transactions**: giving & income (Stripe webhooks); pledges.
- **finance.expenses**: records, approvals, payments (Stripe payouts).
- **finance.assets**: depreciation schedules, maintenance logs.
- **finance.donor_statements**: year-end PDF records.

### 4.4 Communications Domain

- **comms.messages**: logs for Email, SMS, WhatsApp, Push, Announcements.
- **comms.templates**: editable channel templates with token support.
- **comms.campaigns**: scheduled & one-off campaigns per channel.

### 4.5 Content & Media Domain

- **content.pages**: page metadata (slug, SEO, template).
- **content.page_sections**: ordered block builder (hero, carousel, grid, CTA).
- **media.assets**: images, docs in Supabase Storage.
- **media.sermons**: synced YouTube video metadata.

---

## 5. Public Website Structure & Sections

### Home (`/`)
1. Hero (image/video, headline, CTAs)
2. Upcoming Events Carousel
3. About Snapshot
4. Latest Sermon Preview
5. Get Involved Grid (4 image cards)
6. Newsletter Signup
7. Service Times & Map
8. Footer

### About (`/about`)
1. Banner
2. Story Timeline
3. Mission/Vision/Values
4. Leadership Team Grid
5. Statement of Faith Accordion
6. CTA

### Ministries (`/ministries`)
1. Hero + Filter
2. Ministry Cards Grid
3. CTA

### Events (`/events`)
1. Banner + Filters
2. Events List
3. Pagination

### Event Detail (`/events/[id]`)
1. Hero + Badges
2. Sticky Register CTA
3. Tabs: Overview, Registrations, Invitations, Transport, Gallery
4. Calendar Links

### Media Center (`/media`)
- **Sermons**: `/media/sermons` + `/media/sermons/[id]` (YouTube embed)
- **Blog**: `/media/blog` + `/media/blog/[slug]`
- **Gallery**: `/media/gallery`

### Give (`/give`)
1. Impact Hero
2. Giving Form (Stripe)
3. Why Give
4. FAQ
5. Testimonials

### Contact (`/contact`)
1. Contact Form
2. Prayer Request
3. Campus Info & Map

---

## 6. Mobile App Screens & Flows

### Authentication & Onboarding
- SplashScreen, IntroCarousel, Login OTP, InviteDeepLink

### Main Tabs
- **HomeScreen**: header, greeting, QuickActions, Event & Sermon Carousels, Check-In FAB
- **EventsTab**: EventsList, EventDetail (tabs)
- **SermonsTab**: SermonsList, SermonPlayer
- **GiveTab**: GiveForm → Stripe
- **MoreTab**: Profile, MyGroups, GroupDetail, CheckInHistory, RequestPrayer, MyPrayerRequests, RequestRide, Notifications, Settings

### Utility Screens
- CheckInScreen (QR/manual), JoinGroupScreen, RequestRideScreen

---

## 7. Integrations & Automations

- **Supabase Edge Functions**: Stripe & Twilio webhooks, cron workflows, route optimizer.
- **Next.js API Routes**: CRUD endpoints, on-demand revalidate.
- **YouTube Sync**: scheduled fetch into `media.sermons`.
- **Workflows** in Settings: Welcome, Follow-Ups, Birthday, Inactivity, Reports, Depreciation.

---

## 8. RLS & Permissions

- **Auth**: Supabase users tied to `contacts.id` for members.
- **Roles**: Admin, Staff, Finance, Approver, Viewer, Editor.
- **Policies**: `tenant_id = auth.tenant()` on all tables; table-specific usage filters (e.g. content pages published only).

---

## 9. CI/CD & Dev Workflow

- **pnpm workspaces + Turborepo** monorepo.
- **GitHub Actions**: preview DB + deploy, lint/tests, security scans.
- **Vercel**: web & admin previews & production.
- **Expo EAS**: mobile previews & production.
- **README**: root and per-app guides for local dev, env vars, deploying.

---

This document should serve as your master reference for Cursor AI prompts and human developers alike—covering every slice of the Complete Integrated Church System. You can now refer to it at any time during development or enhancement planning.

```
