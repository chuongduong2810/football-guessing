# Football Predictions

A football score prediction web app where users predict match scores and compete on a leaderboard.

## Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (Postgres + Auth)
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project

### Setup

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

3. Run the SQL migration in your Supabase SQL editor (see `schema.sql`).

4. Start the dev server:

```bash
npm run dev
```

### Making a User an Admin

Run this SQL in the Supabase SQL editor:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Scoring

- **Exact score**: 3 points
- **Correct outcome** (win/draw): 1 point
- **Wrong prediction**: 0 points

## Pages

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Match listings |
| `/login` | Public | Login |
| `/register` | Public | Register |
| `/matches/[id]` | Public | Match detail + prediction form |
| `/dashboard` | Auth | User predictions history |
| `/leaderboard` | Auth | Rankings |
| `/admin` | Admin | Admin dashboard |
| `/admin/tournaments` | Admin | Tournament management |
| `/admin/matches` | Admin | Match management |
