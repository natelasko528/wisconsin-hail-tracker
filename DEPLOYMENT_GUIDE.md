# Wisconsin Hail Tracker - Deployment Guide

## Prerequisites
- ✅ GitHub repo: https://github.com/natelasko528/wisconsin-hail-tracker
- ⚪ Supabase account (free tier) - https://supabase.com
- ⚪ Vercel account (free tier) - https://vercel.com

---

## Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub
4. Create new organization (or use existing)
5. Create new project:
   - Name: `wisconsin-hail-tracker`
   - Database Password: Generate strong password (save it!)
   - Region: Choose closest to your users
   - Pricing: Free tier

### 1.2 Run Database Schema
1. In Supabase dashboard, navigate to **SQL Editor**
2. Click "New Query"
3. Copy contents of `supabase/schema.sql`
4. Paste into editor
5. Click **Run** to execute
6. Verify tables created in **Table Editor**

### 1.3 Get Supabase Credentials
1. Go to **Project Settings** > **API**
2. Copy these values (you'll need them for Vercel):
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
3. For data loading, also get:
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2: Load NOAA Hail Data

### 2.1 Install Data Loader Dependencies
```bash
cd wisconsin-hail-tracker/scripts
npm install @supabase/supabase-js csv-parse node-fetch
```

### 2.2 Set Environment Variables
Create `.env.local` file in scripts directory:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 2.3 Run Data Loader
```bash
cd scripts
node load-noaa-data.js
```

This downloads real NOAA Storm Events Database CSV files for Wisconsin hail storms (2023-2026).

**Expected runtime:** 5-10 minutes (downloads ~50MB compressed data)

### 2.4 Verify Data Loaded
1. Go to Supabase **Table Editor**
2. Open `hail_storms` table
3. Verify records exist (should see 1000+ Wisconsin hail events)

---

## Step 3: Deploy to Vercel

### Option A: Automatic Deployment (Easiest)

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select: `natelasko528/wisconsin-hail-tracker`
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
5. **Environment Variables:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
6. Click **Deploy**
7. Wait ~3 minutes for build to complete
8. Your app will be live at: `https://wisconsin-hail-tracker.vercel.app`

### Option B: Vercel CLI Deployment

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login:
```bash
vercel login
```

3. Deploy from frontend directory:
```bash
cd wisconsin-hail-tracker/frontend
vercel
```

4. Follow prompts, add environment variables when asked

5. Add API deployment:
```bash
cd ../api
vercel
```

---

## Step 4: Configure Custom Domain (Optional)

### 4.1 Add Domain in Vercel
1. Go to Vercel project **Settings** > **Domains**
2. Click "Add Domain"
3. Enter: `hail.yourdomain.com`
4. Click "Add"

### 4.2 Update DNS Records
Vercel will show you DNS records to add. Add these at your domain registrar:

**Type: A**
- Name: `hail`
- Value: `76.76.21.21`

**Type: CNAME** (for www)
- Name: `www.hail`
- Value: `cname.vercel-dns.com`

### 4.3 Wait for DNS Propagation
- Takes 5 minutes to 48 hours
- Check status in Vercel dashboard
- Vercel will auto-provision SSL certificate

---

## Step 5: Verify Deployment

### 5.1 Test API Endpoints
```bash
# Test hail storms API
curl https://your-app.vercel.app/api/hail

# Test stats API
curl https://your-app.vercel.app/api/stats

# Test leads API
curl https://your-app.vercel.app/api/leads
```

### 5.2 Test Frontend
1. Open: `https://your-app.vercel.app`
2. Verify:
   - Dashboard loads with stats
   - Map shows hail markers
   - Filters work correctly
   - Leads table populates

---

## Step 6: Set Up Monitoring

### 6.1 Vercel Analytics
- Automatic with deployment
- Go to **Analytics** tab in Vercel
- Monitor:
  - Page views
  - Unique visitors
  - Top pages
  - Core Web Vitals

### 6.2 Supabase Logs
1. Go to Supabase **Logs** > **Database**
2. Set up alerts for:
   - High query times
   - Failed connections
   - Rate limits

### 6.3 Uptime Monitoring
Set up free monitoring:
- **UptimeRobot**: https://uptimerobot.com
- **Pingdom**: https://pingdom.com
- Monitor: `https://your-app.vercel.app/api/stats`

---

## Environment Variables Reference

### Required (Production)
```env
# Supabase (public, exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...your-anon-key

# Supabase (server-side only, never expose)
SUPABASE_SERVICE_ROLE_KEY=eyJhb...your-service-role-key
```

### Optional
```env
# NOAA API (for real-time data fetching)
NOAA_API_TOKEN=your-token-here

# Custom domain
NEXT_PUBLIC_APP_URL=https://hail.yourdomain.com

# Email service (SendGrid, Resend, etc.)
SMTP_HOST=smtp.resend.com
SMTP_USER=resend
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

---

## Post-Deployment Checklist

### Database
- [x] Schema installed
- [ ] NOAA data loaded (1000+ records)
- [ ] Indexes verified
- [ ] RLS policies enabled
- [ ] Test data removed (if present)

### Application
- [ ] API endpoints responding
- [ ] Frontend builds successfully
- [ ] Environment variables set
- [ ] Database connection working
- [ ] Map tiles loading
- [ ] Charts rendering

### Security
- [ ] Service role key never exposed
- [ ] RLS policies prevent unauthorized access
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (Supabase default)
- [ ] HTTPS enforced

### Performance
- [ ] Lighthouse score >90
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s
- [ ] Database queries <100ms average
- [ ] API responses <200ms average

---

## Troubleshooting

### Build Errors

**"Module not found: Can't resolve '@/lib/supabase'"**
- Check: `frontend/lib/supabase.ts` exists
- Fix: Create the file or update import path

**"SUPABASE_URL is not defined"**
- Check: Environment variables in Vercel
- Fix: Add `NEXT_PUBLIC_SUPABASE_URL` in project settings

### Database Connection Issues

**"Failed to fetch: Connection refused"**
- Check: Supabase project is active (not paused)
- Fix: Resume project in Supabase dashboard

**"Row level security policy violated"**
- Check: RLS policies exist
- Fix: Run schema.sql to create policies

### Data Loading Issues

**"404 Not Found" when downloading NOAA data**
- Check: NOAA URLs in `load-noaa-data.js`
- Fix: Update to current year URLs

**"Duplicate key error"**
- Check: Event IDs in database
- Fix: Use `ON CONFLICT DO NOTHING` or update instead

---

## Scaling Considerations

### Supabase Free Tier Limits
- Database size: 500MB
- Bandwidth: 1GB/month
- API requests: 50K/month
- Concurrent connections: 60

**When to upgrade:**
- >400MB database used
- >800GB bandwidth/month
- >45K API requests/month
- Frequent connection timeouts

### Vercel Free Tier Limits
- Bandwidth: 100GB/month
- Execution time: 10s (Pro: 60s)
- Serverless functions: 100K invocations/month

**When to upgrade:**
- >80GB bandwidth/month
- Frequent function timeouts
- >90K function invocations

---

## Next Steps

1. **Authentication**: Add user accounts
2. **Email Service**: Configure SendGrid/Resend
3. **SMS Service**: Add Twilio integration
4. **Skip Tracing**: Integrate TLOxp API
5. **Automated Reports**: Set up scheduled jobs
6. **Backups**: Enable automated backups (Supabase Pro)
7. **Custom Domain**: Add branded domain
8. **Monitoring**: Set up alerting
9. **SEO**: Add meta tags, sitemap
10. **Analytics**: Add Google Analytics

---

## Resources

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **NOAA Storm Events**: https://www.ncdc.noaa.gov/stormevents/
- **Next.js Docs**: https://nextjs.org/docs
- **Leaflet Docs**: https://leafletjs.com/reference.html

---

## Support

For issues or questions:
1. Check GitHub issues: https://github.com/natelasko528/wisconsin-hail-tracker/issues
2. Supabase Discord: https://supabase.com/discord
3. Vercel Discord: https://vercel.com/discord
