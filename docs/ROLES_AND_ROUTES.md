# Vidya LMS — Roles, Permissions & Routes

The full map of who can do what in Vidya, and every frontend page and backend API route.

- **Frontend:** React 19 + React Router 7 (`apps/client/src/app/router.jsx`)
- **Backend:** Express 5 REST API, mounted at `/api/v1` (`apps/server/src/routes.js`)
- **Shared:** roles and Zod schemas live in `packages/shared`

---

## 1. Project overview

```
vidya-lms/
├── apps/
│   ├── client/          React app (pages, components, store, features)
│   │   └── src/
│   │       ├── app/         router, guards, error boundary, ScrollToTop
│   │       ├── pages/       public/ auth/ student/ instructor/ admin/
│   │       ├── components/  layout/ ui/ kokonut/ course/ player/ certificate/ shared/
│   │       ├── features/    cart, auth hooks…
│   │       └── store/       Zustand (auth, ui)
│   └── server/          Express API
│       └── src/
│           ├── modules/     auth, users, catalog, learn, certificates,
│           │                commerce, notifications, instructor, admin
│           ├── middlewares/ auth, maintenance, rateLimit, sanitize, upload, validate, error
│           ├── models/      Mongoose models
│           ├── services/    mail, storage (Cloudinary/local), payments (Razorpay/test)
│           └── sockets/     Socket.IO (live notifications)
├── packages/shared/     ROLES, constants, Zod schemas
└── docs/                API.md, ARCHITECTURE.md, DEPLOYMENT.md, this file
```

---

## 2. Roles

Defined in `packages/shared/src/constants.js`:

| Role | Value | How someone gets it |
|---|---|---|
| Guest | *(not signed in)* | Anyone visiting the site |
| Student | `student` | Default role when someone signs up |
| Instructor | `instructor` | Picks "Teach" at sign-up (only when admin turns on **Instructor signup**), or an admin changes their role |
| Admin | `admin` | First admin is created on server start from `ADMIN_EMAIL` / `ADMIN_PASSWORD`; other admins are promoted by an admin |

Roles stack upward: **an instructor can also learn like a student**, and **an admin can do everything an instructor can**, on any course.

---

## 3. How permissions are enforced

### Backend (the real security)
| Middleware | File | What it does |
|---|---|---|
| `authenticate` | `middlewares/auth.js` | Needs a valid `Authorization: Bearer <accessToken>`. Rejects deleted users (401) and **banned** users (403). |
| `optionalAuth` | `middlewares/auth.js` | Attaches the user if a token is present; otherwise continues as a guest. |
| `authorize(...roles)` | `middlewares/auth.js` | 403 unless `req.user.role` is in the list. |
| `ownCourse()` | `modules/instructor/instructor.controller.js` | An instructor can only edit **their own** courses; admin can edit any. |
| Learner access check | `modules/learn/learn.controller.js` | Player/lessons open only for the **enrolled learner**, the **course instructor**, or an **admin** (free-preview lessons are an exception). |
| Order ownership | `modules/commerce/commerce.controller.js` | Users see only their own orders; admin sees all. |
| Review rule | `learn.controller.js` | Only enrolled learners can write a review. |
| `maintenance` | `middlewares/maintenance.js` | When maintenance mode is on, every route below `/auth` and `/admin` returns 503 for everyone **except admins**. |
| Rate limits | `middlewares/rateLimit.js` | `authLimiter` (login/register/reset/contact), `otpLimiter` (resend code / forgot password). |
| `validate(schema)` | `middlewares/validate.js` | Zod validation of body/query; bad input → 400. |

**Tokens:** a short-lived access token kept in memory + a rotating `httpOnly` refresh cookie. Reusing an old refresh token revokes the whole session family.

### Frontend (UX only — the server still checks)
| Guard | Used for |
|---|---|
| `GuestOnly` | Auth pages — signed-in users are redirected away |
| `RequireAuth` | Any signed-in user (student area, checkout, player) |
| `RequireAuth roles={["instructor","admin"]}` | `/studio/*` |
| `RequireAuth roles={["admin"]}` | `/admin/*` |

---

## 4. Permission matrix

| Capability | Guest | Student | Instructor | Admin |
|---|:-:|:-:|:-:|:-:|
| Browse home, catalog, course pages, instructor profiles | ✅ | ✅ | ✅ | ✅ |
| Verify a certificate / download certificate PDF by code | ✅ | ✅ | ✅ | ✅ |
| Contact form | ✅ | ✅ | ✅ | ✅ |
| Cart (guest cart is local, merged on sign-in) | ✅ | ✅ | ✅ | ✅ |
| Checkout & payment | ❌ | ✅ | ✅ | ✅ |
| Learn enrolled courses (player, quiz, notes, Q&A) | ❌ | ✅ | ✅ | ✅ (any course) |
| Review a course | ❌ | ✅ enrolled only | ✅ enrolled only | ✅ enrolled only |
| Wishlist, profile, password, sessions, delete account | ❌ | ✅ | ✅ | ✅ |
| My orders, request refund | ❌ | ✅ own | ✅ own | ✅ all |
| My certificates | ❌ | ✅ | ✅ | ✅ |
| Notifications | ❌ | ✅ | ✅ | ✅ |
| Create / edit / submit courses | ❌ | ❌ | ✅ own | ✅ any |
| Answer Q&A on own courses, see students | ❌ | ❌ | ✅ | ✅ |
| Earnings & request payout | ❌ | ❌ | ✅ | ✅ |
| Approve / reject courses, bestseller tag | ❌ | ❌ | ❌ | ✅ |
| Manage users (role, ban) | ❌ | ❌ | ❌ | ✅ |
| Payments, refunds, payouts | ❌ | ❌ | ❌ | ✅ |
| Coupons, categories, hide reviews | ❌ | ❌ | ❌ | ✅ |
| Reports, audit log, platform settings, maintenance mode | ❌ | ❌ | ❌ | ✅ |
| Use the site during maintenance | ❌ | ❌ | ❌ | ✅ |

---

## 5. Frontend pages (React Router)

### Public — `PublicLayout` (anyone)
| Path | Page |
|---|---|
| `/` | Home (landing) |
| `/courses` | Catalog with filters |
| `/courses/:slug` | Course details |
| `/categories/:slug` | Category |
| `/instructors/:id` | Instructor profile |
| `/pricing` | Pricing |
| `/about` | About |
| `/contact` | Contact |
| `/teach` | For Instructors |
| `/verify/:code?` | Certificate verification |
| `/cart` | Cart |
| `*` | 404 Not Found |

### Public layout, signed-in only — `RequireAuth`
| Path | Page |
|---|---|
| `/checkout` | Checkout |
| `/checkout/success/:orderId` | Payment success |

### Auth — `GuestOnly`
| Path | Page |
|---|---|
| `/sign-in` | Sign in |
| `/sign-up` | Sign up |
| `/verify-email` | Email OTP verification |
| `/forgot-password` | Forgot password |
| `/reset-password` | Reset password |

### Student — `RequireAuth` (any signed-in role)
| Path | Page |
|---|---|
| `/learn/:courseId` | Video player (full screen) |
| `/learn/:courseId/quiz/:lessonId` | Quiz |
| `/dashboard` | Student dashboard |
| `/my-learning` | My courses |
| `/wishlist` | Wishlist |
| `/orders` | Orders |
| `/orders/:id` | Invoice |
| `/certificates` | My certificates |
| `/certificates/:code` | Certificate view |
| `/notifications` | Notifications |
| `/settings/:tab?` | Profile / Security / Notifications settings |

### Instructor studio — `RequireAuth roles=[instructor, admin]`
| Path | Page |
|---|---|
| `/studio` | Instructor dashboard |
| `/studio/courses` | My courses |
| `/studio/courses/new` | Create course |
| `/studio/courses/:id/:tab?` | Course editor (basics, curriculum, pricing, media, publish) |
| `/studio/students` | Students |
| `/studio/qa` | Q&A inbox |
| `/studio/earnings` | Earnings & payouts |

### Admin — `RequireAuth roles=[admin]`
| Path | Page |
|---|---|
| `/admin` | Overview dashboard |
| `/admin/users` | Users |
| `/admin/courses` | Course review queue |
| `/admin/payments` | Payments & refunds |
| `/admin/payouts` | Instructor payouts |
| `/admin/coupons` | Coupons |
| `/admin/categories` | Categories |
| `/admin/reports` | Reports |
| `/admin/audit` | Audit log |
| `/admin/settings` | Platform settings |

---

## 6. Backend API routes (`/api/v1`)

Legend: 🌐 public · 👤 any signed-in user · 🎓 instructor or admin · 🛡️ admin only · ⏱️ rate-limited

### System
| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/health` | 🌐 | Health check + DB status |
| GET | `/docs` | 🌐 | OpenAPI docs |
| GET | `/config` | 🌐 | Public platform config (name, payments mode, signup flags) |

### Auth — `/auth` (works during maintenance)
| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | 🌐 ⏱️ | Create account (sends email code) |
| POST | `/auth/verify-email` | 🌐 ⏱️ | Verify email code |
| POST | `/auth/resend-code` | 🌐 ⏱️ | Resend code |
| POST | `/auth/login` | 🌐 ⏱️ | Sign in |
| POST | `/auth/google` | 🌐 ⏱️ | Google sign-in |
| POST | `/auth/refresh` | 🌐 (cookie) | Rotate refresh token → new access token |
| POST | `/auth/logout` | 🌐 (cookie) | Sign out |
| POST | `/auth/forgot-password` | 🌐 ⏱️ | Send reset code |
| POST | `/auth/reset-password` | 🌐 ⏱️ | Reset password |
| GET | `/auth/me` | 👤 | Current user |

### Users — `/users` (all 👤)
| Method | Path | Purpose |
|---|---|---|
| PATCH | `/users/me` | Update profile |
| POST | `/users/me/avatar` | Upload avatar |
| POST | `/users/me/password` | Change password |
| GET | `/users/me/sessions` | List sessions |
| DELETE | `/users/me/sessions/:id` | Revoke a session |
| POST | `/users/me/delete` | Delete account |
| GET | `/users/me/stats` | Student dashboard stats |
| GET | `/users/me/wishlist` | Wishlist |
| POST / DELETE | `/users/me/wishlist/:courseId` | Add / remove wishlist |
| GET | `/users/me/cart` | Cart |
| POST | `/users/me/cart/merge` | Merge guest cart |
| POST / DELETE | `/users/me/cart/:courseId` | Add / remove cart item |

### Catalog — `/` (🌐)
| Method | Path | Purpose |
|---|---|---|
| GET | `/home` | Home page data + stats |
| GET | `/stats` | Public stats |
| GET | `/categories` | Categories |
| GET | `/categories/:slug` | One category |
| GET | `/courses-batch` | Several courses by id (cart) |
| GET | `/courses` | Search / filter courses |
| GET | `/courses/:slug` | Course details (signed-in viewer gets enrolled/owner info) |
| GET | `/courses/:slug/related` | Related courses |
| GET | `/courses/:slug/reviews` | Reviews |
| GET | `/instructors/:id` | Instructor profile |
| POST | `/contact` | Contact form ⏱️ |

### Learning — `/learn` (all 👤 + enrolled / owner / admin check)
| Method | Path | Purpose |
|---|---|---|
| GET | `/learn/my-courses` | Enrolled courses |
| GET | `/learn/:courseId` | Player data |
| GET | `/learn/:courseId/lessons/:lessonId` | Lesson content |
| POST | `/learn/:courseId/progress` | Save progress |
| POST | `/learn/:courseId/lessons/:lessonId/quiz` | Submit quiz |
| GET / POST | `/learn/:courseId/notes` | List / add notes |
| DELETE | `/learn/:courseId/notes/:noteId` | Delete note |
| GET / POST | `/learn/:courseId/questions` | List / ask questions |
| POST | `/learn/questions/:questionId/answers` | Answer a question |
| GET / PUT | `/learn/:courseId/review` | My review / write review (enrolled only) |

### Certificates — `/certificates`
| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/certificates/mine` | 👤 | My certificates |
| GET | `/certificates/verify/:code` | 🌐 | Verify a certificate |
| GET | `/certificates/:code/pdf` | 🌐 | Download PDF |

### Commerce — `/` (all 👤)
| Method | Path | Purpose |
|---|---|---|
| POST | `/checkout/quote` | Price + coupon quote |
| POST | `/checkout` | Create order (Razorpay or test gateway) |
| POST | `/checkout/verify` | Verify payment → enroll |
| POST | `/checkout/:id/failed` | Mark payment failed |
| GET | `/orders` | My orders (admin: all) |
| GET | `/orders/:id` | One order / invoice |
| POST | `/orders/:id/refund` | Request refund |

### Notifications — `/notifications` (all 👤)
| Method | Path | Purpose |
|---|---|---|
| GET | `/notifications` | List |
| PATCH | `/notifications/read-all` | Mark all read |
| PATCH | `/notifications/:id/read` | Mark one read |

### Instructor — `/instructor` (all 🎓, plus own-course check)
| Method | Path | Purpose |
|---|---|---|
| GET | `/instructor/dashboard` | Dashboard metrics |
| GET | `/instructor/students` | My students |
| GET | `/instructor/questions` | Q&A inbox |
| GET | `/instructor/earnings` | Earnings |
| POST | `/instructor/payouts` | Request payout |
| GET / POST | `/instructor/courses` | List / create courses |
| GET / PATCH / DELETE | `/instructor/courses/:id` | Read / update / delete course |
| POST | `/instructor/courses/:id/media/:kind` | Upload thumbnail / promo video |
| GET | `/instructor/courses/:id/checklist` | Publish checklist |
| POST | `/instructor/courses/:id/submit` | Submit for review |
| POST | `/instructor/courses/:id/unpublish` | Unpublish |
| PUT | `/instructor/courses/:id/order` | Reorder curriculum |
| POST | `/instructor/courses/:id/sections` | Add section |
| PATCH / DELETE | `/instructor/courses/:id/sections/:sectionId` | Edit / delete section |
| POST | `/instructor/courses/:id/sections/:sectionId/lessons` | Add lesson |
| PATCH / DELETE | `/instructor/lessons/:lessonId` | Edit / delete lesson |
| POST | `/instructor/lessons/:lessonId/upload/:kind` | Upload lesson video / resource |

### Admin — `/admin` (all 🛡️, works during maintenance)
| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/overview` | Dashboard metrics |
| GET | `/admin/reports` | Reports |
| GET | `/admin/users` | Users list |
| PATCH | `/admin/users/:id` | Change role / ban / unban |
| GET | `/admin/courses` | Review queue |
| POST | `/admin/courses/:id/decision` | Approve / reject course |
| POST | `/admin/courses/:id/bestseller` | Toggle bestseller |
| POST | `/admin/reviews/:id/toggle` | Hide / show review |
| GET | `/admin/payments` | Payments |
| POST | `/admin/payments/:id/refund` | Approve / reject refund |
| GET | `/admin/payouts` | Payout requests |
| POST | `/admin/payouts/:id` | Approve / reject payout |
| GET / POST | `/admin/coupons` | List / create coupons |
| PATCH / DELETE | `/admin/coupons/:id` | Edit / delete coupon |
| POST | `/admin/categories` | Create category |
| PATCH / DELETE | `/admin/categories/:id` | Edit / delete category |
| GET | `/admin/audit` | Audit log |
| GET / PATCH | `/admin/settings` | Platform settings (revenue share, signup flags, maintenance) |

---

## 7. Status codes

| Code | Meaning |
|---|---|
| 400 | Validation failed (Zod) |
| 401 | Not signed in / token expired → client calls `/auth/refresh` automatically |
| 403 | Wrong role, banned account, or not your course/order |
| 404 | Not found |
| 429 | Too many requests (rate limit) |
| 503 | Maintenance mode (non-admins) |
