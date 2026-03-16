# RoboVoTech — Youth Interactive Landing Page

Production-ready learner app and lightweight backend for the **AI & Robotics Technician Certification** program in Walton County, FL. The app now includes curriculum browsing, learner authentication, progress tracking, Stripe-backed certification checkout, and the existing admissions/admin workflows.

## Quick Start

Run the app with Node 14.17+:

```bash
node server.js
```

Then open [http://localhost:3000](http://localhost:3000).

The server hosts the landing page, learner dashboard, curriculum API, authentication endpoints, certification checkout flow, and admissions lead capture.

If you only want to preview the static page with no backend, you can still open `robovotech-youth.html` directly in a browser.

## Backend Features

- Real `POST /api/interest-submissions` lead capture
- Server-side validation and honeypot spam protection
- Duplicate detection for repeat submissions from the same contact
- Local JSON persistence with no external database required
- Admin dashboard for triage, notes, and follow-up tracking
- Admin-only JSON, patch, and CSV export endpoints
- Health endpoint with aggregate lead counts
- Learner registration and login with signed cookie sessions
- Curriculum catalog sourced from the RoboVoTech curriculum structure
- Learner dashboard with saved module completion state
- Stripe checkout sessions for paid certification testing
- Stripe webhook support for marking testing orders as paid

## Learner Auth + Testing Setup

Set these before starting the server if you want the full learner and checkout flow:

```bash
SESSION_SECRET=change-me \
STRIPE_SECRET_KEY=sk_test_xxx \
STRIPE_WEBHOOK_SECRET=whsec_xxx \
node server.js
```

Optional pricing overrides:

```bash
CORE_CERT_TEST_FEE_CENTS=19900
MICRO_CERT_TEST_FEE_CENTS=7900
ADVANCED_CERT_TEST_FEE_CENTS=14900
```

Routes:

- `/` — curriculum-driven landing page and learner auth
- `/dashboard` — learner dashboard (requires sign-in)
- `/admin` — staff admissions dashboard
- `POST /api/certification-checkout` — create Stripe Checkout session
- `POST /api/stripe/webhook` — mark completed Stripe orders as paid

## Admin Workflow

Set an admin key before starting the server:

```bash
ADMIN_API_KEY=change-me node server.js
```

Then open [http://localhost:3000/admin](http://localhost:3000/admin).

The dashboard lets you:

- Search across name, email, phone, interest, and notes
- Filter the lead queue by pipeline status
- Switch between active, archived, or all leads
- Update status, follow-up date, and internal notes
- Archive, restore, or permanently delete leads
- Export the full lead list as CSV

If you want to call the API directly:

```bash
curl -H "x-admin-key: change-me" http://localhost:3000/api/interest-submissions
curl -X PATCH -H "x-admin-key: change-me" -H "Content-Type: application/json" \
  --data '{"status":"contacted","followUpDate":"2026-03-20","notes":"Scheduled callback."}' \
  http://localhost:3000/api/interest-submissions/<submission-id>
curl -H "x-admin-key: change-me" http://localhost:3000/api/interest-submissions.csv
```

## Verification

```bash
node test/interest-submissions.test.js
```

## What's Inside

- `robovotech-youth.html` — marketing page and frontend form flow
- `admin.html` — lead-management dashboard for staff
- `server.js` — dependency-free Node HTTP server
- `lib/interest-submissions.js` — validation, dedupe, filter, summary, update, CSV helpers
- `test/interest-submissions.test.js` — backend unit tests

Frontend highlights:

- **Curriculum Catalog** — Core modules, youth track, micro-credentials, advanced pathways
- **Learner Auth** — Registration, login, signed cookie sessions, dashboard access
- **Learner Dashboard** — Progress tracking, testing store, order history
- **Testing Checkout** — Stripe-backed purchase flow for certification attempts
- **Interest Form** — Existing admissions lead capture preserved
- **Admin Dashboard** — Search, triage, notes, follow-up dates, and CSV export

## Tech

| Layer | Stack |
|-------|-------|
| Fonts | Space Grotesk, JetBrains Mono (Google Fonts CDN) |
| Icons | Font Awesome 6.5.1 (CDN) |
| Animations | AOS 2.3.4 (CDN) |
| JS | Vanilla — zero frameworks |
| Backend | Node.js `http` + filesystem JSON storage |
| Responsive | Tested 390px–1440px |

## Colors

| Token | Hex | Role |
|-------|-----|------|
| Navy | `#0f172a` | Background |
| Blue | `#2563eb` | Primary accent |
| Orange | `#f97316` | CTA / highlights |
| Cyan | `#06b6d4` | Secondary accent |
| Amber | `#f59e0b` | Stats |
| Lime | `#84cc16` | Success |

## License

© 2026 Good Samaritan Institute — Walton County, FL
