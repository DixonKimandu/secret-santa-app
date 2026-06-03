# Secret Santa App

A modern Christmas-themed Secret Santa application built with Next.js, featuring email-based OTP authentication, an interactive spinning wheel, Cloudflare Turnstile bot protection, role-based access control, and a **MongoDB Atlas** database accessed via **Prisma**.

## Features

- 🎄 **Christmas-Themed UI**: Red, white, and green design with festive animations
- 🎁 **Interactive Spinning Wheel**: 2D SVG pie chart wheel with smooth animations
- 📧 **Email OTP Authentication**: Secure OTP-based verification via Resend
- 🤖 **Bot Protection**: Cloudflare Turnstile on authentication endpoints
- 👤 **Admin Panel**: Manage participants with email addresses
- 👑 **Superadmin Panel**: View all matches, reset matching, and change passwords
- 🔒 **Role-Based Access**: Separate admin and superadmin roles with password management
- 💾 **MongoDB Database**: Persistent storage via Prisma
- 🎨 **Modern UI**: Framer Motion animations and confetti effects
- 🎯 **Auto-Match Display**: Users see their match automatically if they've already spun

## Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (free tier works)
- [Resend](https://resend.com) API key for sending emails
- [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) keys for bot protection

## Installation

1. Clone the repository and install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the environment template and fill in your credentials:

   ```bash
   cp .env.example .env.local
   ```

   **Required environment variables:**

   ```env
   # MongoDB Atlas connection string
   DATABASE_URL=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority

   # Resend email
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   RESEND_FROM=Secret Santa <onboarding@resend.dev>

   # Cloudflare Turnstile
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key-here
   TURNSTILE_SECRET_KEY=your-secret-key-here
   ```

   **MongoDB Atlas setup:**
   1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   2. Create a database user and allow network access (or use `0.0.0.0/0` for development)
   3. Copy the connection string into `DATABASE_URL`

   **Resend setup:**
   1. Sign up at [resend.com](https://resend.com)
   2. Create an API key in the dashboard
   3. Verify your domain, or use `onboarding@resend.dev` for testing

   **Turnstile setup:**
   1. Create a site in the [Cloudflare Turnstile dashboard](https://dash.cloudflare.com/?to=/:account/turnstile)
   2. Copy the Site Key and Secret Key into your `.env.local`

3. Push the Prisma schema to your database:

   ```bash
   pnpm prisma:push
   ```

4. Run the development server:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Default Passwords

On first run, the app seeds these default credentials:

- **Admin**: `admin123`
- **Superadmin**: `superadmin123`

⚠️ **Change these immediately after first login**, especially before deploying to production.

## Usage

### Admin Flow

1. Go to `/admin` and log in with the admin password
2. Add participants with their name and email
3. View the list of all participants

### Superadmin Flow

1. Go to `/superadmin` and log in with the superadmin password
2. View all matches in a table
3. Reset all matches if needed
4. Change admin or superadmin passwords via the "Change Password" button

### User Flow

1. Go to `/spin`
2. Enter your email address and complete Turnstile verification
3. Request an OTP and enter the 6-digit code from your email
4. Spin the wheel (or see your match if you've already spun)
5. Your match is displayed in a festive modal with confetti

## Database

The app uses MongoDB via Prisma. Collections:

- **Participant**: Names, emails, OTP codes, spin status, and match relationships
- **AdminSetting**: Hashed admin/superadmin passwords and settings

Useful commands:

```bash
pnpm prisma:push    # Sync schema to database
pnpm prisma:studio  # Open Prisma Studio GUI
```

## Security Notes

- OTP codes expire after 10 minutes and are single-use
- Cloudflare Turnstile verification is required on authentication endpoints
- Only superadmin can view all matches
- Admin passwords are hashed with bcrypt
- Admin auth uses Bearer tokens (the password itself) — change defaults before deploying

## Technology Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Database**: MongoDB Atlas with Prisma
- **Email**: Resend
- **Bot Protection**: Cloudflare Turnstile
- **Animations**: Framer Motion and canvas-confetti
- **Styling**: Tailwind CSS

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── admin/            # Admin page
│   ├── superadmin/       # Superadmin page
│   └── spin/             # User spin page
├── components/           # UI components (Wheel, Turnstile, etc.)
├── lib/                  # Database, email, and Turnstile utilities
├── prisma/               # Prisma schema
└── vercel.json           # Vercel deployment configuration
```

## Deployment (Vercel)

1. Push the repo to GitHub and import it in [Vercel](https://vercel.com)
2. Set these environment variables in the Vercel project settings:
   - `DATABASE_URL`
   - `RESEND_API_KEY`
   - `RESEND_FROM`
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - `TURNSTILE_SECRET_KEY`
3. Deploy — `prisma generate` runs automatically via the `postinstall` script

**MongoDB Atlas on Vercel:** Allow network access from anywhere (`0.0.0.0/0`) or add Vercel's IP ranges so serverless functions can reach your cluster.

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues with email, database, and Turnstile.

## License

MIT — see [LICENSE](./LICENSE).
