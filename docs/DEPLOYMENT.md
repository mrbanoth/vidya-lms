# Deploying Vidya (MongoDB Atlas + Render)

The API serves the built React app, so the whole site runs as **one Render web service** on one URL.

## 1. MongoDB Atlas
1. Create a project and an **M0 Free** cluster (region `ap-south-1` Mumbai).
2. **Database Access** → add user (read/write to any database). Save the password.
3. **Network Access** → add `0.0.0.0/0` (Render free instances have no fixed IP).
4. **Connect → Drivers** → copy the string and add `/vidya` before `?`:
   `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/vidya?retryWrites=true&w=majority`

## 2. Seed demo data (once, from your laptop)
```bash
# apps/server/.env → MONGO_URI=<the Atlas string>
npm install
npm run seed
```

## 3. Render
1. Sign in at render.com with GitHub → **New → Blueprint** → select `mrbanoth/vidya-lms`. Render reads `render.yaml`.
2. Fill the prompted values:
   - `MONGO_URI` = Atlas string
   - `CLIENT_URL` = `https://vidya-lms.onrender.com` (your service URL; update it after the first deploy if Render picks another name)
   - Leave Razorpay / Cloudinary / SMTP empty for now
3. **Apply**. The first build takes ~5 minutes. Open the URL and sign in with `student@vidya.dev` / `Password123`.

With `ALLOW_TEST_PAYMENTS=true` and no Razorpay keys, checkout shows the simulated payment so the demo works end to end. Set it to `false` once real keys are in.

## 4. Optional upgrades
| Feature | Env vars | Where to get them |
| --- | --- | --- |
| Real payments | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Razorpay Dashboard → API Keys (test mode first). Webhook URL: `https://<your-url>/api/v1/payments/webhook`, events `payment.captured`, `payment.failed` |
| Uploads that survive restarts | `CLOUDINARY_*` | cloudinary.com → Dashboard. Render's free disk is wiped on every deploy |
| Real emails (OTP, receipts) | `SMTP_HOST`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASS` | Brevo or Gmail app password. Without SMTP, sign-up codes only appear in Render logs |
| Google sign-in | `GOOGLE_CLIENT_ID` (server) and `VITE_GOOGLE_CLIENT_ID` (build) | Google Cloud Console → OAuth client, origin = your URL |

## Notes
- Free Render services sleep after 15 minutes idle; the first request takes ~50 s.
- Logs: Render → service → **Logs**. Health: `/api/v1/health`.
