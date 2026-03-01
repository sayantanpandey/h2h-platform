# H2H Healthcare Platform

A comprehensive healthcare platform specializing in **Sports Rehabilitation**, **Pain Management**, **Physiotherapy**, and **Yoga** services across India.

## 🏥 Overview

H2H Healthcare is a production-ready platform that enables:
- **Online & Offline Consultations** - Video calls via Google Meet or clinic visits
- **Multi-Location Management** - 8+ cities with tier-based pricing
- **Appointment Scheduling** - Real-time availability with Google Calendar sync
- **Payment Processing** - Razorpay integration with automated receipts
- **Automated Notifications** - WhatsApp, SMS, and Email reminders

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Shadcn UI |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| **Payments** | Razorpay |
| **Notifications** | Twilio (WhatsApp/SMS), Resend (Email) |
| **Video Calls** | Google Meet API |
| **Scheduling** | Google Calendar API, FullCalendar |
| **Live Chat** | Tawk.to |
| **Analytics** | PostHog |
| **Deployment** | Vercel |

## 📁 Project Structure

```
h2h-platform/
├── docs/                    # Documentation
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/          # Auth pages (login, register)
│   │   ├── (dashboard)/     # Protected dashboards
│   │   ├── api/             # API routes
│   │   ├── booking/         # Booking flow
│   │   ├── services/        # Services pages
│   │   └── locations/       # Location pages
│   ├── components/          # React components
│   │   ├── ui/              # Shadcn UI components
│   │   ├── layout/          # Layout components
│   │   ├── dashboard/       # Dashboard components
│   │   └── shared/          # Shared components
│   ├── lib/                 # Utility libraries
│   │   ├── supabase/        # Supabase client
│   │   ├── twilio/          # WhatsApp/SMS
│   │   ├── resend/          # Email
│   │   └── google/          # Google APIs
│   ├── types/               # TypeScript types
│   └── constants/           # App constants
├── supabase/
│   ├── migrations/          # Database migrations
│   └── seed.sql             # Seed data
└── public/                  # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Razorpay account
- Twilio account
- Resend account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/h2h-platform.git
   cd h2h-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your API keys in `.env.local`

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the migration in `supabase/migrations/001_initial_schema.sql`
   - Run the seed data in `supabase/seed.sql`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the app**
   Visit [http://localhost:3000](http://localhost:3000)

## 🔐 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_id

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_SMS_NUMBER=+1234567890

# Resend
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@healtohealth.in

# Tawk.to
NEXT_PUBLIC_TAWK_PROPERTY_ID=your_property_id
NEXT_PUBLIC_TAWK_WIDGET_ID=your_widget_id

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## 👥 User Roles

| Role | Access |
|------|--------|
| **Super Admin** | Full system access, all locations, financial reports |
| **Location Admin** | Manage own location, doctors, appointments |
| **Doctor** | View appointments, patients, upload prescriptions |
| **Patient** | Book appointments, view history, download invoices |

## 💰 Cost Breakdown

| Service | Monthly Cost |
|---------|-------------|
| Supabase | ₹0 (Free tier) |
| Vercel | ₹0 (Free tier) |
| Twilio WhatsApp | ~₹600 (500 appointments) |
| Twilio SMS | ~₹500 (backup) |
| Resend | ₹0 (Free tier) |
| Tawk.to | ₹0 (Free forever) |
| PostHog | ₹0 (Free tier) |
| Domain | ~₹67/month |
| **Total** | **~₹1,200/month** |

## 📚 Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Database Schema](./docs/DATABASE.md)

## 🚀 Deployment

### Deploy to Vercel

1. **Push your code to GitHub**

2. **Connect your repository to Vercel**
   - Go to [vercel.com](https://vercel.com) → New Project → Import your repo

3. **Add environment variables in Vercel**
   - Project → **Settings** → **Environment Variables**
   - Add each variable from `.env.example` (use Production / Preview / Development as needed)
   - Vercel injects these at build & runtime — **never commit `.env` or `.env.local`**

4. **Deploy**
   ```bash
   npm run build   # test locally first
   ```
   Push to `main` to trigger automatic Vercel deployment.

5. **Cron jobs** (appointment reminders)
   - Set `CRON_SECRET` in Vercel and add to your cron endpoint for auth

## 📄 License

This project is proprietary software for H2H Healthcare.

---

Built with ❤️ for H2H Healthcare
