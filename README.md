# Chalet Noel Booking App

A collaborative chalet booking application built with Next.js and Neon PostgreSQL.

## Features

- 📅 Calendar-based booking system for specific dates
- 💰 Non-linear pricing model
- 💳 Payment tracking via Interac
- 👥 Multi-user support with real-time updates
- 🔒 Admin dashboard (password: `admin123`)
- 📱 Responsive design with Tailwind CSS

## Deployment Instructions

### Step 1: Set up Neon Database

1. Go to [https://console.neon.tech](https://console.neon.tech)
2. Create a new account or sign in
3. Click **"Create Project"**
4. Name your project (e.g., "chalet-booking")
5. Select a region closest to you
6. Click **"Create Project"**
7. Copy the connection string (starts with `postgresql://`)

### Step 2: Initialize Database

1. In your Neon dashboard, click **"SQL Editor"**
2. Copy the contents of `schema.sql` from this project
3. Paste it into the SQL Editor
4. Click **"Run"** to create the tables

### Step 3: Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with GitHub (or create account)
3. Click **"Add New Project"**
4. Click **"Import Git Repository"**
5. Select this repository
6. In **"Environment Variables"**, add:
   - Name: `POSTGRES_URL`
   - Value: (paste your Neon connection string from Step 1)
7. Click **"Deploy"**

### Step 4: Done!

Your app will be live at: `https://your-project-name.vercel.app`

## Admin Access

- Password: `admin123`
- Click "Admin Access" on the login screen

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

3. Add your Neon connection string to `.env.local`:
   ```
   POSTGRES_URL="your-neon-connection-string"
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Technology Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Database**: Neon PostgreSQL
- **Hosting**: Vercel
- **API**: Next.js API Routes with @vercel/postgres

## Database Schema

- **bookings** - Stores all bookings (email, date)
- **payments** - Tracks payment status per user

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
