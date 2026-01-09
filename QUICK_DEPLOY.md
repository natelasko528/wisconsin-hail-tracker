# 🚀 2-Minute Backend Deployment

## The Absolute Easiest Way to Deploy

**You need to do this ONCE, then everything auto-deploys forever.**

---

## 🎯 Quick Start (2 minutes)

### Step 1: Create Render Account (30 seconds)

1. Go to: https://render.com/
2. Click **"Get Started for Free"**
3. Sign in with **GitHub**
4. ✅ Done! (No credit card needed)

### Step 2: Deploy Backend (60 seconds)

1. Click: https://render.com/deploy?repo=https://github.com/natelasko528/wisconsin-hail-tracker

   **OR** if that doesn't work:

   a. Go to: https://dashboard.render.com/
   b. Click: **"New +"** → **"Web Service"**
   c. Click: **"Connect GitHub"** → Select **"wisconsin-hail-tracker"**
   d. Configure:
      - **Name**: `wisconsin-hail-tracker-backend`
      - **Root Directory**: `backend`
      - **Environment**: `Node`
      - **Build Command**: `npm install`
      - **Start Command**: `npm start`
      - **Plan**: **Free**

2. Click **"Advanced"** and add **Environment Variables**:

   ```
   NODE_ENV=production
   USE_IN_MEMORY_DB=true
   PORT=3001
   FRONTEND_URL=https://wisconsin-hail-tracker.vercel.app
   JWT_SECRET=tyROjR8cjBveQuOl3qGRPoy3dov11TKssJV0yZEMyaM=
   REFRESH_TOKEN_SECRET=AsIzct6vkdxNmchDu7hTSv5GlkFH49PZSnHjbnGfIEY=
   ```

3. Click **"Create Web Service"**

4. ⏱️ Wait 3-5 minutes for deployment

5. **Copy your URL** (looks like: `https://wisconsin-hail-tracker-backend.onrender.com`)

### Step 3: Update Vercel (30 seconds)

1. Go to: https://vercel.com/natelasko528s-projects/wisconsin-hail-tracker/settings/environment-variables

2. Click **"Add Variable"**:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend-url.onrender.com` ← paste your Render URL
   - **Environments**: Check all three boxes

3. Click **"Save"**

4. Go to: https://vercel.com/natelasko528s-projects/wisconsin-hail-tracker

5. Click **"..."** menu on latest deployment → **"Redeploy"**

---

## ✅ Test It!

1. Go to: https://wisconsin-hail-tracker.vercel.app
2. Login with:
   - Email: `admin@example.com`
   - Password: `password123`

**If you can login and see the dashboard, YOU'RE DONE! 🎉**

---

## 🤖 Optional: Auto-Deploy on Git Push

Want the backend to auto-redeploy when you push code? (Already set up!)

Render automatically redeploys when you push to GitHub. That's it!

---

## 📋 What You Get (100% Free):

- ✅ Backend API running 24/7
- ✅ Automatic HTTPS
- ✅ 500 hours/month (more than enough)
- ✅ Auto-deploy on git push
- ✅ Health monitoring
- ✅ Logging dashboard
- ✅ Zero configuration database (in-memory)

---

## 🆙 Upgrade to PostgreSQL Later (Optional)

When you're ready for persistent data:

1. In Render Dashboard: **"New +"** → **"PostgreSQL"**
2. Copy the **Internal Database URL**
3. Update backend environment variables:
   ```
   DATABASE_URL=<your-database-url>
   USE_IN_MEMORY_DB=false
   ```
4. Run schema: Copy contents of `backend/database/schema.sql` into Render's SQL Shell

---

## 🆘 Troubleshooting

### Backend deployment failed?

Check logs in Render dashboard. Common fixes:
- Make sure Root Directory is set to `backend`
- Verify Start Command is `npm start`
- Check that all environment variables are set

### Frontend can't connect to backend?

1. Test backend directly: `curl https://your-backend-url.onrender.com/health`
2. Should return: `{"status":"ok"}`
3. If yes, check Vercel environment variable `NEXT_PUBLIC_API_URL`
4. Make sure to redeploy Vercel after adding the variable

### Login not working?

1. Open browser console (F12)
2. Look for errors
3. Common issue: `NEXT_PUBLIC_API_URL` not set or wrong
4. Another common issue: Vercel wasn't redeployed after adding environment variable

---

## 💡 Why Render?

- **100% Free** - No credit card, no trial, just free
- **Zero Configuration** - Works out of the box
- **Auto-Deploy** - Push code → Auto deploys
- **Built-in SSL** - Automatic HTTPS
- **Great for MVPs** - Perfect for your hail tracker

---

## 🎉 That's It!

Your backend is now:
- ✅ Deployed to production
- ✅ Running with HTTPS
- ✅ Auto-deploying on git push
- ✅ Connected to your frontend
- ✅ 100% free

**Total time: 2 minutes** ⏱️

---

## 📞 Need Help?

Open an issue in the repository or check:
- Backend logs: Render Dashboard → Logs tab
- Frontend logs: Vercel Dashboard → Deployments → View Function Logs
- API health: `curl https://your-backend-url.onrender.com/health`
