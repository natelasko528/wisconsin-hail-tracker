# Backend Deployment Guide

This guide provides **3 one-click deployment options** for the Wisconsin Hail Tracker backend.

## 🚀 Quick Deploy Options

### Option 1: Railway (Recommended - Easiest)

**Why Railway?**
- ✅ Automatic HTTPS
- ✅ Free $5/month credit (enough for development)
- ✅ Zero configuration needed
- ✅ Automatic deployments from GitHub

**Deploy Steps:**

1. **Click Deploy Button:**

   [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/YOUR_USERNAME/wisconsin-hail-tracker&plugins=postgresql&envs=JWT_SECRET,REFRESH_TOKEN_SECRET,FRONTEND_URL&JWT_SECRETDesc=Random+32+character+string&REFRESH_TOKEN_SECRETDesc=Different+random+32+character+string&FRONTEND_URLDefault=https://wisconsin-hail-tracker.vercel.app)

2. **Or Manual Setup:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login to Railway
   railway login

   # Navigate to backend
   cd backend

   # Initialize Railway project
   railway init

   # Add environment variables (Railway will prompt you)
   railway variables set JWT_SECRET=$(openssl rand -base64 32)
   railway variables set REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)
   railway variables set FRONTEND_URL=https://wisconsin-hail-tracker.vercel.app
   railway variables set USE_IN_MEMORY_DB=true
   railway variables set NODE_ENV=production

   # Deploy!
   railway up

   # Get your backend URL
   railway domain
   ```

3. **Copy the URL** (e.g., `https://your-app.up.railway.app`)

4. **Go to Vercel Dashboard** and add environment variable:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://your-app.up.railway.app`
   - Click "Save" and "Redeploy"

---

### Option 2: Render (Free Forever Tier)

**Why Render?**
- ✅ Completely free (500 hours/month)
- ✅ Automatic SSL
- ✅ GitHub integration
- ✅ Zero credit card required

**Deploy Steps:**

1. **Click Deploy Button:**

   [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/YOUR_USERNAME/wisconsin-hail-tracker)

2. **Or Manual Setup:**

   a. Go to https://render.com and sign in with GitHub

   b. Click **"New +"** → **"Web Service"**

   c. Connect your GitHub repository

   d. Configure service:
      - **Name:** `wisconsin-hail-tracker-backend`
      - **Region:** Oregon (US West)
      - **Branch:** `main` (or your branch)
      - **Root Directory:** `backend`
      - **Runtime:** Node
      - **Build Command:** `npm install`
      - **Start Command:** `npm start`
      - **Plan:** Free

   e. Add **Environment Variables:**
      ```
      NODE_ENV=production
      USE_IN_MEMORY_DB=true
      PORT=3001
      FRONTEND_URL=https://wisconsin-hail-tracker.vercel.app
      JWT_SECRET=<generate-random-32-chars>
      REFRESH_TOKEN_SECRET=<generate-different-random-32-chars>
      ```

      Generate secrets with:
      ```bash
      openssl rand -base64 32
      ```

   f. Click **"Create Web Service"**

   g. Wait 3-5 minutes for deployment

3. **Copy the URL** from Render dashboard (e.g., `https://wisconsin-hail-tracker-backend.onrender.com`)

4. **Update Vercel:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-render-url.onrender.com`
   - Redeploy

---

### Option 3: Fly.io (Great for Global Users)

**Why Fly.io?**
- ✅ Global edge network (low latency worldwide)
- ✅ Free tier includes 3GB storage
- ✅ Docker-based (maximum control)

**Deploy Steps:**

1. **Install Fly CLI:**
   ```bash
   # Mac/Linux
   curl -L https://fly.io/install.sh | sh

   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Navigate to backend:**
   ```bash
   cd backend
   ```

4. **Launch app:**
   ```bash
   fly launch
   ```

   When prompted:
   - App name: `wisconsin-hail-tracker-backend` (or your choice)
   - Region: Choose closest to your users
   - PostgreSQL: No (we're using in-memory DB for now)
   - Redis: No

5. **Set environment variables:**
   ```bash
   fly secrets set JWT_SECRET=$(openssl rand -base64 32)
   fly secrets set REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)
   fly secrets set FRONTEND_URL=https://wisconsin-hail-tracker.vercel.app
   fly secrets set USE_IN_MEMORY_DB=true
   fly secrets set NODE_ENV=production
   ```

6. **Deploy:**
   ```bash
   fly deploy
   ```

7. **Get URL:**
   ```bash
   fly info
   ```

   Your URL will be: `https://wisconsin-hail-tracker-backend.fly.dev`

8. **Update Vercel** with `NEXT_PUBLIC_API_URL`

---

## 📋 Post-Deployment Checklist

After deploying to any platform:

### 1. Test Backend Health
```bash
curl https://your-backend-url.com/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-09T...",
  "version": "2.0.0",
  "database": "connected",
  "uptime": 123.456
}
```

### 2. Update Vercel Environment

Go to: https://vercel.com/YOUR_USERNAME/wisconsin-hail-tracker/settings/environment-variables

Add:
- **Name:** `NEXT_PUBLIC_API_URL`
- **Value:** Your backend URL (e.g., `https://your-app.up.railway.app`)
- **Environments:** Production, Preview, Development
- Click **"Save"**

Then go to **Deployments** tab and click **"Redeploy"** on latest deployment.

### 3. Test Login

Visit: https://wisconsin-hail-tracker.vercel.app/login

Try logging in with:
- Email: `admin@example.com`
- Password: `password123`

If login works, **you're done!** 🎉

---

## 🔧 Production Upgrades (Optional)

### Add PostgreSQL Database

The backend currently uses in-memory database. For production with persistent data:

#### Railway:
```bash
railway add postgresql
railway variables set USE_IN_MEMORY_DB=false
railway variables set DATABASE_URL=$DATABASE_URL
```

#### Render:
1. Dashboard → "New +" → PostgreSQL
2. Copy connection string
3. Update backend environment: `DATABASE_URL=<connection-string>`
4. Set `USE_IN_MEMORY_DB=false`

#### Supabase (Free, Recommended):
1. Create project at https://supabase.com
2. Copy connection string from Settings → Database
3. Run schema from `backend/database/schema.sql` in SQL Editor
4. Update backend: `DATABASE_URL=<supabase-connection-string>`
5. Set `USE_IN_MEMORY_DB=false`

### Add Google Gemini AI (Free)

1. Get free API key: https://makersuite.google.com/app/apikey
2. Add to backend environment:
   ```bash
   GEMINI_API_KEY=your-key-here
   GEMINI_MODEL=gemini-1.5-flash
   ```
3. Restart backend

Features enabled:
- Lead scoring (0-100)
- Email generation
- SMS generation
- Note summarization
- Tag suggestions

---

## 🆘 Troubleshooting

### Backend returns 500 error
Check logs:
```bash
# Railway
railway logs

# Render
# Click "Logs" tab in dashboard

# Fly.io
fly logs
```

### CORS errors in browser
Make sure `FRONTEND_URL` is set to your Vercel URL:
```bash
FRONTEND_URL=https://wisconsin-hail-tracker.vercel.app
```

### Database connection fails
If using PostgreSQL and getting connection errors:
```bash
# Temporarily switch to in-memory mode
USE_IN_MEMORY_DB=true

# Or check DATABASE_URL format:
# postgresql://user:password@host:5432/database
```

### Port binding issues
Most platforms set `PORT` automatically. If not:
```bash
PORT=3001  # or whatever port your platform requires
```

---

## 💰 Cost Comparison

| Platform | Free Tier | Paid Plans | Best For |
|----------|-----------|------------|----------|
| **Railway** | $5/month credit | $5/month per resource | Easiest setup |
| **Render** | 500 hours/month | $7/month | Zero cost |
| **Fly.io** | 3GB storage, 160GB transfer | $1.94/month | Global users |

**Recommendation:** Start with **Render's free tier** (completely free, no credit card needed).

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)
- [Fly.io Documentation](https://fly.io/docs/)
- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Gemini AI Setup](./GEMINI_SETUP.md)

---

## ✅ Summary

You now have **3 easy options** to deploy your backend:

1. **Railway** - Easiest, one command deployment
2. **Render** - Completely free forever
3. **Fly.io** - Best global performance

Pick one, follow the steps, and your app will be live in minutes! 🚀
