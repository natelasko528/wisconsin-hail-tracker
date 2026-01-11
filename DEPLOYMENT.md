# 🚀 Wisconsin Hail Tracker - Deployment Guide

## Quick Deploy to Vercel (5 minutes)

### Current Setup Status
✅ **Database**: Supabase (Already Configured)
✅ **Build**: Passing
✅ **Branch**: `claude/parallel-analysis-fix-4ewI6`
✅ **Local**: Running on http://localhost:3000

### Prerequisites
1. **Vercel Account** - Sign up at https://vercel.com
2. **GitHub Account** - Repository already at `natelasko528/wisconsin-hail-tracker`
3. **Supabase** - ✅ Already configured with credentials

## Step 1: Deploy Database

### Using Neon (Recommended)

1. Go to https://neon.tech and create account
2. Create new project: "wisconsin-hail-tracker"
3. Copy the connection string
4. Run the schema:
   ```bash
   psql "YOUR_CONNECTION_STRING" < backend/database/schema.sql
   ```
5. Seed the database (optional):
   ```bash
   psql "YOUR_CONNECTION_STRING" < backend/database/seed.sql
   ```

## Step 2: Get API Keys

### Required Services

1. **NOAA API Token**
   - Go to: https://www.ncdc.noaa.gov/cdo-web/token
   - Request a token (free)
   - Note: May take 1-2 days to receive

2. **SendGrid API Key** (for emails)
   - Go to: https://sendgrid.com
   - Create account
   - Navigate to Settings → API Keys
   - Create new API key with "Mail Send" permissions

3. **Twilio Credentials** (for SMS)
   - Go to: https://www.twilio.com
   - Create account
   - Get Account SID, Auth Token, and Phone Number
   - Note: Requires payment method

4. **GoHighLevel API Key** (optional)
   - Log into GoHighLevel
   - Go to Settings → API
   - Generate API key

5. **Skip Tracing Service** (optional)
   - TLOxp: Contact for API access
   - Alternative: IDI Data, BatchSkipTracing

## Step 3: Deploy to Vercel

### Via GitHub (Recommended)

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. Add environment variables (see below)
6. Click "Deploy"

### Via Vercel CLI

```bash
npm install -g vercel
cd frontend
vercel
```

## Step 4: Environment Variables

Add these in Vercel dashboard → Settings → Environment Variables:

### Frontend Variables

```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_APP_NAME=Wisconsin Hail Tracker
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

### Backend Variables (if deploying backend separately)

```
# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
JWT_SECRET=generate_secure_random_string_here
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=generate_another_secure_string_here
REFRESH_TOKEN_EXPIRES_IN=30d

# NOAA API
NOAA_API_TOKEN=your_noaa_token

# Skip Tracing
SKIPTRACE_PROVIDER=tloxp
TLOXP_API_KEY=your_tloxp_key

# GoHighLevel
GHL_API_KEY=your_ghl_key
GHL_LOCATION_ID=your_location_id
GHL_WEBHOOK_SECRET=generate_webhook_secret

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Wisconsin Hail Tracker

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+15551234567

# Redis (optional)
REDIS_URL=redis://default:password@host:6379

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Feature Flags
ENABLE_SKIP_TRACING=true
ENABLE_EMAIL_CAMPAIGNS=true
ENABLE_SMS_CAMPAIGNS=true
ENABLE_GHL_SYNC=true
ENABLE_AUTO_HAIL_SYNC=true

# Costs
SKIPTRACE_COST_PER_LOOKUP=0.25
SMS_COST_PER_MESSAGE=0.0079
EMAIL_COST_PER_MESSAGE=0.001
```

## Step 5: Deploy Backend

### Option A: Railway (Recommended)

1. Go to https://railway.app
2. Create new project
3. Add service → GitHub Repo
4. Select your repository
5. Set root directory to `backend`
6. Add environment variables
7. Deploy

### Option B: Render

1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables
6. Create Web Service

### Option C: Fly.io

```bash
cd backend
fly launch
fly secrets import < .env
fly deploy
```

## Step 6: Configure Custom Domain (Optional)

1. Go to Vercel dashboard → Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Wait for DNS propagation (up to 48 hours)

## Step 7: Set Up Monitoring

### Error Tracking (Optional)

**Sentry:**
```bash
npm install @sentry/nextjs @sentry/node
```

Add to environment variables:
```
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_DSN=your_sentry_dsn
```

### Analytics (Optional)

**Google Analytics:**
```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## Step 8: Test Deployment

1. Visit your deployed URL
2. Test authentication:
   - Register new account
   - Login
   - Logout
3. Test features:
   - Create lead
   - View dashboard
   - Test campaigns
   - Test skip tracing

## Step 9: Enable Auto-Deployment

1. In Vercel dashboard:
   - Go to Settings → Git
   - Enable "Auto-deploy" for main branch
2. Every push to main will trigger deployment

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Verify all dependencies are in package.json
- Check for TypeScript errors

### Database Connection Fails

- Verify DATABASE_URL is correct
- Check if database allows connections from Vercel IPs
- Test connection locally

### API Calls Fail

- Check NEXT_PUBLIC_API_URL is set correctly
- Verify CORS settings in backend
- Check backend deployment logs

### Authentication Issues

- Verify JWT secrets are set
- Check if tokens are being stored in localStorage
- Clear browser cache and try again

## Cost Estimates

### Monthly Costs (Approximate)

- **Vercel**: $0-20 (free tier available)
- **Database (Neon)**: $0-25 (free tier: 0.5GB)
- **Redis (Upstash)**: $0-10 (free tier: 10K commands/day)
- **SendGrid**: $15-50 (Essential plan: 100 emails/day free)
- **Twilio SMS**: Variable ($0.0079 per message)
- **Skip Tracing**: Variable ($0.15-0.50 per lookup)

**Total**: ~$50-150/month + usage-based costs

## Security Checklist

- [ ] All API keys stored as environment variables
- [ ] JWT secrets are cryptographically random
- [ ] Database password is strong
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Security headers enabled (Helmet)
- [ ] Database backups configured

## Performance Optimization

1. **Enable caching**:
   - Add Redis for session storage
   - Cache NOAA API responses

2. **Optimize images**:
   - Use Next.js Image component
   - Enable image optimization in Vercel

3. **Enable compression**:
   - Automatic in Vercel

4. **Database optimization**:
   - Add indexes (already in schema.sql)
   - Enable connection pooling

## Backup Strategy

1. **Database backups**:
   - Neon: Automatic daily backups
   - Set up manual backup script

2. **Code backups**:
   - Already in GitHub

3. **Environment variables**:
   - Keep encrypted copy in secure location

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Neon Docs**: https://neon.tech/docs

## Next Steps

After deployment:
1. Set up monitoring and alerts
2. Configure backups
3. Enable SSL/HTTPS (automatic)
4. Add custom domain
5. Set up staging environment
6. Configure CI/CD pipeline
7. Add automated testing
