# ⚠️ CRITICAL: Vercel 404 Fix Required

## The Problem

Your Vercel deployment shows 404 because Vercel's **Root Directory setting** in the dashboard is not set to `frontend`.

The `vercel.json` file has the correct configuration, but **Vercel's dashboard settings override vercel.json**.

## ✅ The Fix (Takes 30 seconds)

### Option 1: Update Vercel Dashboard Settings (RECOMMENDED)

1. **Go to**: https://vercel.com/natelasko528s-projects/wisconsin-hail-tracker/settings/general

2. **Scroll to "Root Directory"**

3. **Click "Edit"**

4. **Type**: `frontend`

5. **Click "Save"**

6. **Go to Deployments**: https://vercel.com/natelasko528s-projects/wisconsin-hail-tracker

7. **Click "..." on latest deployment → "Redeploy"**

**That's it!** Your app will be live in 2-3 minutes at https://wisconsin-hail-tracker.vercel.app

---

### Option 2: Deploy via CLI (if you prefer)

```bash
cd /home/user/wisconsin-hail-tracker/frontend

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

---

## Why This Happened

- Your repository is a **monorepo** (backend + frontend in separate folders)
- Vercel defaults to deploying from the **root directory**
- The frontend files are in `/frontend` subdirectory
- Vercel needs to know to look in `/frontend` instead of `/`

---

## What I Fixed

✅ **All Build Errors Fixed:**
- Google Fonts loading issue (switched to runtime loading)
- TypeScript type errors in campaigns, dashboard, and API client
- Frontend now builds successfully (11 routes generated)

✅ **Configuration Files Created:**
- `vercel.json` - Points to frontend directory
- `.vercelignore` - Excludes backend from deployment

✅ **Code Pushed to GitHub:**
- Latest commit: "🔧 Fix Frontend Build - TypeScript Errors and Google Fonts"
- All files committed and pushed
- Ready for Vercel to build

---

## Once Vercel is Fixed

Your frontend will deploy successfully. Then you'll need to:

### 1. Deploy the Backend

**Easiest option** - Run this script:
```bash
cd /home/user/wisconsin-hail-tracker
./deploy-now.sh
```

Or follow: [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)

### 2. Connect Frontend to Backend

Once backend is deployed, add this environment variable in Vercel:
- Go to: https://vercel.com/natelasko528s-projects/wisconsin-hail-tracker/settings/environment-variables
- Add: `NEXT_PUBLIC_API_URL` = `<your-backend-url>`
- Redeploy

---

## Summary

**3 steps to get fully working:**

1. ✅ **Fix Vercel Root Directory** (30 seconds) ← **DO THIS NOW**
2. ⏳ **Deploy Backend** (2 minutes) - See QUICK_DEPLOY.md
3. ⏳ **Add Backend URL to Vercel** (30 seconds)

Total time: **3 minutes**

---

## Test When Done

Visit: https://wisconsin-hail-tracker.vercel.app

Login with:
- Email: `admin@example.com`
- Password: `password123`

If you see the dashboard, **you're done!** 🎉
