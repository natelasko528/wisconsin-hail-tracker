# Vercel Deployment Configuration Guide

## ✅ Completed

1. **Fixed build errors:**
   - Added Suspense boundaries to `/skip-trace` and `/skiptrace` pages
   - Fixed TypeScript type errors in `StormMap.tsx` and `api.ts`
   - Fixed Property type compatibility issues

2. **Updated `vercel.json`:**
   - Removed `cd frontend` commands (root directory will be set to `frontend` in Vercel)
   - Simplified build commands
   - Removed hardcoded env vars (now configured via Vercel UI)

## 🔧 Required Vercel Configuration Steps

Follow these steps in the Vercel Dashboard:

### Step 1: Set Root Directory
1. Go to: https://vercel.com/natelasko528s-projects/wisconsin-hail-tracker
2. Click **Settings** tab
3. Find **Root Directory** section
4. Click **Edit** and set to: `frontend`
5. Click **Save**

### Step 2: Configure Environment Variables

Go to **Settings** → **Environment Variables** and add:

#### Required Variables:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: `https://hekxyqhylzczirrbpldx.supabase.co`
   - Environments: ✓ Production ✓ Preview ✓ Development

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhla3h5cWh5bHpjemlycmJwbGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDUwMjMsImV4cCI6MjA3NTk4MTAyM30.EVRJEhTbDmvRKFim7FaPQaD5LbUrlTSNpsP08Zm46tM`
   - Environments: ✓ Production ✓ Preview ✓ Development

3. **NEXT_PUBLIC_APP_NAME**
   - Value: `Wisconsin Hail Tracker`
   - Environments: ✓ Production ✓ Preview ✓ Development

#### Optional Feature Flags (recommended):

4. **NEXT_PUBLIC_ENABLE_SKIP_TRACING**
   - Value: `true`
   - Environments: ✓ Production ✓ Preview ✓ Development

5. **NEXT_PUBLIC_ENABLE_CAMPAIGNS**
   - Value: `true`
   - Environments: ✓ Production ✓ Preview ✓ Development

6. **NEXT_PUBLIC_ENABLE_GHL_SYNC**
   - Value: `true`
   - Environments: ✓ Production ✓ Preview ✓ Development

7. **NEXT_PUBLIC_ENABLE_MAP_VIEW**
   - Value: `true`
   - Environments: ✓ Production ✓ Preview ✓ Development

### Step 3: Trigger Redeploy

1. Go to **Deployments** tab
2. Find your latest deployment
3. Click the **three dots (⋯)** on the right
4. Click **Redeploy**
5. **Uncheck** "Use existing Build Cache"
6. Click **Redeploy** button

## 📝 Notes

- The `vercel.json` file has been updated to work with the `frontend` root directory
- Build commands no longer include `cd frontend` since Vercel will set the working directory
- All environment variables should be set in the Vercel UI, not in `vercel.json`
- The build should now complete successfully after these configurations

## 🚀 After Deployment

Once deployed, verify the site loads at your Vercel URL. If you see a 404:
- Check that Root Directory is set to `frontend`
- Verify all environment variables are set correctly
- Check the deployment logs for any build errors
