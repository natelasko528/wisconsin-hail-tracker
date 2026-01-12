# Complete Configuration Guide - Wisconsin Hail Tracker

## ✅ Completed Actions

### 1. Supabase Security Fixes Applied ✓
- Fixed all function search_path vulnerabilities
- Secured RLS policies (removed overly permissive anon policies)
- Enabled RLS on spatial_ref_sys table
- All database functions now have proper security settings

**Migration Applied:** `backend/migrations/005_fix_security_issues.sql`

### 2. Vercel Project Identified ✓
- **Project ID:** `prj_qd1iqUaMDRDc2xbycoR7pp4KeEvy`
- **Team ID:** `team_ah51VwV9X4Ey6CbIA7TjleSZ`
- **Current Framework Detection:** Express (INCORRECT - should be Next.js)
- **Current Status:** Latest deployment ERROR - "cd frontend: No such file or directory"

### 3. Supabase Project Details ✓
- **Project:** Hail Storm Pro
- **Project ID:** `hekxyqhylzczirrbpldx`
- **Status:** ACTIVE_HEALTHY
- **URL:** `https://hekxyqhylzczirrbpldx.supabase.co`
- **Database:** PostgreSQL 17.6.1.021

---

## 🔧 REQUIRED VERCEL CONFIGURATION

### Step 1: Set Root Directory

**Current Issue:** Vercel is trying to build from the repository root, but the Next.js app is in the `frontend/` subdirectory.

**Fix:**
1. Go to: https://vercel.com/natelasko528s-projects/wisconsin-hail-tracker/settings/general
2. Scroll to **"Root Directory"** section
3. Click **"Edit"** 
4. Set to: `frontend`
5. Click **"Save"**

**Alternative via URL:**
Navigate to: https://vercel.com/natelasko528s-projects/wisconsin-hail-tracker/settings?section=general

### Step 2: Update Build Settings

After setting root directory, Vercel should auto-detect Next.js. Verify these settings:

- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (should auto-populate)
- **Output Directory:** `.next` (should auto-populate)
- **Install Command:** `npm install` (should auto-populate)

### Step 3: Configure Environment Variables

Navigate to: https://vercel.com/natelasko528s-projects/wisconsin-hail-tracker/settings/environment-variables

Add these variables for **Production, Preview, AND Development**:

#### Required Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://hekxyqhylzczirrbpldx.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhla3h5cWh5bHpjemlycmJwbGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDUwMjMsImV4cCI6MjA3NTk4MTAyM30.EVRJEhTbDmvRKFim7FaPQaD5LbUrlTSNpsP08Zm46tM

NEXT_PUBLIC_APP_NAME=Wisconsin Hail Tracker
```

#### Optional Feature Flags:

```bash
NEXT_PUBLIC_ENABLE_SKIP_TRACING=true
NEXT_PUBLIC_ENABLE_CAMPAIGNS=true
NEXT_PUBLIC_ENABLE_GHL_SYNC=true
NEXT_PUBLIC_ENABLE_MAP_VIEW=true
```

**Important:** Select all three environment checkboxes (Production, Preview, Development) for each variable.

### Step 4: Redeploy

1. Go to: https://vercel.com/natelasko528s-projects/wisconsin-hail-tracker/deployments
2. Find the latest deployment
3. Click the **three dots (⋯)** menu
4. Select **"Redeploy"**
5. **Uncheck** "Use existing Build Cache"
6. Click **"Redeploy"**

---

## 🔐 SUPABASE CONFIGURATION STATUS

### Security Issues Fixed ✓

All critical security vulnerabilities have been resolved:

1. **Function Search Path** - All functions now have `SET search_path = public`
2. **RLS Policies** - Removed overly permissive anonymous policies
3. **Spatial Tables** - RLS enabled on spatial_ref_sys
4. **Authenticated Access Only** - Write operations now require authentication

### Database Tables Verified ✓

- ✅ `properties` (2 rows)
- ✅ `leads` (2 rows)  
- ✅ `storm_events` (1 row)
- ✅ `campaigns` (0 rows)
- ✅ `campaign_leads` (0 rows)
- ✅ `skip_trace_results` (4 rows)
- ✅ `ghl_sync_log` (0 rows)
- ✅ `activity_log` (5 rows)
- ✅ `notes` (0 rows)

All tables have RLS enabled with appropriate policies.

---

## 📋 VERCEL DEPLOYMENT CHECKLIST

- [ ] Root Directory set to `frontend`
- [ ] Framework detected as "Next.js"
- [ ] Environment variables added (all 3 environments)
- [ ] Build settings verified
- [ ] Deployment triggered with fresh cache
- [ ] Deployment status: READY
- [ ] Site accessible at: https://wisconsin-hail-tracker-natelasko528s-projects.vercel.app

---

## 🐛 TROUBLESHOOTING

### Issue: "cd frontend: No such file or directory"
**Cause:** Root directory not set in Vercel settings
**Fix:** Follow Step 1 above

### Issue: Framework detected as "Express"
**Cause:** Root directory not set, Vercel scanning from root
**Fix:** Set root directory to `frontend` and redeploy

### Issue: Build succeeds but 404 on site
**Cause:** Next.js not properly detected or output directory incorrect
**Fix:** Verify root directory is `frontend`, output directory is `.next`

### Issue: Environment variables not working
**Cause:** Variables not set for correct environment (Production/Preview/Development)
**Fix:** Ensure all variables are added with all three checkboxes selected

---

## 📊 CURRENT DEPLOYMENT STATUS

**Latest Deployment:** `dpl_9wMNYK1yoeVQnejems7ZNqBV9ZDA`
- **Status:** ERROR
- **Error:** "cd frontend: No such file or directory"
- **Branch:** main
- **Commit:** e780d5b

**Last Successful Deployment:** `dpl_2oUuJkas2RPb25Ysdi7eeGqbuvys`
- **Status:** READY
- **Branch:** main
- **Commit:** 6b3625b

---

## 🚀 QUICK FIX SUMMARY

1. **Vercel Settings:** Set Root Directory = `frontend`
2. **Environment Variables:** Add Supabase URL and Key
3. **Redeploy:** Fresh deployment without cache
4. **Verify:** Check deployment logs and site URL

**Total Time:** ~5 minutes

---

## 📞 SUPPORT RESOURCES

- **Vercel Dashboard:** https://vercel.com/natelasko528s-projects/wisconsin-hail-tracker
- **Supabase Dashboard:** https://supabase.com/dashboard/project/hekxyqhylzczirrbpldx
- **Deployment Logs:** https://vercel.com/natelasko528s-projects/wisconsin-hail-tracker/9wMNYK1yoeVQnejems7ZNqBV9ZDA

---

**Last Updated:** January 11, 2026
**Configuration Status:** Supabase ✓ | Vercel ⚠️ (Root directory needed)
