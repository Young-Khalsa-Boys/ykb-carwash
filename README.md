# YKB Car Wash

A simple, Supabase-powered car wash event scheduling system.

## Features
- **Booking Flow**: Simple one-page booking for users (Name, Phone, License Plate, Slot Selection).
- **Admin Console**: Unified dashboard to manage bookings and time slots.
- **Supabase Backend**: All server infrastructure runs on Supabase (Auth, DB).

## Setup

### 1. Supabase Configuration
1. Create a new project on [Supabase](https://supabase.com).
2. Open the **SQL Editor** in Supabase and execute the contents of `supabase_schema.sql`.
3. Go to **Project Settings > API** and copy your `Project URL` and `anon public` key.

### 2. Local Environment
1. Copy the values into your `.env` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Routes
- `/`: Public Booking Page
- `/admin`: Admin Console (requires Supabase Auth configuration for production)
