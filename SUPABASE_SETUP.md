# Supabase Setup Guide

## Quick Setup (5 minutes)

### 1. Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Create a new organization (free)

### 2. Create Project

1. Click "New Project"
2. Project name: `wisconsin-hail-tracker`
3. Database password: **Save this securely!**
4. Region: Choose closest to your users (e.g., `US East (N. Virginia)`)
5. Plan: **Free** (500MB database, 50,000 monthly active users)
6. Click "Create new project" (takes ~2 minutes)

### 3. Get Connection String

1. In your project dashboard, go to **Settings** → **Database**
2. Scroll to **Connection string**
3. Select **URI** tab
4. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your database password

### 4. Run Schema

#### Option A: Supabase SQL Editor (Recommended)

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the entire contents of `backend/database/schema.sql`
4. Paste into the editor
5. Click **Run** (bottom right)
6. ✅ Success! You should see "Success. No rows returned"

7. Create another new query
8. Copy the entire contents of `backend/database/seed.sql`
9. Paste and **Run**
10. ✅ Success! Sample data loaded

#### Option B: Command Line

```bash
# Install psql if you don't have it
# Mac: brew install postgresql
# Ubuntu: sudo apt install postgresql-client
# Windows: Download from postgresql.org

# Run schema
psql "YOUR_SUPABASE_CONNECTION_STRING" < backend/database/schema.sql

# Run seed data
psql "YOUR_SUPABASE_CONNECTION_STRING" < backend/database/seed.sql
```

### 5. Configure Backend

1. Create `backend/.env` file:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Edit `backend/.env` and add your Supabase connection string:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres

   # Generate secure random strings for these:
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   REFRESH_TOKEN_SECRET=your-super-secret-refresh-key-min-32-chars
   ```

3. Generate secure secrets (run in terminal):
   ```bash
   # Mac/Linux
   openssl rand -base64 32

   # Or use Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

### 6. Configure Frontend

1. Create `frontend/.env.local`:
   ```bash
   cp frontend/.env.example frontend/.env.local
   ```

2. Edit `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

### 7. Test Database Connection

```bash
# Start backend
cd backend
npm install
npm run dev

# Should see: "✓ Database connected"
```

### 8. Start Frontend

```bash
# In new terminal
cd frontend
npm install
npm run dev

# Open http://localhost:3000
```

---

## Database Dashboard

### View Data in Supabase

1. Go to **Table Editor** in Supabase dashboard
2. You'll see all your tables:
   - `users` - User accounts
   - `leads` - CRM leads
   - `hail_events` - Hail storm data
   - `campaigns` - Marketing campaigns
   - `skiptrace_results` - Skip trace data
   - And more...

3. Click any table to view/edit data

### Query Data

1. Go to **SQL Editor**
2. Try queries:
   ```sql
   -- View all users
   SELECT * FROM users;

   -- View all leads
   SELECT * FROM leads;

   -- Count leads by stage
   SELECT stage, COUNT(*)
   FROM leads
   GROUP BY stage;
   ```

---

## Default Login Credentials

After running `seed.sql`, you can login with:

**Admin Account:**
- Email: `admin@example.com`
- Password: `password123`

**Manager Account:**
- Email: `manager@example.com`
- Password: `password123`

**Sales Rep Account:**
- Email: `sales@example.com`
- Password: `password123`

**⚠️ IMPORTANT:** Change these passwords immediately in production!

---

## Supabase Free Tier Limits

✅ **Included Free:**
- 500 MB database storage
- 1 GB file storage
- 2 GB bandwidth
- 50,000 monthly active users
- 500,000 Edge Function invocations
- 2 million Edge Function execution time (ms)
- Automatic backups (7 days retention)
- SSL connections

⚠️ **Limits:**
- Database paused after 7 days of inactivity (auto-resumes on connection)
- 2 concurrent connections max

💡 **Upgrade to Pro ($25/month):**
- 8 GB database storage
- 100 GB file storage
- 50 GB bandwidth
- No pausing
- Daily backups (30 days retention)

---

## Production Deployment

### Environment Variables for Vercel

When deploying to Vercel, add these environment variables:

1. Go to your Vercel project
2. Settings → Environment Variables
3. Add:
   ```
   DATABASE_URL=your-supabase-connection-string
   JWT_SECRET=your-jwt-secret
   REFRESH_TOKEN_SECRET=your-refresh-secret
   ```

### Security Best Practices

1. **Enable Row Level Security (RLS):**
   - Supabase dashboard → Authentication → Policies
   - Create policies to restrict data access

2. **Use Service Role Key Only in Backend:**
   - Never expose service role key in frontend
   - Use anon key for frontend if using Supabase client directly

3. **Enable Database Backups:**
   - Automatic on Supabase (7 days free tier)
   - Download manual backups: Database → Backups

4. **Monitor Usage:**
   - Settings → Usage
   - Set up billing alerts

---

## Troubleshooting

### Connection Failed

1. **Check password:** Ensure you replaced `[YOUR-PASSWORD]` correctly
2. **Check firewall:** Supabase requires port 5432 open
3. **Check region:** Connection string includes correct region
4. **Check SSL:** Supabase requires SSL (automatically handled by our config)

### Schema Errors

1. **Already exists:** Drop tables first:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```
2. **Permission denied:** Use the `postgres` user (default in connection string)

### Cannot Login

1. **Check seed data ran:** Query `SELECT * FROM users;` in SQL Editor
2. **Check password hash:** Should start with `$2a$`
3. **Clear browser cache:** Logout, clear localStorage
4. **Check JWT secret:** Must be set in backend `.env`

---

## Supabase vs. Other Options

| Feature | Supabase (Free) | Neon (Free) | Railway (Trial) |
|---------|-----------------|-------------|-----------------|
| Storage | 500 MB | 3 GB | 500 MB |
| Bandwidth | 2 GB | Unlimited | 100 GB |
| Price | Free forever | Free forever | $5/month after trial |
| Backups | 7 days | 7 days | No auto backups |
| Dashboard | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Speed | Fast | Very fast | Fast |

**Recommendation:** Start with Supabase free tier. Upgrade to Pro ($25/month) when you hit limits.

---

## Support

- **Supabase Docs:** https://supabase.com/docs
- **Discord:** https://discord.supabase.com
- **Status:** https://status.supabase.com

---

## Quick Reference

```bash
# Connection string format
postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres

# Test connection
psql "CONNECTION_STRING" -c "SELECT NOW();"

# Run schema
psql "CONNECTION_STRING" < backend/database/schema.sql

# Run seed data
psql "CONNECTION_STRING" < backend/database/seed.sql

# Connect with psql
psql "CONNECTION_STRING"
```

---

## Next Steps

1. ✅ Database created and schema loaded
2. → Configure API keys in the app (see Settings page after login)
3. → Get Gemini API key (see GEMINI_SETUP.md)
4. → Deploy to production (see DEPLOYMENT.md)

---

**Estimated Setup Time:** 5-10 minutes
**Cost:** $0 (free tier)
**Difficulty:** ⭐⭐ (Easy)
