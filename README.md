# Girls Supper Club — Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Create `.env.local` from the example:
```bash
cp .env.local.example .env.local
```
Then paste your keys into `.env.local`.

### 3. Run the Database Schema

1. In Supabase, go to **SQL Editor**
2. Copy the entire contents of `supabase-schema.sql` and run it
3. This creates all tables, triggers, and Row Level Security policies

### 4. Create Storage Buckets

In Supabase Dashboard → **Storage**:

1. Create bucket: `avatars` (set to **public**)
2. Create bucket: `cookbook-covers` (set to **public**)

For each bucket, add these policies:
- **SELECT**: Allow all authenticated users
- **INSERT**: Allow authenticated users
- **UPDATE**: Allow authenticated users
- **DELETE**: Allow authenticated users

### 5. Make Yourself Super Admin

1. Sign up through the app (run `npm run dev` first)
2. Complete your profile
3. In Supabase, go to **Table Editor → profiles**
4. Find your row and change `role` from `member` to `super_admin`

### 6. Run the App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## Setting Up Your First Event

### Step 1: Go to /admin
Navigate to `localhost:3000/admin` (you must be super_admin).

### Step 2: Fill in Event Details
- Volume number (starts at 1)
- Event date
- Cookbook name
- Cookbook cover image (optional)

Click **Save Event**.

### Step 3: Add Recipes via JSON
Paste a JSON array into the text area, or upload a `.json` file.

**JSON Format:**
```json
[
  {
    "name": "Roasted Cauliflower with Tahini",
    "page_number": 42,
    "course": "side",
    "allergens": ["nuts"],
    "is_vegetarian": true,
    "is_vegan": true
  },
  {
    "name": "Lamb Kofta with Yogurt",
    "page_number": 98,
    "course": "main",
    "allergens": ["dairy"],
    "is_vegetarian": false,
    "is_vegan": false
  }
]
```

**Field reference:**
| Field | Type | Required | Options |
|-------|------|----------|---------|
| `name` | string | ✅ | — |
| `page_number` | number or null | — | — |
| `course` | string | ✅ | `"appetizer"`, `"main"`, `"side"`, `"dessert"` |
| `allergens` | string[] | — | `"nuts"`, `"dairy"`, `"gluten"`, `"eggs"`, `"shellfish"`, `"soy"` |
| `is_vegetarian` | boolean | ✅ | — |
| `is_vegan` | boolean | ✅ | — |

Click **Publish Recipes** to make them available to members.

### Step 4: Share the Link
Send your friends to the homepage. They'll see the envelope animation, RSVP, sign up, and pick recipes.

---

## Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

Optional: connect a custom domain (e.g., `girlssupperclub.com`).

---

## Per-Event Color Theme (Optional)

You can override the color theme per event in the admin panel. Paste a JSON object:

```json
{
  "bg": "#F5F0EB",
  "ink": "#1A1A1A",
  "accent": "#2E6B4E",
  "accentWarm": "#8BA888",
  "surface": "#FFFFFF"
}
```

Only include the colors you want to change — the rest will use defaults.

---

## Architecture Notes

- **No API routes needed** — Supabase handles auth + data directly from the client
- **No real-time subscriptions** in V1 — users refresh to see updates
- **Recipe data is JSON-based** — you extract recipe info yourself and paste it in
- **One active event at a time** — the `is_active` flag controls which event shows on the landing page
- **Lock time** is auto-set to 48 hours before the event date

---

## File Structure

```
/app
  page.tsx              ← Envelope + RSVP (public)
  /auth/login/page.tsx  ← Sign in
  /auth/signup/page.tsx ← Sign up
  /profile/page.tsx     ← Profile setup
  /event/page.tsx       ← Recipe selection + guest rail
  /admin/page.tsx       ← Admin: event setup + JSON recipe input
  /archive/page.tsx     ← Past events grid
  /archive/[eventId]/page.tsx ← Frozen past event view

/components
  /envelope/Envelope.tsx, InviteCard.tsx
  /recipe/RecipeList.tsx, RecipeRow.tsx, ClaimButton.tsx
  /guest/GuestRail.tsx, GuestAvatar.tsx
  /profile/ProfileForm.tsx, DietaryPicker.tsx
  /archive/EventCard.tsx

/lib
  supabase.ts  ← Supabase client
  types.ts     ← TypeScript types + constants
  theme.ts     ← Color theme + formatting utilities

middleware.ts  ← Auth + profile redirect guards
supabase-schema.sql ← Full database schema
```
