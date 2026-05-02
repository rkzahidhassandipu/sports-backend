# 🏋️ Gym Management Backend

Production-grade REST API — TypeScript · Express · PostgreSQL · Prisma · Better Auth · Stripe · Cloudinary · Nodemailer · Zod

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Database | PostgreSQL + Prisma ORM |
| Auth | Better Auth + JWT |
| Payments | Stripe |
| Media | Cloudinary |
| Email | Nodemailer (SMTP) |
| Validation | Zod |
| Logging | Winston |
| Security | Helmet · CORS · Rate Limiting |

---

## 🚀 Quick Start

### 1. Clone & install
```bash
git clone <repo-url>
cd gym-backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in all values in .env, including STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET
```

> If you see `Error: Neither apiKey nor config.authenticator provided`, make sure `.env` exists and `STRIPE_SECRET_KEY` is set.

### 3. Setup database
```bash
# Create PostgreSQL database
createdb gym_db

# Run migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Seed demo data
npm run prisma:seed
```

### 4. Run development server
```bash
npm run dev
# Server → http://localhost:5000
# Health → http://localhost:5000/api/v1/health
```

### 5. Build for production
```bash
npm run build
npm start
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gym.com | Admin@123456 |
| Coach | coach@gym.com | Coach@123456 |
| Trainer | trainer@gym.com | Trainer@123456 |
| Member | member@gym.com | Member@123456 |

Get via API: `GET /api/v1/auth/demo-credentials`

---

## 📋 API Endpoints (30+ APIs)

### 🔐 Auth (`/api/v1/auth`)
```
POST   /register              Register new user
POST   /login                 Login with credentials
POST   /logout                Logout
POST   /refresh-token         Refresh access token
POST   /forgot-password       Request password reset
POST   /reset-password        Reset password with token
GET    /verify-email?token=   Verify email address
POST   /resend-verification   Resend verification email
GET    /demo-credentials      Get demo login credentials
GET    /social/:provider      Social login (google/github/facebook)
GET    /me                    Get current user  [Auth]
POST   /change-password       Change password   [Auth]
GET    /sessions              View active sessions [Auth]
POST   /revoke-all-sessions   Logout everywhere [Auth]
```

### 👥 Users (`/api/v1/users`)
```
GET    /profile               Get own profile       [Auth]
PUT    /profile               Update profile        [Auth]
PUT    /profile/details       Update profile details [Auth]
POST   /profile/avatar        Upload avatar         [Auth]
DELETE /account               Delete own account    [Auth]
GET    /notifications         Get notifications     [Auth]
PATCH  /notifications/:id/read  Mark notification read [Auth]
PATCH  /notifications/read-all  Mark all read       [Auth]
GET    /activity              Activity log          [Auth]
GET    /                      List all users        [Admin]
GET    /:id                   Get user by ID        [Staff]
PATCH  /:id/role              Assign role           [Admin]
PATCH  /:id/status            Update status         [Admin]
DELETE /:id                   Delete user           [Admin]
```

### 🏋️ Sessions (`/api/v1/sessions`)
```
GET    /                      List sessions (filter/sort/paginate)
GET    /search?q=             Search sessions
GET    /:id                   Get session details
GET    /:id/reviews           Get session reviews
POST   /                      Create session        [Coach/Admin]
PUT    /:id                   Update session        [Coach/Admin]
PATCH  /:id/status            Update status         [Coach/Admin]
POST   /:id/cover             Upload cover image    [Coach/Admin]
DELETE /:id                   Delete session        [Admin]
GET    /coach/my-sessions     Coach's own sessions  [Coach/Admin]
POST   /:id/reviews           Submit review         [Auth - completed members only]
```

### 💪 Fitness (`/api/v1/fitness`)
```
GET    /my-records            Member's own records  [Auth]
GET    /my-progress           Progress summary      [Auth]
POST   /                      Create fitness record [Trainer/Coach/Admin]
GET    /member/:memberId      Member's records      [Trainer/Coach/Admin]
PUT    /:id                   Update record         [Trainer/Coach/Admin]
DELETE /:id                   Delete record         [Trainer/Coach/Admin]
GET    /performance/:memberId Performance report    [Coach/Admin]
GET    /trainer-summary       Trainer overview      [Trainer/Coach/Admin]
```

### 📅 Bookings (`/api/v1/bookings`)
```
POST   /                      Book a session        [Auth]
GET    /my                    My bookings           [Auth]
GET    /:id                   Get booking details   [Auth]
POST   /:id/cancel            Cancel booking        [Auth]
POST   /:id/checkout          Create Stripe checkout [Auth]
GET    /                      All bookings          [Staff]
PATCH  /:id/status            Update booking status [Staff]
POST   /webhook/stripe        Stripe webhook        [Public]
```

### 💳 Payments (`/api/v1/payments`)
```
GET    /my                    My payment history    [Auth]
GET    /my/invoice/:id        Download invoice      [Auth]
GET    /                      All payments          [Admin]
GET    /:id                   Payment details       [Auth]
POST   /:id/refund            Refund payment        [Admin]
GET    /stats/summary         Payment statistics    [Admin]
```

### 📊 Reports (`/api/v1/reports`)
```
GET    /dashboard/overview         KPIs overview      [Coach/Admin]
GET    /dashboard/revenue          Revenue chart      [Admin]
GET    /dashboard/bookings         Bookings chart     [Coach/Admin]
GET    /dashboard/members          Members chart      [Coach/Admin]
GET    /dashboard/sessions         Sessions by type   [Coach/Admin]
GET    /dashboard/tables/bookings  Bookings table     [Coach/Admin]
GET    /dashboard/tables/users     Users table        [Admin]
GET    /dashboard/tables/payments  Payments table     [Admin]
GET    /                           Reports list       [Admin]
POST   /generate                   Generate report    [Admin]
GET    /audit-logs                 Audit trail        [Admin]
GET    /activity                   Activity logs      [Admin]
```

### 📝 Blog (`/api/v1/blog`)
```
GET    /                      List posts
GET    /search?q=             Search posts
GET    /:slug                 Get post by slug
POST   /                      Create post           [Coach/Admin]
PUT    /:id                   Update post           [Coach/Admin]
PATCH  /:id/publish           Publish post          [Coach/Admin]
PATCH  /:id/unpublish         Unpublish post        [Coach/Admin]
DELETE /:id                   Delete post           [Coach/Admin]
```

### 🎫 Support (`/api/v1/support`)
```
POST   /                      Create ticket         [Auth]
GET    /my                    My tickets            [Auth]
GET    /:id                   Get ticket            [Auth]
POST   /:id/reply             Reply to ticket       [Auth]
POST   /:id/close             Close ticket          [Auth]
GET    /admin/all             All tickets           [Staff]
PATCH  /:id/status            Update ticket status  [Staff]
DELETE /:id                   Delete ticket         [Admin]
```

### 📧 Newsletter (`/api/v1/newsletter`)
```
POST   /subscribe             Subscribe
GET    /confirm?token=        Confirm subscription
POST   /unsubscribe           Unsubscribe
GET    /list                  Subscribers list      [Admin]
```

### 📬 Contact (`/api/v1/contact`)
```
POST   /                      Submit contact form
GET    /                      All submissions       [Staff]
GET    /:id                   Get submission        [Staff]
PATCH  /:id/read              Mark as read          [Staff]
DELETE /:id                   Delete submission     [Admin]
```

### 📄 Content (`/api/v1/content`)
```
GET    /privacy               Privacy policy
GET    /terms                 Terms of service
GET    /:key                  Get content by key
GET    /                      All content           [Admin]
POST   /                      Create content        [Admin]
PUT    /:key                  Update content        [Admin]
DELETE /:key                  Delete content        [Admin]
```

---

## 🗂️ Project Structure

```
gym-backend/
├── prisma/
│   ├── schema.prisma          # Database schema (8 core tables)
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── config/
│   │   ├── database.ts        # Prisma client
│   │   ├── logger.ts          # Winston logger
│   │   ├── cloudinary.ts      # Media upload config
│   │   └── stripe.ts          # Payment config
│   ├── lib/
│   │   ├── audit.ts           # Audit/activity/notification helpers
│   │   └── email.ts           # Email templates (Nodemailer)
│   ├── middleware/
│   │   ├── authenticate.ts    # JWT auth + role guards
│   │   ├── validate.ts        # Zod request validation
│   │   ├── errorHandler.ts    # Global error handler
│   │   ├── rateLimiter.ts     # Rate limiting
│   │   ├── requestLogger.ts   # HTTP request logging
│   │   └── notFound.ts        # 404 handler
│   ├── modules/               # Feature modules (modular pattern)
│   │   ├── auth/              # Authentication
│   │   ├── users/             # User management
│   │   ├── sessions/          # Gym sessions
│   │   ├── fitness/           # Fitness records
│   │   ├── bookings/          # Session bookings + Stripe
│   │   ├── payments/          # Payment history
│   │   ├── reports/           # Analytics & dashboard
│   │   ├── blog/              # Blog CRUD
│   │   ├── support/           # Support tickets
│   │   ├── newsletter/        # Newsletter
│   │   ├── contact/           # Contact forms
│   │   └── content/           # Static content (Privacy/Terms)
│   ├── utils/
│   │   ├── AppError.ts        # Custom error class
│   │   ├── ApiResponse.ts     # Standardized responses
│   │   ├── pagination.ts      # Pagination helper
│   │   └── validators.ts      # All Zod schemas
│   ├── app.ts                 # Express app setup
│   └── index.ts               # Server entry point
├── .env.example               # Environment variables template
├── package.json
└── tsconfig.json
```

---

## 🔒 Security Features

- **JWT Authentication** with access + refresh tokens (httpOnly cookies)
- **Role-based middleware** — Admin, Coach, Trainer, Receptionist, Member
- **Zod validation** on all request inputs
- **Helmet** secure HTTP headers
- **CORS** with whitelist
- **Rate limiting** — global (100/15min), auth (10/15min), upload (20/15min)
- **bcrypt** password hashing (12 rounds)
- **Stripe webhook** signature verification
- **Audit logs** for all sensitive operations
- **Graceful shutdown** with connection cleanup

---

## 🌿 Environment Variables

See `.env.example` for all required variables. Key ones:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/gym_db
JWT_SECRET=your-32-char-minimum-secret
STRIPE_SECRET_KEY=sk_test_...
CLOUDINARY_CLOUD_NAME=...
SMTP_USER=your@email.com
```

---

## 📝 License

