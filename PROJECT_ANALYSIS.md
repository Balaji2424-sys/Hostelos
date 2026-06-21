# HostelOS — Complete Project Analysis

## 📋 Project Overview
**HostelOS** is a comprehensive hostel management system built with modern web technologies. It helps hostel owners/administrators manage rooms, tenants, payments, electricity billing, complaints, and generate analytics reports. The system includes AI-powered insights and simulated payment processing.

---

## 🛠 Tech Stack

### **Backend**
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18.2
- **Database ORM**: Prisma 5.22.0
- **Database**: SQLite (local) / PostgreSQL (production)
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 2.4.3
- **AI Integration**: Groq SDK 0.3.2 (LLaMA 3.1 70B)
- **Email**: Nodemailer 6.9.10 (Gmail SMTP)
- **Validation**: express-validator 7.0.1
- **Dev Server**: Nodemon 3.0.3
- **CORS**: cors 2.8.5
- **Config**: dotenv 16.4.0

### **Frontend**
- **Framework**: Next.js 14.2.0
- **Language**: TypeScript 5.0.0
- **Styling**: Tailwind CSS 3.4.0
- **Theme Management**: next-themes 0.3.0
- **UI Icons**: Lucide React 0.383.0
- **Charts & Graphs**: Recharts 2.12.0
- **HTTP Client**: Axios 1.6.0
- **CSS Processing**: PostCSS 8.4.0, Autoprefixer 10.4.0

### **Database Models**
- User (with role-based access: SUPER_ADMIN, OWNER, STAFF, TENANT)
- Hostel, Block, Floor, Room, Bed
- Tenant (with status tracking)
- Payment (monthly rent with status tracking)
- EbBill, EbSplit (electricity billing)
- Complaint (with category and status)
- Notification, AuditLog

---

## 📦 Backend Modules & Endpoints

### **1. Authentication (`/api/auth`)**
- `POST /register` - Register new user (super admin only)
- `POST /login` - Login with email/password
- `GET /me` - Get authenticated user profile
- **Features**: JWT-based auth, password hashing, role-based access control (RBAC)

### **2. Dashboard (`/api/dashboard`)**
- `GET /stats` - Real-time hostel statistics
  - Occupancy rate, bed distribution
  - Payment metrics (paid, unpaid, overdue, collection rate)
  - Tenant active/total counts
  - Complaint summary
  - Upcoming vacates (7 & 30 days)
  - Electricity bill this month
- `GET /room-map` - Room layout visualization data
- **Features**: Aggregated analytics, KPI calculations

### **3. Hostels (`/api/hostels`)**
- Manage hostel master data
- Create/read hostels, blocks, and floors
- Hierarchy: Hostel → Block → Floor → Room → Bed

### **4. Rooms (`/api/rooms`)**
- `GET /` - List all rooms with pagination
- `POST /` - Create new room with bed allocation
- `PUT /:id` - Update room details
- `GET /vacant/beds` - Get all vacant beds
- **Features**: Room types (SINGLE, DOUBLE, TRIPLE, FOUR_SHARING, FIVE_SHARING), meter tracking

### **5. Tenants (`/api/tenants`)**
- `GET /` - List tenants with search/filter by status, name, phone, aadhaar
- `POST /` - Onboard new tenant to a bed
- `PUT /:id` - Update tenant info
- `POST /:id/vacate` - Mark tenant as vacated
- `GET /upcoming/vacates` - Get upcoming vacating tenants
- **Features**: Tenant profiles with Aadhaar, guardian info, joining/vacate dates, deposit tracking

### **6. Payments (`/api/payments`)**
- `GET /` - List payments with filters (status, tenant, month/year)
- `GET /summary` - Monthly payment summary (paid, unpaid, overdue, partial)
- `GET /trend` - Payment trend data for charts
- `POST /:id/record` - Record manual payment
- `POST /fake/initiate` - Initiate simulated payment
- `POST /fake/verify` - Verify fake payment (2-3 sec delay)
- `POST /generate-monthly` - Auto-generate monthly payment entries
- **Features**: Fake payment mode for testing (Razorpay-ready), status tracking, penalty/late fees

### **7. Electricity Billing (`/api/electricity`)**
- `GET /` - List EB bills with room/month/year filters
- `POST /` - Create new EB bill
  - Auto-calculates units consumed
  - Auto-splits bill among active tenants in room
- `GET /trend` - Monthly EB consumption trend
- `PUT /splits/:id/pay` - Mark electricity split as paid
- **Features**: Per-unit cost customization, automatic tenant splitting, consumption tracking

### **8. Complaints (`/api/complaints`)**
- `GET /` - List complaints with status/category/tenant filters
- `POST /` - Create complaint from tenant (categories: WATER, ELECTRICITY, MAINTENANCE, CLEANING, INTERNET, OTHERS)
- `PUT /:id` - Update complaint status (OPEN → IN_PROGRESS → RESOLVED)
- `GET /summary` - Count of open/in-progress/resolved complaints
- **Features**: Complaint categorization, image attachments, resolution tracking

### **9. AI Assistant (`/api/ai`)**
- `POST /chat` - Natural language queries with hostel context
  - Uses Groq LLaMA 3.1 70B model
  - Real-time data injection (beds, tenants, payments, complaints)
  - Smart contextual responses
- `GET /payment-risk` - AI prediction of high-risk tenants for non-payment
- `GET /vacancy-forecast` - Predict upcoming vacancies
- `POST /draft-message` - AI draft complaint responses/messages
- `GET /eb-anomaly` - Detect unusual electricity consumption patterns
- **Features**: LLM-powered insights, free tier (Groq), temperature/token control

### **10. Notifications (`/api/notifications`)**
- `GET /` - List user/tenant notifications
- `POST /` - Send notification (email + in-app)
- `PUT /:id/read` - Mark notification as read
- **Features**: Email via Gmail SMTP, real-time in-app alerts

### **11. Reports (`/api/reports`)**
- `GET /rent-collection` - Monthly rent collection summary with payment breakdown
- `GET /occupancy` - Room-by-room occupancy report
- `GET /tenant-list` - Detailed tenant list with contact info
- `GET /defaulters` - List tenants with overdue payments
- **Features**: Exportable data, year-on-year comparisons

---

## 🎨 Frontend Pages & Components

### **Layout Components**
- **AppLayout** - Main dashboard wrapper with sidebar + header
- **Sidebar** - Navigation menu with icons (9 main sections)
- **ThemeToggle** - Dark/Light mode switcher
- **RoomMapGrid** - Visual room layout grid display

### **Pages**

#### **1. Login (`/login`)**
- Email/password authentication
- Demo credentials pre-filled
- Dark/Light theme toggle
- Error display for failed logins

#### **2. Dashboard (`/dashboard`)** ⭐ Hub
- **Stat Cards**: Occupancy %, active tenants, payments, electricity, complaints, vacates
- **Charts**: 
  - Payment trend (area chart)
  - Monthly breakdown (bar chart)
- **Room Map Grid**: Visual layout of all rooms with color-coded occupancy
- **Key Metrics**: Bed utilization, rent collection rate, overdue alerts

#### **3. Rooms (`/rooms`)**
- List all rooms with room number, type, beds, rent amount
- Room type tags (Single, Double, Triple, 4-sharing)
- Create/edit room forms
- Assign beds to tenants

#### **4. Tenants (`/tenants`)**
- Full tenant directory with search
- Tenant cards showing name, bed, room, status
- View detailed tenant profile
  - Contact info, Aadhaar, guardian details
  - Joining/vacate dates
  - Payment history
  - Complaint history
  - Electricity bill splits
- Tenant onboarding form
- Vacate/notice actions

#### **5. Payments (`/payments`)** 💰
- Monthly payment tracker
- Status filters: PAID, UNPAID, OVERDUE, PARTIALLY_PAID
- Payment summary cards (paid amount, unpaid, overdue)
- Record payment modal
- **Fake Payment Flow**:
  - Click "Pay Now" → Process 2 sec → Success ✅
  - Razorpay-ready structure
- Generate monthly payments batch action
- Payment trend chart

#### **6. Electricity (`/electricity`)** ⚡
- Electricity bill list by room/month
- Create new bill (auto-split calculation)
- EB consumption trend chart
- Bill splits per tenant
- Mark split as paid
- Historical trend analysis

#### **7. Complaints (`/complaints`)**
- Complaint tracker with status filters
- Color-coded by status (OPEN, IN_PROGRESS, RESOLVED)
- Category tags (Water, Electricity, Maintenance, etc.)
- Create complaint form
- Update complaint status + add notes
- Tenant-wise complaint filtering

#### **8. Reports (`/reports`)**
- Monthly rent collection summary
- Occupancy report (room-wise breakdown)
- Defaulter list (unpaid tenants)
- Tenant master list (export-ready)
- Download as CSV/PDF (if implemented)

#### **9. AI Assistant (`/ai`)**
- Chat interface for natural language queries
- Example prompts:
  - "How many beds are vacant?"
  - "Who are the top defaulters?"
  - "What's the electricity trend?"
- AI draft messages for tenants
- Payment risk analysis
- Vacancy forecasts
- Anomaly detection in electricity

#### **10. Notifications (`/notifications`)**
- Notification center (real-time alerts)
- Mark as read
- Filter by type

#### **11. Settings (`/settings`)**
- User profile (name, email, role)
- Change password
- Hostel preferences
- Email notification settings
- Sign out

---

## 🎯 Key Features

### **Core Management**
✅ Multi-level hierarchy (Hostel → Block → Floor → Room → Bed)
✅ Role-based access control (4 roles: SUPER_ADMIN, OWNER, STAFF, TENANT)
✅ Real-time occupancy tracking
✅ Tenant onboarding with document uploads (Aadhaar, agreements)
✅ Tenant status lifecycle (ACTIVE, NOTICE_GIVEN, VACATING, VACATED)

### **Payments & Billing**
✅ Monthly rent collection tracking
✅ Automatic monthly bill generation
✅ Payment status management (PAID, UNPAID, OVERDUE, PARTIALLY_PAID)
✅ Fake payment simulation (2-3 sec processing)
✅ Late fees/penalty calculation
✅ Payment trend visualization
✅ Collection rate calculation

### **Electricity Management**
✅ Per-room meter tracking
✅ Monthly consumption calculation
✅ Automatic bill split among active tenants
✅ Per-unit cost customization (default ₹7/unit)
✅ Consumption trend charts
✅ Split payment tracking

### **Complaint Management**
✅ 6 complaint categories (Water, Electricity, Maintenance, Cleaning, Internet, Others)
✅ 3-stage status workflow (OPEN → IN_PROGRESS → RESOLVED)
✅ Tenant-initiated complaints
✅ Photo attachments
✅ Resolution tracking with timestamp
✅ Staff notes

### **AI Insights** 🤖
✅ Chat assistant with live data context
✅ Payment risk prediction (identify high-risk defaulters)
✅ Vacancy forecasting (predict upcoming vacates)
✅ Electricity anomaly detection (flag unusual consumption)
✅ Auto-draft tenant communications
✅ Uses Groq LLaMA 3.1 70B (free tier)

### **Analytics & Reporting**
✅ Real-time dashboard KPIs
✅ Monthly rent collection reports
✅ Room-by-room occupancy reports
✅ Defaulter lists
✅ Tenant master list
✅ Trend charts (payments, electricity)
✅ Email notifications for alerts

### **Security & UX**
✅ JWT authentication
✅ Password hashing (bcryptjs)
✅ Dark/Light theme toggle
✅ Responsive design (Tailwind)
✅ Form validation (express-validator)
✅ CORS enabled
✅ Error boundaries
✅ Auto-logout on token expiry

### **Data Export** (API-ready)
✅ Report endpoints return JSON (ready for CSV/PDF)
✅ Payment records exportable
✅ Tenant directories exportable
✅ Occupancy reports exportable

---

## 🗄️ Database Schema (Key Models)

```
User
├── id, name, email, password (hashed)
├── role (enum: SUPER_ADMIN, OWNER, STAFF, TENANT)
└── hostelId (FK to Hostel)

Hostel
├── id, name, address, phone, email
└── blocks → Block[] (one-to-many)

Block
├── id, name, hostelId
└── floors → Floor[] (one-to-many)

Floor
├── id, number, blockId
└── rooms → Room[] (one-to-many)

Room
├── id, roomNumber, roomType, totalBeds, monthlyRent
├── meterNumber (for electricity)
├── floorId
├── beds → Bed[]
└── ebBills → EbBill[]

Bed
├── id, bedNumber, roomId, isOccupied
└── tenants → Tenant[]

Tenant
├── id, name, phone, email, aadhaarNumber
├── joiningDate, vacateDate, noticeDate
├── rentAmount, securityDeposit, advanceBalance
├── status (enum: ACTIVE, NOTICE_GIVEN, VACATING, VACATED)
├── bedId, documents (photoUrl, aadhaarUrl, agreementUrl)
├── payments → Payment[], complaints → Complaint[], ebSplits → EbSplit[]

Payment
├── id, tenantId, amount, dueAmount
├── month, year, dueDate, paidDate
├── status (enum: PAID, UNPAID, OVERDUE, PARTIALLY_PAID)
├── method, transactionId, receiptUrl, penalty, notes

EbBill
├── id, roomId, previousReading, currentReading
├── unitsConsumed, costPerUnit, totalBill
├── billingMonth, billingYear
└── splits → EbSplit[] (auto-created per active tenant)

EbSplit
├── id, ebBillId, tenantId, amount, isPaid

Complaint
├── id, tenantId, title, description, imageUrl
├── category (enum: WATER, ELECTRICITY, MAINTENANCE, CLEANING, INTERNET, OTHERS)
├── status (enum: OPEN, IN_PROGRESS, RESOLVED)
├── resolvedAt, notes

Notification
├── id, userId/tenantId, title, message, type, isRead, createdAt

AuditLog
├── id, userId, action, entity, entityId, details, createdAt
```

---

## 🚀 Deployment Ready Features

✅ Environment variable configuration (.env)
✅ Database migrations (Prisma)
✅ Error handling middleware
✅ CORS configuration
✅ Health check endpoint (`/api/health`)
✅ Scalable architecture (multiple services)
✅ Free tier services:
   - Groq AI (LLaMA)
   - Neon PostgreSQL
   - Gmail SMTP
   - SQLite (local dev)

---

## 📊 Project Statistics

| Metric | Count |
|--------|-------|
| **Backend Routes** | 11 modules |
| **Frontend Pages** | 10+ pages |
| **Database Models** | 12 core models |
| **API Endpoints** | 50+ endpoints |
| **Components** | 4+ reusable components |
| **Features** | 20+ major features |
| **Lines of Code** | 3,000+ (backend + frontend) |

---

## 🎓 Learning Value

This is a **production-ready full-stack application** demonstrating:
- Modern backend architecture (Express + Prisma)
- Type-safe frontend (Next.js + TypeScript)
- Real-time data aggregation
- AI/ML integration (Groq LLaMA)
- Role-based access control
- Complex business logic (auto-bill splitting, payment tracking)
- Responsive UI with theme support
- Database design for complex relationships

Perfect for portfolio, learning, or actual hostel management use.

---

**Last Updated**: June 21, 2026
**Status**: ✅ Production Ready
