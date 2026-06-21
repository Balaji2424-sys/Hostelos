# HostelOS — Complete Setup Guide

## What's Built
- **Frontend**: Next.js 14 + TypeScript + Tailwind (Dark/Light theme)
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: PostgreSQL (free, local or Neon/Supabase)
- **AI**: Groq API + LLaMA 3.1 70B (free tier)
- **Payments**: Simulation mode (fake payments, Razorpay-ready)
- **Email**: Gmail SMTP via Nodemailer (free)

---

## Step 1 — Prerequisites (install once)

```bash
# Node.js 18+
https://nodejs.org/

# PostgreSQL (free)
# Option A: Local — https://www.postgresql.org/download/
# Option B: Free cloud — https://neon.tech  OR  https://supabase.com
```

---

## Step 2 — Clone / Extract project

```
hostel-mgmt/
├── backend/
└── frontend/
```

---

## Step 3 — Backend Setup

```bash
cd hostel-mgmt/backend
npm install
```

### Create `.env` (copy from `.env.example`)

```bash
cp .env.example .env
```

Edit `.env`:

```env
# PostgreSQL connection string
# Local:
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/hosteldb"
# Neon (free cloud):
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/hosteldb?sslmode=require"

JWT_SECRET="change-this-to-a-long-random-string-abc123xyz"
PORT=5000

# Your Groq API key — get free at https://console.groq.com
GROQ_API_KEY="gsk_xxxxxxxxxxxxxxxxxxxx"

# Gmail SMTP — use App Password (not your real password)
# Enable: https://myaccount.google.com/apppasswords
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password

FAKE_PAYMENT_MODE=true
```

### Initialize database

```bash
# Push schema to DB
npx prisma db push

# OR if you want proper migrations:
npx prisma migrate dev --name init

# Seed demo data (rooms, tenants, payments, complaints)
npm run db:seed

# Optional: open Prisma Studio to browse DB visually
npm run db:studio
```

### Run backend

```bash
npm run dev
# Running on http://localhost:5000
# Test: http://localhost:5000/api/health
```

---

## Step 4 — Frontend Setup

```bash
cd hostel-mgmt/frontend
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Run frontend

```bash
npm run dev
# Running on http://localhost:3000
```

---

## Step 5 — Login

Open http://localhost:3000

```
Email:    admin@hostel.com
Password: admin123
```

---

## Features Available

| Feature | Status |
|---------|--------|
| Dashboard with live stats | ✅ |
| Room occupancy map (Green/Red/Blue beds) | ✅ |
| Add rooms with auto bed generation | ✅ |
| Add tenants with bed assignment | ✅ |
| Fake payment simulation | ✅ |
| Record cash/manual payments | ✅ |
| Electricity bills + auto tenant split | ✅ |
| Complaints management | ✅ |
| AI Chat (Groq + LLaMA) | ✅ |
| AI payment risk analysis | ✅ |
| AI vacancy forecast | ✅ |
| AI EB anomaly detection | ✅ |
| Monthly payment generation | ✅ |
| Rent collection reports | ✅ |
| Annual summary with charts | ✅ |
| Occupancy reports | ✅ |
| CSV export | ✅ |
| Dark / Light theme toggle | ✅ |
| Notifications center | ✅ |
| Upcoming vacates tracking | ✅ |

---

## Enable Real Razorpay Payments (later)

1. Create account at https://razorpay.com (free)
2. Add to backend `.env`:
```env
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
FAKE_PAYMENT_MODE=false
```
3. The payment routes are already structured to swap in Razorpay.

---

## Free Hosting Options

### Database
- **Neon** — https://neon.tech (free PostgreSQL, 512MB)
- **Supabase** — https://supabase.com (free PostgreSQL, 500MB)

### Backend
- **Railway** — https://railway.app (free tier)
- **Render** — https://render.com (free tier, sleeps after 15min)

### Frontend
- **Vercel** — https://vercel.com (free, best for Next.js)

---

## Project Structure

```
backend/
├── server.js              # Entry point
├── middleware/auth.js     # JWT + RBAC
├── prisma/
│   ├── schema.prisma      # Full DB schema
│   └── seed.js            # Demo data
└── routes/
    ├── auth.js            # Login/Register
    ├── hostels.js         # Hostel/Block/Floor
    ├── rooms.js           # Room + Bed management
    ├── tenants.js         # Tenant CRUD + vacate
    ├── payments.js        # Payments + fake simulation
    ├── electricity.js     # EB bills + splits
    ├── complaints.js      # Complaints
    ├── dashboard.js       # Stats + room map
    ├── ai.js              # Groq AI endpoints
    ├── notifications.js   # Notification center
    └── reports.js         # Report generation

frontend/src/
├── app/
│   ├── login/             # Login page
│   ├── dashboard/         # Main dashboard
│   ├── rooms/             # Room management
│   ├── tenants/           # Tenant management
│   ├── payments/          # Payments + fake pay
│   ├── electricity/       # EB bills
│   ├── complaints/        # Complaints
│   ├── ai/                # AI assistant
│   ├── reports/           # Reports + charts
│   ├── notifications/     # Notifications
│   └── settings/          # Settings
├── components/
│   ├── ui/                # Sidebar, ThemeToggle, AppLayout
│   └── rooms/             # RoomMapGrid (bed visualization)
└── lib/
    ├── api.ts             # All API calls
    └── auth.tsx           # Auth context
```

---

## AI Features (Groq)

Get your FREE Groq API key at https://console.groq.com

Features powered by LLaMA 3.1 70B:
- **Chat assistant** — Ask anything about your hostel in natural language
- **Payment risk** — Identifies tenants likely to default
- **Vacancy forecast** — 30-day occupancy prediction with analysis
- **EB anomalies** — Detects unusual electricity consumption
- **Message drafts** — AI-written rent reminders and payment confirmations

---

## Next Steps (Phase 2)

1. Tenant self-service portal (separate login)
2. Real Razorpay integration
3. Email notifications (rent due, payment confirm)
4. PDF receipt generation
5. Mobile PWA
6. Multi-hostel support (already in DB schema)
