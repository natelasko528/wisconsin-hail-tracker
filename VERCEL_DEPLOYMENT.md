# Vercel Deployment Fix

## Issue
The initial deployment showed 404 because Vercel didn't know how to handle the monorepo structure.

## Solution

### Option 1: Via Vercel Dashboard (RECOMMENDED)

1. Go to your Vercel project settings
2. **General** → **Root Directory**
3. Set to: `frontend`
4. Save
5. Redeploy

### Option 2: Keep Current Setup

The `vercel.json` has been updated to work with the monorepo:

```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm install && npm run build",
  "devCommand": "cd frontend && npm run dev",
  "installCommand": null,
  "outputDirectory": "frontend/.next"
}
```

## Environment Variables Needed

Add these in Vercel dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_APP_NAME=Wisconsin Hail Tracker
```

**Note:** For the backend API, you'll need to deploy it separately:
- Railway: https://railway.app
- Render: https://render.com
- Fly.io: https://fly.io

Then set `NEXT_PUBLIC_API_URL` to your backend URL.

## Quick Fix Steps

1. **Update Vercel Project Settings:**
   - Dashboard → Settings → General
   - Root Directory: `frontend`
   - Framework Preset: Next.js
   - Node Version: 18.x or higher

2. **Redeploy:**
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"

3. **Verify:**
   - Visit your deployment URL
   - Should see the app login page

## Current URLs

Based on your deployment:
- Preview: `wisconsin-hail-tracker-git-claude-843413-natelasko528s-projects.vercel.app`
- Latest: `wisconsin-hail-tracker-arnrbstqd-natelasko528s-projects.vercel.app`

## Backend Deployment

The frontend needs a backend API. Options:

### Railway (Easiest)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy backend
cd backend
railway init
railway up

# Get backend URL
railway domain

# Add to Vercel:
# NEXT_PUBLIC_API_URL = your-railway-url
```

### Render

1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables from `backend/.env.example`
6. Deploy
7. Copy service URL
8. Add to Vercel as `NEXT_PUBLIC_API_URL`

## Database Setup

For production, you need a database. Use Supabase (free):

1. Create account at https://supabase.com
2. Create project
3. Copy connection string
4. Add to backend deployment as `DATABASE_URL`
5. Run schema in SQL Editor (see SUPABASE_SETUP.md)

## Full Production Stack

1. **Frontend:** Vercel (already deployed)
2. **Backend:** Railway or Render
3. **Database:** Supabase
4. **Total cost:** $0-25/month

## Testing Deployment

Once backend is deployed and environment variables are set:

```bash
# Test backend
curl https://your-backend-url.com/health

# Should return:
# {"status":"ok","timestamp":"...","version":"2.0.0",...}
```

Then visit your Vercel URL and it should work!
