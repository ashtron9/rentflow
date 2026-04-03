# 🚀 RentFlow React — Vercel Deploy Guide

Zero CS knowledge needed. Follow these steps in order.

---

## PART 1 — Run Locally First (Optional but recommended)

1. Install **Node.js** from https://nodejs.org (download the LTS version)
2. Open Terminal (Mac) or Command Prompt (Windows) in the `rentflow-react` folder
3. Run these commands one by one:

```bash
npm install
```
```bash
cp .env.example .env.local
```

4. Open `.env.local` in any text editor (Notepad is fine) and fill in:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
(Get these from Supabase → Project Settings → API)

5. Start the app:
```bash
npm run dev
```
6. Open http://localhost:5173 — you should see RentFlow!

---

## PART 2 — Push to GitHub

1. Go to https://github.com and create a **New Repository**
   - Name: `rentflow`
   - Set to **Private** (your Supabase keys will be in env vars, NOT the code, so this is safe)
   - Click **Create repository**

2. On your computer, open Terminal in the `rentflow-react` folder and run:

```bash
git init
git add .
git commit -m "Initial RentFlow commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/rentflow.git
git push -u origin main
```
(Replace YOUR_USERNAME with your GitHub username)

---

## PART 3 — Deploy on Vercel (Free)

1. Go to https://vercel.com and sign up with your GitHub account

2. Click **"Add New Project"**

3. Click **"Import"** next to your `rentflow` repository

4. In the **Configure Project** screen:
   - Framework Preset: **Vite** (Vercel usually auto-detects this ✅)
   - Build Command: `npm run build` (auto-filled ✅)
   - Output Directory: `dist` (auto-filled ✅)

5. ⚠️ **CRITICAL — Add Environment Variables:**
   - Scroll down to **"Environment Variables"**
   - Add these two:

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `your-anon-key-here` |

6. Click **"Deploy"**

7. Wait ~60 seconds → Your app is LIVE at `https://rentflow-xxxx.vercel.app` 🎉

---

## PART 4 — Update the App Later

Whenever you want to change something:
1. Edit the files locally
2. Run: `git add . && git commit -m "update" && git push`
3. Vercel automatically redeploys in ~30 seconds

---

## PART 5 — Add a Custom Domain (Optional)

1. In Vercel → your project → **Settings → Domains**
2. Add your domain (e.g. `rentflow.yourdomain.com`)
3. Follow Vercel's DNS instructions — usually just adding a CNAME record

---

## Supabase: Same Database, Zero Changes

Your existing Supabase tables, data, and RLS policies work as-is.
The only difference: instead of Streamlit reading the secrets file,
Vercel reads the environment variables you set in Step 5.

---

## Troubleshooting

**"Failed to fetch" on login** → Check your env vars in Vercel. They must start with `VITE_`.

**Blank white screen** → Open browser DevTools (F12) → Console tab → look for errors.
Most common: env vars not set, or typo in Supabase URL.

**"Invalid API key"** → Make sure you used the `anon/public` key, not `service_role`.

**Page refreshes give 404** → In Vercel → Project Settings → add a rewrite rule:
Source: `/(.*)`  Destination: `/index.html`  (Vercel usually handles this automatically for Vite)

---

*Your data stays in Supabase. Vercel only hosts the frontend HTML/JS files.*
