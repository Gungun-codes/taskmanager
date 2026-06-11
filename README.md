# Hairdrama Task Manager

A collaborative task management web application built for the Hairdrama Tech internship assignment.

## Live URLs
- **Frontend**: `https://hairdrama-frontend.vercel.app` *(update after deploy)*
- **Backend**: `https://hairdrama-backend.onrender.com` *(update after deploy)*

---

## Architecture

```
hairdrama/
├── frontend/          # Next.js 14 + TypeScript (deployed on Vercel)
│   └── src/
│       ├── app/       # App Router pages
│       │   ├── page.tsx           # Login page
│       │   └── dashboard/page.tsx # Main kanban board
│       ├── components/
│       │   ├── TaskCard.tsx        # Individual task card
│       │   ├── CreateTaskModal.tsx # New task form
│       │   └── Avatar.tsx          # User avatar
│       ├── lib/
│       │   ├── api.ts              # Flask API client
│       │   └── auth-context.tsx    # Global auth state
│       └── types/index.ts          # TypeScript types
│
├── backend/           # Flask (deployed on Render/Railway)
│   ├── app.py         # Main Flask app with all routes
│   ├── requirements.txt
│   └── .env.example
│
└── migrations/
    └── 001_init.sql   # Supabase schema
```

### Data Flow
```
User → Next.js Frontend
         ↓ (Google OAuth token)
       Flask Backend → Google API (verify token)
         ↓
       Supabase (store user/tasks)
         ↓
       Gmail SMTP (send notifications)
```

---

## Features

- **Google OAuth 2.0** — Sign in with Google account
- **Create Tasks** — Add title, description, assign to team members
- **Assign Tasks** — Assign any task to any registered user
- **Email Notifications** — Gmail notification when task is created or completed
- **Kanban Board** — Three columns: To Do / In Progress / Completed
- **Status Updates** — Move tasks between columns via dropdown
- **Delete Tasks** — Task creators can delete their own tasks
- **Filter View** — View all tasks, mine, or assigned to me

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 + TypeScript |
| Backend | Flask (Python) |
| Database | Supabase (PostgreSQL) |
| Auth | Google OAuth 2.0 |
| Email | Gmail SMTP (App Password) |
| Frontend Deploy | Vercel |
| Backend Deploy | Render / Railway |

---

## Setup

### 1. Supabase
- Create a new Supabase project
- Run `migrations/001_init.sql` in the SQL editor
- Copy your project URL and service role key

### 2. Google Cloud Console
- Create a new project
- Enable Google Identity API
- Create OAuth 2.0 credentials (Web application)
- Add authorized origins: `http://localhost:3000` + your Vercel URL
- Copy the Client ID

### 3. Gmail App Password
- Go to Google Account → Security → 2-Step Verification → App passwords
- Generate an app password for "Mail"
- Copy it (16 chars, no spaces)

### 4. Backend (Flask)
```bash
cd backend
cp .env.example .env  # fill in your values
pip install -r requirements.txt
python app.py
```

### 5. Frontend (Next.js)
```bash
cd frontend
cp .env.example .env.local  # fill in your values
npm install
npm run dev
```

---

## API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/auth/google` | Verify Google token, upsert user |
| GET | `/auth/me` | Get user by google_id |
| GET | `/users` | List all users |
| GET | `/tasks` | Get all tasks with user info |
| POST | `/tasks` | Create task + send email |
| PATCH | `/tasks/:id` | Update task status/details |
| DELETE | `/tasks/:id` | Delete a task |
| GET | `/health` | Health check |

---

## Database Schema

### users
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| google_id | TEXT | Unique, from Google |
| email | TEXT | Unique |
| name | TEXT | |
| avatar | TEXT | Google profile picture URL |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### tasks
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| title | TEXT | Required |
| description | TEXT | Optional |
| status | TEXT | pending / in_progress / completed |
| created_by | UUID | FK → users |
| assigned_to | UUID | FK → users, nullable |
| created_at | TIMESTAMPTZ | |

---

## Deployment

### Backend → Render
1. Push backend folder to GitHub
2. Create new Web Service on Render
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app`
5. Add all env variables from `.env.example`

### Frontend → Vercel
1. Push frontend folder to GitHub
2. Import project on Vercel
3. Add env variables from `.env.example`
4. Deploy
