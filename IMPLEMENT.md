# AI Prompt: Build a Simple Football Prediction Website

You are a senior full-stack engineer.

Build a simple, fast MVP football prediction web app with the following stack:

- Frontend: Next.js 14 (App Router) + TypeScript + TailwindCSS
- Backend: Supabase
- Database: Supabase Postgres
- Authentication: Supabase Auth
- Hosting-ready for Vercel
- UI: clean, modern, responsive
- Language: English in code/comments, but UI text should support Vietnamese easily

The project goal is to allow admins to create football tournaments and matches, while users can register/login and submit score predictions.

---

# Core Features

## Public Features

### Home Page
- Show upcoming football matches
- Show tournament names
- Show countdown time before match starts
- Show prediction status:
  - Open
  - Closed
  - Finished

### Match Detail Page
- Match info:
  - Home team
  - Away team
  - Match date
  - Tournament
  - Team logos
- Prediction form:
  - User predicts:
    - Home score
    - Away score
- Prevent prediction after match start time
- Show total number of predictions

---

# Authentication

Use Supabase Auth.

Required:
- Register
- Login
- Logout
- Protected dashboard
- Persist login session
- Middleware route protection

Authentication methods:
- Email/password only

---

# User Features

## User Dashboard
User can:
- View their predictions
- Edit prediction before match starts
- See prediction history
- See leaderboard ranking

---

# Admin Features

Create a simple admin panel.

Admin can:
- Create tournaments
- Edit tournaments
- Delete tournaments

Admin can:
- Create matches
- Edit matches
- Delete matches

Match fields:
- Home team
- Away team
- Tournament
- Match datetime
- Team logo URLs
- Match status
- Final score

Admin can:
- Update final scores
- Automatically calculate prediction points

---

# Prediction Logic

Scoring system:
- Exact score = 3 points
- Correct winner/draw = 1 point
- Wrong prediction = 0 points

Leaderboard:
- Rank users by total points

---

# Database Design

Use Supabase PostgreSQL.

Create proper SQL schema for:

## tables

### profiles
- id
- email
- username
- role (admin/user)
- created_at

### tournaments
- id
- name
- logo_url
- created_at

### matches
- id
- tournament_id
- home_team
- away_team
- home_logo
- away_logo
- match_time
- status
- final_home_score
- final_away_score
- created_at

### predictions
- id
- user_id
- match_id
- predicted_home_score
- predicted_away_score
- points
- created_at

---

# Supabase Requirements

Implement:
- Row Level Security (RLS)
- Policies
- Secure APIs
- Environment variables
- Supabase client setup

Rules:
- Users can only edit their own predictions
- Only admins can manage tournaments and matches

---

# Technical Requirements

## Frontend
Use:
- Server Components where possible
- React Hook Form
- Zod validation
- Zustand or Context API for state
- Loading states
- Toast notifications
- Mobile responsive UI

## Backend
- Use Supabase queries directly
- No separate backend required

---

# Pages Required

## Public
- /
- /login
- /register
- /matches/[id]

## Protected
- /dashboard
- /leaderboard

## Admin
- /admin
- /admin/tournaments
- /admin/matches

---

# Extra Features (Simple)

Add:
- Dark mode
- Simple statistics cards
- Match countdown timer
- Empty states
- Error handling

---

# Deliverables

Generate:
1. Full project folder structure
2. SQL schema
3. Supabase setup guide
4. Environment variables example
5. Full source code
6. README with installation steps
7. Deployment guide for Vercel
8. Clean reusable components
9. Sample seed data

---

# Important

Keep the architecture SIMPLE and MVP-focused.

Avoid overengineering.

The code should be easy to run immediately after:
- creating Supabase project
- adding env variables
- running SQL
- running npm install
- running npm run dev

Make everything production-ready but lightweight.
