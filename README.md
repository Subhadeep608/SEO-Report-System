# Report System (MERN Stack)

A role-based system with **two roles**:

- **Admin** — full access. Creates User accounts (name, login ID, password), creates Projects with a fixed keyword, and views every submitted report in real time (with submitter name, date, and time).
- **User** — logs in with the ID/password the Admin created for them. Sees only their own dashboard: a form to submit a daily report, and a read-only history of their own past reports. Once a report is submitted it can never be edited or deleted — by the user or anyone else via the API.

There is no public sign-up. Admin creates every User account directly and hands over the login ID/password.

## Tech Stack

- **M**ongoDB (Mongoose)
- **E**xpress
- **R**eact (Vite) + React Router + Tailwind CSS
- **N**ode.js
- JWT authentication, bcrypt password hashing

## Project Structure

```
report-system/
  backend/     Express API + MongoDB models
  frontend/    React app (Vite)
```

## 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/report_system
JWT_SECRET=some_long_random_string
JWT_EXPIRES_IN=7d
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
```

Make sure MongoDB is running locally, or point `MONGO_URI` at a MongoDB Atlas cluster.

Create the first Admin account (run once):

```bash
npm run seed
```

This prints the login ID/password for the Admin — the only account created outside the app. Every User account after that is created from inside the Admin dashboard.

Start the API:

```bash
npm run dev     # with nodemon
# or
npm start
```

The API runs on `http://localhost:5000/api`.

## 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

`.env`:

```
VITE_API_URL=http://localhost:5000/api
```

Start the dev server:

```bash
npm run dev
```

Visit `http://localhost:5173` and log in with the Admin credentials from the seed step.

## Typical Flow

1. **Admin** logs in → creates a Project with a keyword (e.g. `PRJ-ALPHA`) → creates a User → hands them the login ID/password.
2. **User** logs in → lands on their own dashboard → "Submit Report" tab: picks the Project (keyword auto-fills, read-only), enters a Work URL and Category → submits → sees a success message.
3. **User** can switch to "My Reports" to see their own submission history — read-only, no edit or delete options anywhere.
4. **Admin**'s "Reports" tab shows every submitted report across all users, live (auto-refreshes every 10s, plus a manual refresh button), with the submitter's name, project, keyword, work URL, category, date, and time.

## API Overview

| Method | Route | Role | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | any | Log in, get JWT |
| GET | `/api/auth/me` | any | Current user info |
| POST | `/api/admin/users` | admin | Create a User |
| GET | `/api/admin/users` | admin | List Users |
| PATCH | `/api/admin/users/:id/status` | admin | Enable/disable a User |
| POST | `/api/admin/projects` | admin | Create a Project (with keyword) |
| GET | `/api/admin/projects` | admin | List Projects |
| PATCH | `/api/admin/projects/:id/keyword` | admin | Edit a Project's keyword |
| PATCH | `/api/admin/projects/:id/status` | admin | Enable/disable a Project |
| GET | `/api/admin/reports` | admin | List all submitted Reports (filterable by project/user/date) |
| GET | `/api/user/projects` | user | Active projects for the dropdown |
| POST | `/api/user/reports` | user | Submit a report |
| GET | `/api/user/reports` | user | View own submitted reports (read-only) |

Note: there are intentionally **no update or delete endpoints for reports**, for either role — this enforces "once submitted, never edited or deleted" at the API level, not just in the UI.

## Notes / things you may want to change

- **Category field**: currently a fixed dropdown (Development, Design, Testing, Research, Content, Other) — edit `CATEGORY_OPTIONS` in `frontend/src/pages/UserDashboard.jsx` to match your real categories.
- **"Real time" reports**: the Admin's Reports table auto-refreshes every 10 seconds and has a manual "Refresh now" button. If you want true push-based real-time (e.g. via WebSockets/Socket.IO) instead of polling, that's a straightforward upgrade — just say so.
- **Credential delivery**: the app doesn't email credentials — Admin sees the login ID and password on screen right after creating the account and is expected to share it manually.
- **Password reset**: not implemented (not part of the spec). Easy to add if needed.
