<div align="center">

# HireAI — AI-Powered Hiring Assistant

**Score resumes with AI, rank candidates automatically, and hire faster.**

[![Live Demo](https://img.shields.io/badge/Live-Demo-6366f1?style=for-the-badge)](https://smart-hiring-assistant.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-24243e?style=for-the-badge&logo=github)](https://github.com/yuvarajmn10/smart-hiring-assistant)
[![Backend](https://img.shields.io/badge/API-Render-46e3b7?style=for-the-badge&logo=render&logoColor=black)](https://hireai-backend-eaks.onrender.com)

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47a248?logo=mongodb&logoColor=white)
![Gemini](https://img.shields.io/badge/AI-Google_Gemini-8e75b2?logo=googlegemini&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

</div>

---

## 📖 About

**HireAI** is a full-stack hiring platform built with the MERN stack and Google Gemini.

- **Recruiters** post jobs and see every applicant scored and ranked by AI, with strengths, skill gaps and interview questions tailored to each person. They move candidates through **Under Review → Interview → Selected / Rejected**, one at a time or the top N at once.
- **Candidates** build or upload a resume once, check their fit score before applying, generate an AI cover letter, browse live jobs from other sites, and follow every application from one dashboard.

It removes the slowest part of hiring: reading every resume by hand to find the best matches.

---

## 📑 Table of Contents

- [Live Demo](#-live-demo)
- [Features](#-features)
- [How It Works](#-how-it-works)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Data Models](#-data-models)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [Deployment](#️-deployment)
- [Technical Highlights](#-technical-highlights)
- [Troubleshooting](#-troubleshooting)
- [Future Improvements](#-future-improvements)
- [Author](#-author)
- [License](#-license)

---

## 🎬 Live Demo

[![HireAI screenshot](./backend/Screenshot.png)](https://smart-hiring-assistant.vercel.app)

| | Link |
|---|---|
| **Web app** | https://smart-hiring-assistant.vercel.app |
| **Backend API** | https://hireai-backend-eaks.onrender.com |

**Demo accounts**

| Role | Email | Password |
|------|-------|----------|
| Recruiter | recruiter@demo.com | demo1234 |
| Candidate (strong profile) | candidate1@demo.com | demo1234 |
| Candidate (fresher) | candidate2@demo.com | demo1234 |

> ⏳ The backend runs on Render's free tier and sleeps when idle. The first request after a pause can take about 50 seconds. After that, it responds normally.

---

## ✨ Features

### 👔 For recruiters

| Feature | Description |
|---|---|
| **Job postings** | Create jobs with title, description, required skills, location and salary. Delete them when filled. |
| **AI scoring** | Every application gets a **fit score (0–100)**, a verdict (**Shortlisted** 80+, **Maybe** 50–79, **Not Selected** below 50), strengths and skill gaps. |
| **Ranked applicants** | Candidates are ordered by score with a custom **max-heap**, with gold, silver and bronze rank badges for the top three. |
| **Hiring decisions** | Move each applicant between **Under Review**, **Interview**, **Selected** and **Rejected** from a dropdown. |
| **Top-N bulk action** | For example, "Mark the **top 3** ranked candidates as **Interview**" in one click. |
| **Interview questions** | AI writes **5 questions** per candidate (technical and situational), aimed at that person's skill gaps. Copy them all with one click. |
| **Re-score** | If the AI was busy when someone applied, score the application later with **Score now**. |
| **Filters** | Show all applicants or only Shortlisted, Maybe or Rejected. |

### 🎓 For candidates

| Feature | Description |
|---|---|
| **Resume profile** | Fill in a guided form (summary, skills, experience, education, projects, links) or upload a PDF of up to 5 MB. Saved once and reused for every application. |
| **Fit check** | See your AI score, verdict, strengths and gaps for a job **before** you apply. |
| **AI cover letter** | Generate a cover letter tailored to the job from your resume. |
| **Live jobs** | Browse real openings from Google Jobs through the JSearch API. The country is picked from your location. |
| **Application tracker** | One dashboard shows HireAI applications, with the recruiter's decision, and applications on other sites, whose status you update yourself (Applied / Interviewing / Offer / Rejected). |

### 🔐 Platform

- **Role-based access:** separate recruiter and candidate experiences, protected routes, and ownership checks on every write.
- **Password reset:** a 6-digit code sent by email that expires after 10 minutes and can be resent after a 60-second wait.
- **Resilient AI:** a fallback chain across several Gemini models, with retries and quota cool-downs.
- **Themes:** a theme picker available on every page.
- **Responsive:** works on mobile, tablet and desktop.

---

## 🔄 How It Works

### Recruiter journey
```
Register as recruiter → Post a job → Candidates apply
   → Open the job: applicants arrive scored and ranked
   → Expand a card: strengths, gaps, AI interview questions
   → Set status per candidate, or "Mark top N as Interview / Selected"
```

### Candidate journey
```
Register as candidate → Build or upload a resume (once)
   → Browse HireAI jobs or live jobs from other sites
   → Check fit score → (optional) generate a cover letter → Apply
   → Dashboard: see score + recruiter decision (Under Review / Interview 📅 / Selected 🎉 / Rejected)
```

### AI scoring pipeline
```
Resume (form text or PDF → pdf-parse)
   → Prompt = job title + description + requirements + resume text
   → Gemini (JSON mode) → { fitScore, verdict, strengths[], weaknesses[] }
   → Validated → saved on the Application → ranked with the max-heap
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, React Router 7, Axios, CSS variables for theming |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB Atlas, Mongoose |
| **AI** | Google Gemini (`@google/generative-ai`), JSON-mode responses, multi-model fallback |
| **Auth** | JSON Web Tokens (7-day expiry), bcryptjs |
| **Files** | multer (in-memory, PDF only, 5 MB), pdf-parse |
| **External jobs** | JSearch API on RapidAPI |
| **Email** | Nodemailer (Gmail app password) |
| **Hosting** | Vercel (frontend), Render (backend), MongoDB Atlas (database) |

---

## 🏗 Architecture

```
┌────────────────────┐      HTTPS / JSON      ┌──────────────────────────┐
│  React + Vite SPA  │ ─────────────────────▶ │  Express REST API        │
│  (Vercel)          │ ◀───────────────────── │  (Render)                │
│                    │    JWT in the header   │                          │
│  • AuthContext     │                        │  • JWT protect + roles   │
│  • Protected routes│                        │  • multer + pdf-parse    │
│  • Axios instance  │                        │  • Max-heap ranking      │
└────────────────────┘                        └────────────┬─────────────┘
                                                           │
                    ┌──────────────────┬───────────────────┼──────────────────┐
                    ▼                  ▼                   ▼                  ▼
             MongoDB Atlas      Google Gemini      JSearch (RapidAPI)   Gmail SMTP
             (data)             (scoring, Qs,      (live jobs)          (reset codes)
                                 cover letters)
```

---

## 📁 Project Structure

```
smart-hiring-assistant/
├── backend/
│   ├── config/
│   │   ├── ai.js                 # Gemini client + model fallback list
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/              # Request handlers (auth, jobs, applications, resume, …)
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT "protect"
│   │   └── upload.js             # multer: PDF only, 5 MB
│   ├── models/                   # User, Job, Application, Resume, ExternalApplication
│   ├── routes/                   # Express routers, mounted under /api
│   ├── services/
│   │   ├── aiScorer.js           # Scoring, interview questions, cover letters
│   │   └── mailer.js             # Password-reset emails
│   ├── utils/MaxHeap.js          # Max-heap + getTopKCandidates
│   ├── seed.js                   # Demo users, jobs and applications
│   └── server.js                 # App entry point
├── frontend/
│   ├── src/
│   │   ├── api/axios.js          # Axios instance, adds the JWT, handles 401s
│   │   ├── components/           # Navbar, LiveJobs, Toast, Spinner, ProtectedRoute, …
│   │   ├── context/              # AuthContext, ThemeContext
│   │   ├── hooks/useIsMobile.js
│   │   ├── pages/                # Jobs, Dashboard, JobDetail, Apply, Resume, Login, Register, …
│   │   └── App.jsx               # Routes
│   └── vercel.json               # SPA rewrites
├── render.yaml                   # Render Blueprint for the backend
└── README.md
```

---

## 🗃 Data Models

| Model | Key fields |
|---|---|
| **User** | `name`, `email`, `password` (hashed), `role` (`recruiter` \| `candidate`), password-reset fields |
| **Job** | `title`, `description`, `requirements[]`, `location`, `salary`, `status` (`open` \| `closed`), `recruiter` |
| **Application** | `job`, `candidate`, `resumeText`, `coverLetter`, `status` (`applied` \| `interview` \| `selected` \| `rejected`), `aiScore`, `aiVerdict`, `aiStrengths[]`, `aiWeaknesses[]` |
| **Resume** | `user`, `source` (`upload` \| `form`), `targetRole`, `fileName`, `resumeText`, `details` (contact, links, skills, experience, education, projects) |
| **ExternalApplication** | `candidate`, job details from the other site, `status` (`applied` \| `interviewing` \| `offer` \| `rejected`) |

A unique index on `{ job, candidate }` stops anyone from applying to the same job twice.

---

## 📡 API Reference

Base URL: `https://hireai-backend-eaks.onrender.com/api` (or `http://localhost:5000/api` locally).
Send the JWT as `Authorization: Bearer <token>` on routes marked ✓.

<details>
<summary><b>Auth</b></summary>

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/register` | — | Register as a recruiter or candidate |
| POST | `/auth/login` | — | Log in and receive a JWT |
| POST | `/auth/forgot-password` | — | Email a 6-digit reset code |
| POST | `/auth/reset-password` | — | Set a new password with the code |
| GET | `/auth/me` | ✓ | Current user |

</details>

<details>
<summary><b>Jobs</b></summary>

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/jobs` | — | All open jobs |
| GET | `/jobs/:id` | — | One job |
| GET | `/jobs/my` | ✓ | The logged-in recruiter's postings |
| POST | `/jobs` | Recruiter | Create a job |
| DELETE | `/jobs/:id` | Recruiter | Delete your job |

</details>

<details>
<summary><b>Applications</b></summary>

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/applications/preview` | Candidate | Fit score only, nothing saved |
| POST | `/applications/cover-letter` | Candidate | AI-drafted cover letter |
| POST | `/applications` | Candidate | Apply (AI scores it on submit) |
| GET | `/applications/my` | Candidate | Your applications |
| GET | `/applications?jobId=` | Recruiter | Applications for your job |
| GET | `/applications/ranked?jobId=&k=` | Recruiter | Top K applicants, heap-ranked |
| POST | `/applications/:id/rescore` | Recruiter | Re-run AI scoring |
| PATCH | `/applications/:id/status` | Recruiter | Set `applied` / `interview` / `selected` / `rejected` |
| PATCH | `/applications/status` | Recruiter | Bulk update, body `{ jobId, applicationIds[], status }` |

</details>

<details>
<summary><b>Resume, interview and external jobs</b></summary>

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/profile/resume` | ✓ | Your saved resume |
| PUT | `/profile/resume` | ✓ | Save the resume form |
| POST | `/profile/resume/upload` | ✓ | Upload a resume PDF (field `resume`) |
| DELETE | `/profile/resume` | ✓ | Delete your saved resume |
| POST | `/resume/parse` | ✓ | Extract text from a PDF |
| GET | `/interview/:applicationId` | Recruiter | 5 AI interview questions |
| GET | `/external-jobs` | — | Live jobs from JSearch |
| POST | `/external-applications` | ✓ | Track an application on another site |
| GET | `/external-applications/my` | ✓ | Your tracked applications |
| PATCH | `/external-applications/:id` | ✓ | Update its status |
| DELETE | `/external-applications/:id` | ✓ | Remove it |

</details>

**Example request:**

```bash
curl -X POST https://hireai-backend-eaks.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"recruiter@demo.com","password":"demo1234"}'
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18 or newer
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (the free tier works)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)
- Optional: a [RapidAPI](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) key for live jobs, and a Gmail [app password](https://myaccount.google.com/apppasswords) for reset emails

### 1. Clone the repository
```bash
git clone https://github.com/yuvarajmn10/smart-hiring-assistant.git
cd smart-hiring-assistant
```

### 2. Set up the backend
```bash
cd backend
npm install
```
Create `backend/.env` (see [Environment Variables](#-environment-variables)), then run:
```bash
npm run seed    # optional: load the demo accounts, jobs and applications
npm run dev     # API on http://localhost:5000
```

### 3. Set up the frontend
In a second terminal:
```bash
cd frontend
npm install
```
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```
Then run:
```bash
npm run dev     # App on http://localhost:5173
```

### 4. Try it
Open **http://localhost:5173** and log in with a [demo account](#-live-demo).

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|:---:|---|
| `PORT` | — | API port (default `5000`) |
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Long random string used to sign tokens |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `FRONTEND_URL` | ✅ in production | Frontend URL allowed by CORS, e.g. `https://smart-hiring-assistant.vercel.app` |
| `RAPIDAPI_KEY` | — | JSearch key for live jobs |
| `EMAIL_USER` | — | Gmail address that sends reset codes |
| `EMAIL_PASS` | — | Gmail app password. Without email, the reset code is printed to the server log. |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|:---:|---|
| `VITE_API_URL` | ✅ | Backend base URL ending in `/api` |

> 🔒 `.env` files are git-ignored. Never commit real keys.

---

## 📜 Available Scripts

| Location | Command | What it does |
|---|---|---|
| `backend/` | `npm run dev` | Start the API with auto-reload (nodemon) |
| `backend/` | `npm start` | Start the API (production) |
| `backend/` | `npm run seed` | Reset and load the demo data |
| `frontend/` | `npm run dev` | Start the Vite dev server |
| `frontend/` | `npm run build` | Production build into `dist/` |
| `frontend/` | `npm run preview` | Serve the production build locally |
| `frontend/` | `npm run lint` | Run ESLint |

---

## ☁️ Deployment

| Part | Host | Configuration |
|------|------|---------------|
| **Backend** | Render (free) | Blueprint from `render.yaml`: root `backend`, `npm install`, `npm start`. Set the secrets in **Environment**, and set `FRONTEND_URL` to the Vercel URL. |
| **Frontend** | Vercel (Hobby) | Root directory `frontend`, **Vite** preset, env `VITE_API_URL=https://<render-app>.onrender.com/api`. |
| **Database** | MongoDB Atlas | Network Access: allow `0.0.0.0/0`, because Render's IP addresses change. |

Every push to `main` redeploys both Render and Vercel automatically.

---

## 💡 Technical Highlights

**🏔 Max-heap ranking.** Applicants are inserted into a custom `MaxHeap` keyed on `aiScore`, and the top K are popped off (`getTopKCandidates`). It shows how a priority queue suits "give me the best K" queries. Extracting each winner costs O(log n), and unscored applications sink to the bottom.

**🧩 Structured AI output.** Gemini runs in JSON mode (`responseMimeType: application/json`). The prompt keeps the job title, description, requirements and resume text as separate fields. Every response is validated before saving, with a safe fallback if parsing fails, so a bad AI reply never breaks an application.

**🔁 AI fallback chain.** Free-tier Gemini models each have a small daily quota. Calls go through several models in order. A model that hits its quota rests for 10 minutes, and overload or time-out errors are retried, so scoring keeps working when one model runs out.

**🛡 Security.**
- Passwords are hashed with bcrypt (10 salt rounds), and JWTs expire after 7 days.
- Reset codes are stored **hashed**, expire in 10 minutes, have a limited number of attempts, and can only be resent after 60 seconds.
- Every write checks ownership: recruiters can only read or change applications for **their own** jobs, and candidates can only see their own.
- Roles are enforced on both the frontend routes and the backend controllers.
- Uploads accept **PDF only, up to 5 MB**, held in memory and never written to disk.
- CORS only allows the configured frontend (`FRONTEND_URL`) and `localhost:5173` for local development.

---

## 🧯 Troubleshooting

| Problem | Fix |
|---|---|
| First request on the live site is slow | Render's free server is waking up. Wait about 50 seconds. |
| Login fails on the live site with a network or CORS error | `FRONTEND_URL` on Render must exactly match the Vercel URL, with no trailing slash. |
| `MongoDB connection error` | Check `MONGO_URI`, and allow `0.0.0.0/0` under Atlas **Network Access**. |
| Score shows "Not scored" | The Gemini quota was busy. Click **Score now** on the applicant later. |
| Live jobs tab is empty | Set `RAPIDAPI_KEY` and subscribe to JSearch on RapidAPI. |
| No reset email arrives | Set `EMAIL_USER` and `EMAIL_PASS` (Gmail app password). Locally, the code is printed in the backend terminal. |

---

## 🗺 Future Improvements

- Email candidates automatically when their status changes
- Interview scheduling with calendar invites
- Export shortlisted candidates to CSV or PDF
- Analytics for recruiters (applicants per job, score distribution)
- Close or reopen a job from the dashboard

---

## 👤 Author

**Yuvaraj M N**

[![GitHub](https://img.shields.io/badge/GitHub-yuvarajmn10-24243e?style=flat&logo=github)](https://github.com/yuvarajmn10)

If you find this project useful, please consider giving it a ⭐ on GitHub.

---

## 📄 License

This project is licensed under the **MIT License**. © Yuvaraj M N
