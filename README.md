<div align="center">

# Vidya LMS

**A full-stack learning platform built with the MERN stack.**
Learners buy and finish courses, instructors build and sell them, admins run the platform.

[![CI](https://github.com/mrbanoth/vidya-lms/actions/workflows/ci.yml/badge.svg)](https://github.com/mrbanoth/vidya-lms/actions/workflows/ci.yml)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Node](https://img.shields.io/badge/Node-22-339933?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-0f7a5c)

![Vidya home page](docs/screenshots/home.png)

</div>

## Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Demo accounts](#demo-accounts)
- [Project structure](#project-structure)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Docs](#docs)

## Features

### Learners
- Catalog with search, category, level, price and rating filters (all kept in the URL so results are shareable)
- Course pages with curriculum, free preview lessons, instructor bio, rating breakdown and reviews
- Cart (works signed out and merges on sign-in), coupons, GST-inclusive checkout with **Razorpay**
- Course player that **resumes where you stopped**, with notes at timestamps, lesson Q&A, resources and reviews
- Timed quizzes with instant grading and explanations
- **PDF certificates** with a QR code and a public verification page
- Dashboard with streaks and a 12-week study heatmap
- GST invoices, refund requests within 30 days, real-time notifications

### Instructors
- 5-step course editor: details, **drag-and-drop curriculum**, pricing, media, publish checklist
- Video, article and quiz lessons; uploads with live progress (Cloudinary or local disk)
- Earnings dashboard, per-course revenue, students list with CSV export, Q&A inbox
- UPI payouts with a 30-day refund hold and TDS calculation

### Admins
- Platform overview: active users, gross sales by payment method, sign-ups, sales by category
- Course review queue with approve / request-changes (emails the instructor)
- Users (roles, ban/unban with instant session revocation), payments and refunds, payouts
- Coupons, categories, reports (completion funnel, conversion, top instructors)
- **Audit log** of every admin action and platform settings including maintenance mode

### Everywhere
- Light and dark themes, responsive from 360px, keyboard and screen-reader friendly
- `Ctrl / ⌘ + K` command palette for courses, categories and pages
- UI built with [Kokonut UI](https://kokonutui.com) components (see [credits](#credits))

## Screenshots

| Course page | Course player |
| --- | --- |
| ![Course page](docs/screenshots/course.png) | ![Course player](docs/screenshots/player.png) |
| **Learner dashboard** | **Checkout** |
| ![Dashboard](docs/screenshots/dashboard.png) | ![Checkout](docs/screenshots/checkout.png) |
| **Instructor curriculum builder** | **Admin overview** |
| ![Studio](docs/screenshots/studio-builder.png) | ![Admin](docs/screenshots/admin.png) |
| **Catalog** | **Mobile, dark theme** |
| ![Catalog](docs/screenshots/catalog.png) | <img src="docs/screenshots/mobile-dark.png" width="260" alt="Mobile dark theme" /> |

## Tech stack

| Layer | Choices |
| --- | --- |
| **M**ongoDB | Mongoose 8 models with indexes, TTL collections for sessions and notifications |
| **E**xpress | Express 5, layered modules (routes → validation → controller → service), Zod validation, Socket.IO |
| **R**eact | React 19, Vite 6, React Router 7, TanStack Query 5, Zustand, React Hook Form, Tailwind CSS 4, Kokonut UI, Motion, Recharts, dnd-kit |
| **N**ode | Node 22, JWT, bcrypt, Razorpay, Nodemailer, PDFKit, Cloudinary, Pino |
| Shared | `@vidya/shared` workspace with Zod schemas used by both the API and the forms |
| Tooling | npm workspaces, ESLint 9, Prettier, Vitest, Supertest, GitHub Actions, Docker |

## Quick start

**Requirements:** Node 20+ and MongoDB 7 (local, Docker or Atlas).

```bash
git clone https://github.com/mrbanoth/vidya-lms.git
cd vidya-lms
npm install

# configure the API
cp apps/server/.env.example apps/server/.env
# edit MONGO_URI and set two long random JWT secrets

# fill the database with demo courses, users, orders and reviews
npm run seed

# start API (http://localhost:5000) and web app (http://localhost:5173)
npm run dev
```

No MongoDB installed? Use free **MongoDB Atlas** (below) or Docker: `docker run -d -p 27017:27017 mongo:7`.

### Using MongoDB Atlas (free M0 cluster)

1. In Atlas, create a project (e.g. `vidya-lms`), then **Create cluster → M0 Free**, pick a region near you (Mumbai `ap-south-1`).
2. **Database Access → Add user** with a username and a generated password, role *Read and write to any database*.
3. **Network Access → Add IP address**: your current IP for development (add your host's IPs or `0.0.0.0/0` when deploying).
4. **Connect → Drivers → Node.js** and copy the `mongodb+srv://…` string.
5. Put it in `apps/server/.env`, adding the database name before the `?`:
   `MONGO_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/vidya?retryWrites=true&w=majority`
6. `npm run seed` then `npm run dev`. Collections appear under the `vidya` database in **Browse Collections**.

Optional integrations, all off by default so the app runs with zero accounts:

| Feature | Without keys | With keys |
| --- | --- | --- |
| Payments | Built-in **test gateway** (development only) | Razorpay checkout and webhooks |
| Email | Printed to the server console, including OTP codes | Any SMTP provider |
| Media | Saved in `apps/server/uploads` | Cloudinary |
| Google sign-in | Button hidden | `GOOGLE_CLIENT_ID` + `VITE_GOOGLE_CLIENT_ID` |

## Demo accounts

After `npm run seed` (password for all: `Password123`):

| Role | Email |
| --- | --- |
| Learner | `student@vidya.dev` |
| Instructor | `priya@vidya.dev` |
| Admin | `admin@vidya.dev` |

The sign-in page also has one-click buttons that fill these in. Coupons to try: `LEARN10`, `STUDENT40`.

## Project structure

```
vidya-lms/
├─ apps/
│  ├─ client/                 React app (Vite)
│  │  └─ src/
│  │     ├─ app/              router, route guards, error boundary
│  │     ├─ components/
│  │     │  ├─ ui/            design-system primitives (Button, Field, Modal, DataTable…)
│  │     │  ├─ kokonut/       Kokonut UI components (MIT)
│  │     │  ├─ layout/        navbar, app shell, auth shell, search palette
│  │     │  ├─ course/        course card, catalog view, thumbnail, price
│  │     │  ├─ player/        video player, curriculum, lesson tabs
│  │     │  └─ studio/        curriculum builder, lesson editor, upload adapter
│  │     ├─ features/         auth session, cart, notifications, certificates
│  │     ├─ pages/            public · auth · student · instructor · admin
│  │     ├─ lib/              API client with silent refresh, formatters, socket
│  │     └─ store/            Zustand stores (auth, UI)
│  └─ server/                 Express API
│     ├─ src/
│     │  ├─ config/           validated env, database
│     │  ├─ modules/          auth · users · catalog · learn · commerce ·
│     │  │                    certificates · instructor · admin · notifications
│     │  ├─ models/           18 Mongoose models
│     │  ├─ middlewares/      auth, RBAC, validation, sanitising, rate limits, errors
│     │  ├─ services/         learning progress, notifications, storage, audit
│     │  ├─ sockets/          Socket.IO rooms per user
│     │  └─ seed/             demo data
│     └─ tests/               Supertest integration tests
├─ packages/shared/           Zod schemas and constants shared by client and server
├─ docs/                      API reference, architecture, screenshots
├─ Dockerfile · docker-compose.yml · .github/workflows/ci.yml
```

## Security

- **Sessions:** 15-minute access token kept in memory, 7-day refresh token in an `httpOnly` cookie scoped to `/api/v1/auth`. Refresh tokens rotate on every use; reusing an old one revokes the whole session family.
- **Passwords:** bcrypt (12 rounds), lockout after 5 failed attempts, password change signs out other devices.
- **Email OTP** (hashed, 10-minute expiry) and hashed, single-use reset tokens.
- **Authorisation:** role guards plus ownership checks (instructors can only edit their own courses; learners only open courses they own). Lesson video URLs are never exposed on public pages.
- **Input:** Zod on every route, Mongo operator stripping against NoSQL injection, JSON size limits, upload type and size limits.
- **Headers & abuse:** Helmet with a strict Content Security Policy, CORS allowlist, rate limits on API, sign-in and OTP routes.
- **Payments:** prices are always computed on the server; Razorpay checkout and webhook signatures are verified with timing-safe comparison.
- **Accountability:** every admin action is written to the audit log with actor and IP.

## Testing

```bash
npm test               # server integration tests + client unit tests
npm run lint
```

The 28 server tests run against a real MongoDB (`MONGO_URI_TEST`, defaults to `mongodb://127.0.0.1:27017/vidya_test`) and cover registration with OTP, refresh-token reuse detection, role guards, NoSQL injection, catalog filters, checkout with coupons and GST, enrollment, progress, quiz grading, certificate issuing and PDF, refunds, the instructor publishing flow, admin bans, coupons and maintenance mode. CI runs them on every push with a MongoDB service container.

## Deployment

**Single container (API serves the built React app):**

```bash
docker compose up --build
docker compose exec api node apps/server/src/seed/index.js   # optional demo data
# open http://localhost:5000
```

**Render + Atlas (recommended, free):** follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). `render.yaml` sets everything up as one service. Production starts empty: the server creates starter categories and your admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD`; demo data is for local development only.

**Separate hosting:** deploy `apps/client` to Vercel or Netlify with `VITE_API_URL=https://your-api`, and `apps/server` to Render or Railway with `CLIENT_URL` set to the web app's URL and `COOKIE_SAMESITE=none` (HTTPS required). Point Razorpay webhooks to `POST /api/v1/payments/webhook`.

## Docs

- [API reference](docs/API.md)
- [Architecture notes](docs/ARCHITECTURE.md)
- [Deployment guide](docs/DEPLOYMENT.md)

## Credits

- UI components from [Kokonut UI](https://kokonutui.com) by @dorianbaffier (MIT): ActionSearchBar, BackgroundPaths, CardFlip, FileUpload, HoldButton, Loader, MetricCard, ParticleButton, ProfileDropdown, SwitchButton and Typewriter. Their license is kept in `apps/client/src/components/kokonut/LICENSE`.
- Sample lesson videos from Google's public test-video bucket (Blender Foundation films, CC-BY).

## License

[MIT](LICENSE) © mrbanoth
