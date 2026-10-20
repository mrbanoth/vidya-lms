# API reference

Base URL: `/api/v1`. All responses use `{ success, data, meta?, message? }`. Errors use `{ success: false, message, errors? }` where `errors` maps field names to messages.

**Auth:** send `Authorization: Bearer <accessToken>`. The refresh token is an `httpOnly` cookie (`vidya_rt`, path `/api/v1/auth`); call `POST /auth/refresh` to get a new access token. A machine-readable route list is served at `GET /api/v1/docs`.

Roles: 🌐 public · 👤 signed in · 🎓 instructor or admin · 🛡 admin.

## Auth

| Method | Path | | Notes |
| --- | --- | --- | --- |
| POST | `/auth/register` | 🌐 | `{ name, email, password, role? }` → emails a 6-digit code |
| POST | `/auth/verify-email` | 🌐 | `{ email, code }` → session |
| POST | `/auth/resend-code` | 🌐 | `{ email }` |
| POST | `/auth/login` | 🌐 | `{ email, password }` → session. `403 EMAIL_NOT_VERIFIED` if unverified, `423` when locked |
| POST | `/auth/google` | 🌐 | `{ credential }` (Google ID token) |
| POST | `/auth/refresh` | cookie | Rotates the refresh cookie, returns `{ user, accessToken }` |
| POST | `/auth/logout` | cookie | Revokes the session family |
| POST | `/auth/forgot-password` | 🌐 | `{ email }` |
| POST | `/auth/reset-password` | 🌐 | `{ token, password }` |
| GET | `/auth/me` | 👤 | Current user |

## Catalog

| Method | Path | | Notes |
| --- | --- | --- | --- |
| GET | `/home` | 🌐 | Bestsellers, newest, categories, reviews, stats |
| GET | `/stats` | 🌐 | Public platform numbers |
| GET | `/categories` · `/categories/:slug` | 🌐 | |
| GET | `/courses` | 🌐 | `q, category (slug list), level[], price=all|free|paid, rating, instructor, sort=popular|rating|newest|price-asc|price-desc, page, limit` |
| GET | `/courses-batch?ids=` | 🌐 | Cards by id (guest cart) |
| GET | `/courses/:slug` | 🌐 | Details, curriculum outline, rating distribution, `viewer` flags |
| GET | `/courses/:slug/related` · `/reviews` | 🌐 | |
| GET | `/instructors/:id` | 🌐 | Profile, stats, courses |
| POST | `/contact` | 🌐 | `{ name, email, topic, message }` |

## Account

| Method | Path | | Notes |
| --- | --- | --- | --- |
| PATCH | `/users/me` | 👤 | Profile and notification preferences |
| POST | `/users/me/avatar` | 👤 | multipart `file` (image, ≤ 5 MB) |
| POST | `/users/me/password` | 👤 | `{ currentPassword, newPassword }`, signs out other devices |
| GET / DELETE | `/users/me/sessions[/:id]` | 👤 | Signed-in devices |
| POST | `/users/me/delete` | 👤 | `{ password }` |
| GET | `/users/me/stats` | 👤 | Dashboard numbers and activity heatmap |
| GET / POST / DELETE | `/users/me/wishlist[/:courseId]` | 👤 | |
| GET / POST / DELETE | `/users/me/cart[/:courseId]` | 👤 | |
| POST | `/users/me/cart/merge` | 👤 | `{ courseIds }` from a guest cart |
| GET | `/notifications` | 👤 | `unread=true`, `type` |
| PATCH | `/notifications/read-all` · `/:id/read` | 👤 | |

## Learning

| Method | Path | | Notes |
| --- | --- | --- | --- |
| GET | `/learn/my-courses` | 👤 | Enrollments with progress |
| GET | `/learn/:courseId` | 👤 owner | Curriculum with completion state |
| GET | `/learn/:courseId/lessons/:lessonId` | 👤 owner | Full lesson; quiz answers stripped |
| POST | `/learn/:courseId/progress` | 👤 | `{ lessonId, positionSec?, completed? }` → progress, certificate when 100% |
| POST | `/learn/:courseId/lessons/:lessonId/quiz` | 👤 | `{ answers: number[] }` → score, review |
| GET / POST / DELETE | `/learn/:courseId/notes[/:noteId]` | 👤 | |
| GET / POST | `/learn/:courseId/questions` | 👤 | Q&A |
| POST | `/learn/questions/:questionId/answers` | 👤 | |
| GET / PUT | `/learn/:courseId/review` | 👤 | `{ rating 1-5, comment }` |
| GET | `/certificates/mine` | 👤 | |
| GET | `/certificates/verify/:code` | 🌐 | |
| GET | `/certificates/:code/pdf` | 🌐 | PDF with QR code |

## Commerce

| Method | Path | | Notes |
| --- | --- | --- | --- |
| POST | `/checkout/quote` | 👤 | `{ courseIds, code? }` → subtotal, discount, GST, total |
| POST | `/checkout` | 👤 | `{ courseIds, coupon? }` → order + `mode` (`razorpay`, `test`, `free`) |
| POST | `/checkout/verify` | 👤 | `{ orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }` |
| POST | `/checkout/:id/failed` | 👤 | Marks a pending order failed |
| POST | `/payments/webhook` | Razorpay | Raw body, `x-razorpay-signature` |
| GET | `/orders` · `/orders/:id` | 👤 | |
| POST | `/orders/:id/refund` | 👤 | `{ reason }`, within 30 days |

## Instructor studio (🎓)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/instructor/dashboard` | KPIs, weekly and daily earnings, questions, reviews |
| GET | `/instructor/students` | `q, course` |
| GET | `/instructor/questions` | `status=open|answered|all` |
| GET | `/instructor/earnings` · POST `/instructor/payouts` | `{ upi }`, minimum ₹500 |
| GET / POST | `/instructor/courses` | |
| GET / PATCH / DELETE | `/instructor/courses/:id` | |
| POST | `/instructor/courses/:id/media/thumbnail|promo` | multipart `file` |
| GET | `/instructor/courses/:id/checklist` | |
| POST | `/instructor/courses/:id/submit` · `/unpublish` | |
| PUT | `/instructor/courses/:id/order` | `{ sections: [{ id, lessons: [id] }] }` |
| POST / PATCH / DELETE | `/instructor/courses/:id/sections[/:sectionId]` | |
| POST | `/instructor/courses/:id/sections/:sectionId/lessons` | |
| PATCH / DELETE | `/instructor/lessons/:lessonId` | |
| POST | `/instructor/lessons/:lessonId/upload/video|resource` | multipart `file` |

## Admin (🛡)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/overview` · `/admin/reports?days=` | |
| GET / PATCH | `/admin/users[/:id]` | `{ role?, status? }` |
| GET | `/admin/courses?status=` | Review queue with checklist |
| POST | `/admin/courses/:id/decision` | `{ decision: approve|reject, reason? }` |
| POST | `/admin/courses/:id/bestseller` · `/admin/reviews/:id/toggle` | |
| GET | `/admin/payments` · POST `/admin/payments/:id/refund` | |
| GET | `/admin/payouts` · POST `/admin/payouts/:id` | |
| GET / POST / PATCH / DELETE | `/admin/coupons[/:id]` | |
| POST / PATCH / DELETE | `/admin/categories[/:id]` | |
| GET | `/admin/audit` | `q, action, page` |
| GET / PATCH | `/admin/settings` | |

## Real-time

Socket.IO at `/socket.io`, authenticated with `auth: { token: accessToken }`. Each user joins `user:<id>`; admins also join `admins`.

| Event | To | Payload |
| --- | --- | --- |
| `notification` | user | Notification document |
| `order:paid`, `refund:requested`, `course:submitted`, `payout:requested` | admins | `{ id, ... }` |
