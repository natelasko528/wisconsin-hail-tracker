# Wisconsin Hail Tracker - Comprehensive Improvement Plan

**Date:** January 9, 2026
**Status:** Ready for Implementation
**Priority:** HIGH - Production Blocking Issues Identified

---

## Executive Summary

The Wisconsin Hail Tracker is a well-architected proof-of-concept (~30-40% complete) that requires significant work to become production-ready. This plan addresses **15 critical issues** across security, data persistence, integrations, and user experience.

**Current State:**
- ✅ Clean architecture and modern tech stack
- ✅ Comprehensive feature design
- ✅ Beautiful brutalist UI
- ❌ No database (all data in memory)
- ❌ No authentication/authorization
- ❌ Mock data and integrations only
- ❌ Frontend test failures
- ❌ No deployment configuration

---

## Critical Issues (Production Blockers)

### 1. DATABASE IMPLEMENTATION
**Status:** 🔴 CRITICAL
**Impact:** Data loss on server restart
**Current:** In-memory JavaScript arrays (LEADS_DB, SAMPLE_HAIL_DATA)
**Required:** PostgreSQL with proper schema

**Action Items:**
- [ ] Create database schema (`schema.sql`)
  - Users table (id, email, password_hash, role, created_at)
  - Leads table (id, name, email, phone, property_address, property_value, hail_event_id, stage, score, tags, assigned_to, created_at, updated_at)
  - Lead_notes table (id, lead_id, text, author, created_at)
  - Hail_events table (id, date, county, location, lat, lng, hail_size, wind_speed, severity, damages_reported, injuries)
  - Campaigns table (id, name, type, status, leads, template, scheduled_for, sent_count, opened_count, clicked_count, bounced_count, created_at)
  - Skiptrace_results table (id, lead_id, phones, emails, property_owner, confidence, created_at)
  - Ghl_sync_logs table (id, lead_id, action, status, error, synced_at)

- [ ] Set up database migrations system (node-pg-migrate or similar)
- [ ] Create seed data script for development
- [ ] Replace in-memory data structures with PostgreSQL queries
- [ ] Add connection pooling (pg.Pool)
- [ ] Set up database backup strategy

**Files to Modify:**
- `backend/routes/leads.js` - Replace LEADS_DB with SQL queries
- `backend/routes/hail.js` - Replace SAMPLE_HAIL_DATA with SQL queries
- `backend/routes/campaigns.js` - Replace CAMPAIGNS_DB with SQL queries
- `backend/routes/skiptrace.js` - Store results in database
- `backend/routes/ghl.js` - Store sync logs in database

**Estimated Effort:** 16-20 hours

---

### 2. AUTHENTICATION & AUTHORIZATION
**Status:** 🔴 CRITICAL
**Impact:** Security vulnerability - all endpoints completely open
**Current:** No login system, bcryptjs/jsonwebtoken installed but unused
**Required:** Full user authentication with role-based access control

**Action Items:**
- [ ] Create user registration endpoint (`POST /api/auth/register`)
- [ ] Create login endpoint (`POST /api/auth/login`) with JWT token generation
- [ ] Create refresh token endpoint (`POST /api/auth/refresh`)
- [ ] Create logout endpoint (`POST /api/auth/logout`)
- [ ] Implement JWT middleware for protected routes
- [ ] Create role-based access control (RBAC) middleware
  - Roles: admin, manager, sales_rep, viewer
- [ ] Protect all API endpoints with auth middleware
- [ ] Add user context to requests (req.user)
- [ ] Implement password reset flow
- [ ] Add rate limiting to auth endpoints (express-rate-limit)

**Frontend Changes:**
- [ ] Create login page (`frontend/app/login/page.tsx`)
- [ ] Create registration page (`frontend/app/register/page.tsx`)
- [ ] Implement auth context/store (Zustand)
- [ ] Add token storage (localStorage/cookies)
- [ ] Add auth middleware to Next.js middleware
- [ ] Protect routes based on authentication
- [ ] Add user profile dropdown in header
- [ ] Implement auto-logout on token expiration

**Files to Create:**
- `backend/routes/auth.js`
- `backend/middleware/auth.js`
- `backend/middleware/rbac.js`
- `frontend/app/login/page.tsx`
- `frontend/app/register/page.tsx`
- `frontend/lib/auth.ts`
- `frontend/store/authStore.ts`

**Estimated Effort:** 20-24 hours

---

### 3. ENVIRONMENT CONFIGURATION
**Status:** 🔴 CRITICAL
**Impact:** Cannot deploy without extensive manual setup
**Current:** No .env files or templates
**Required:** Complete environment configuration system

**Action Items:**
- [ ] Create `.env.example` for backend with all required variables:
  ```
  # Server
  PORT=3001
  NODE_ENV=development
  FRONTEND_URL=http://localhost:3000

  # Database
  DATABASE_URL=postgresql://user:password@localhost:5432/wisconsin_hail_tracker

  # Authentication
  JWT_SECRET=your_jwt_secret_here
  JWT_EXPIRES_IN=7d
  REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
  REFRESH_TOKEN_EXPIRES_IN=30d

  # NOAA API
  NOAA_API_TOKEN=your_noaa_token_here

  # Skip Tracing (TLOxp or IDI)
  SKIPTRACE_API_KEY=your_skiptrace_api_key
  SKIPTRACE_API_URL=https://api.tloxp.com/v1

  # GoHighLevel
  GHL_API_KEY=your_ghl_api_key
  GHL_LOCATION_ID=your_ghl_location_id
  GHL_WEBHOOK_SECRET=your_webhook_secret

  # Email (SendGrid)
  SENDGRID_API_KEY=your_sendgrid_api_key
  FROM_EMAIL=noreply@wisconsinhailtracker.com

  # SMS (Twilio)
  TWILIO_ACCOUNT_SID=your_twilio_account_sid
  TWILIO_AUTH_TOKEN=your_twilio_auth_token
  TWILIO_PHONE_NUMBER=+1234567890

  # Redis (for job queue)
  REDIS_URL=redis://localhost:6379

  # Logging
  LOG_LEVEL=info
  ```

- [ ] Create `.env.example` for frontend:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:3001
  NEXT_PUBLIC_APP_NAME=Wisconsin Hail Tracker
  NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
  ```

- [ ] Create setup documentation (`ENVIRONMENT_SETUP.md`)
- [ ] Add environment validation on startup (envalid or joi)
- [ ] Document how to obtain each API key

**Files to Create:**
- `.env.example` (backend)
- `frontend/.env.example`
- `ENVIRONMENT_SETUP.md`
- `backend/config/validateEnv.js`

**Estimated Effort:** 4-6 hours

---

### 4. FRONTEND ERROR HANDLING & UX
**Status:** 🔴 CRITICAL
**Impact:** Poor user experience, silent failures
**Current:** Basic try/catch, no user feedback, TEST_RESULTS.md shows "Frontend: FAIL"
**Required:** Comprehensive error handling with user notifications

**Action Items:**
- [ ] Implement toast notification system (react-hot-toast already installed)
- [ ] Add loading states to all API calls
- [ ] Add error boundaries for React components
- [ ] Create unified API client with error handling
- [ ] Add retry logic for failed requests
- [ ] Display user-friendly error messages
- [ ] Add loading skeletons for data fetching
- [ ] Implement optimistic updates where appropriate
- [ ] Add form validation feedback
- [ ] Create error tracking (Sentry integration optional)

**Files to Modify:**
- `frontend/app/dashboard/page.tsx` - Add loading states and error handling
- `frontend/app/leads/page.tsx` - Add toast notifications
- `frontend/app/campaigns/page.tsx` - Add error boundaries
- `frontend/app/skiptrace/page.tsx` - Add loading states
- `frontend/app/ghl/page.tsx` - Add error handling

**Files to Create:**
- `frontend/lib/api.ts` - Unified API client with error handling
- `frontend/components/ErrorBoundary.tsx`
- `frontend/components/LoadingSkeleton.tsx`
- `frontend/lib/errorHandler.ts`

**Investigate TEST_RESULTS.md failure:**
- [ ] Run frontend tests and identify specific failures
- [ ] Fix TypeScript errors if any
- [ ] Fix build errors
- [ ] Update test configuration if needed

**Estimated Effort:** 12-16 hours

---

### 5. REAL NOAA API INTEGRATION
**Status:** 🔴 CRITICAL
**Impact:** App uses hardcoded data, not useful for real tracking
**Current:** 10 hardcoded hail events in `backend/routes/hail.js`
**Required:** Live NOAA Storm Events Database integration

**Action Items:**
- [ ] Research NOAA Storm Events Database API v2
  - Endpoint: https://www.ncdc.noaa.gov/stormevents/
  - Documentation: https://www.ncdc.noaa.gov/stormevents/ftp.jsp
- [ ] Obtain NOAA API token (if required)
- [ ] Create NOAA API service module (`backend/services/noaa.js`)
- [ ] Implement data fetching with filters:
  - Date range
  - State (Wisconsin)
  - Event type (Hail)
  - County
  - Severity
- [ ] Implement caching strategy (cache for 24 hours)
- [ ] Add background job to sync data daily
- [ ] Store fetched data in database
- [ ] Handle API rate limits
- [ ] Add fallback to cached data on API failure
- [ ] Create admin endpoint to manually trigger sync

**Files to Create:**
- `backend/services/noaa.js` - NOAA API integration
- `backend/jobs/syncHailData.js` - Background job for daily sync
- `backend/routes/admin.js` - Admin endpoints for manual sync

**Files to Modify:**
- `backend/routes/hail.js` - Query database instead of SAMPLE_HAIL_DATA
- `backend/server.js` - Schedule daily sync job

**API Research Required:**
- NOAA Storm Events Database API documentation
- Authentication requirements
- Rate limits
- Data format and schema
- Historical data availability

**Estimated Effort:** 16-20 hours

---

## High Priority Issues

### 6. VERCEL DEPLOYMENT CONFIGURATION
**Status:** 🟡 HIGH PRIORITY
**Impact:** Cannot deploy to production
**Current:** No deployment configuration
**Required:** Vercel-ready deployment setup

**Action Items:**
- [ ] Create `vercel.json` configuration
  ```json
  {
    "version": 2,
    "builds": [
      {
        "src": "backend/server.js",
        "use": "@vercel/node"
      },
      {
        "src": "frontend/package.json",
        "use": "@vercel/next"
      }
    ],
    "routes": [
      {
        "src": "/api/(.*)",
        "dest": "backend/server.js"
      },
      {
        "src": "/(.*)",
        "dest": "frontend/$1"
      }
    ],
    "env": {
      "NODE_ENV": "production"
    }
  }
  ```

- [ ] Configure environment variables in Vercel dashboard
- [ ] Set up PostgreSQL database (Vercel Postgres or external)
- [ ] Set up Redis instance (Upstash or external)
- [ ] Configure custom domain
- [ ] Set up preview deployments for branches
- [ ] Configure build settings
- [ ] Add deployment scripts to package.json
- [ ] Create DEPLOYMENT.md documentation

**Alternative: Separate Deployments**
- Backend: Railway, Render, or Fly.io
- Frontend: Vercel
- Database: Supabase, Neon, or Railway

**Files to Create:**
- `vercel.json`
- `DEPLOYMENT.md`
- `.vercelignore`

**Estimated Effort:** 8-10 hours

---

### 7. SKIP TRACING SERVICE INTEGRATION
**Status:** 🟡 HIGH PRIORITY
**Impact:** Feature doesn't work (returns mock data)
**Current:** Mock TLOxp data in `backend/routes/skiptrace.js`
**Required:** Real skip tracing service integration

**Action Items:**
- [ ] Choose skip tracing provider:
  - TLOxp (preferred, mentioned in code)
  - IDI Data
  - BatchSkipTracing
  - Melissa Data
- [ ] Obtain API credentials
- [ ] Create skip tracing service module (`backend/services/skiptrace.js`)
- [ ] Implement individual skip trace
- [ ] Implement batch skip tracing
- [ ] Store results in database
- [ ] Add cost tracking per skip trace
- [ ] Implement result caching (avoid duplicate lookups)
- [ ] Add error handling for failed lookups
- [ ] Create admin dashboard for skip trace usage/costs

**Files to Create:**
- `backend/services/skiptrace.js` - Skip tracing service
- `backend/routes/billing.js` - Track skip trace costs

**Files to Modify:**
- `backend/routes/skiptrace.js` - Replace mock data with real API calls

**Cost Considerations:**
- Skip tracing typically costs $0.10-$0.50 per lookup
- Implement credit system to prevent abuse
- Add usage limits per user/plan
- Track monthly costs

**Estimated Effort:** 12-16 hours

---

### 8. GOHIGHLEVEL OAUTH INTEGRATION
**Status:** 🟡 HIGH PRIORITY
**Impact:** Integration doesn't work (mock data)
**Current:** Simulated GHL in `backend/routes/ghl.js`
**Required:** Real GoHighLevel OAuth and API integration

**Action Items:**
- [ ] Set up GoHighLevel OAuth app
  - Get client ID and client secret
  - Configure redirect URIs
- [ ] Implement OAuth 2.0 flow
  - Authorization endpoint
  - Token exchange
  - Token refresh
- [ ] Store GHL tokens per user in database
- [ ] Create GHL API service module (`backend/services/ghl.js`)
- [ ] Implement contact sync (push to GHL)
- [ ] Implement contact import (pull from GHL)
- [ ] Set up webhook handling for GHL events
- [ ] Add webhook signature verification
- [ ] Implement two-way sync logic
- [ ] Add conflict resolution (last-write-wins or custom)
- [ ] Create GHL settings page in frontend

**Files to Create:**
- `backend/services/ghl.js` - GHL API integration
- `backend/routes/oauth.js` - OAuth flow endpoints
- `frontend/app/settings/ghl/page.tsx` - GHL settings page

**Files to Modify:**
- `backend/routes/ghl.js` - Replace mock with real API calls
- `frontend/app/ghl/page.tsx` - Add OAuth connection flow

**Estimated Effort:** 16-20 hours

---

### 9. EMAIL & SMS CAMPAIGNS (REAL SENDING)
**Status:** 🟡 HIGH PRIORITY
**Impact:** Campaign features don't actually send messages
**Current:** Campaign tracking exists but no real sending
**Required:** Email and SMS sending capabilities

**Action Items:**

**Email (SendGrid):**
- [ ] Set up SendGrid account and obtain API key
- [ ] Create email service module (`backend/services/email.js`)
- [ ] Implement email template system
- [ ] Add variable substitution ({{firstName}}, {{propertyAddress}}, etc.)
- [ ] Implement email queue (Bull + Redis)
- [ ] Add email tracking (opens, clicks) via SendGrid webhooks
- [ ] Handle bounces and unsubscribes
- [ ] Add email scheduling
- [ ] Implement drip campaigns
- [ ] Create email preview feature

**SMS (Twilio):**
- [ ] Set up Twilio account and obtain credentials
- [ ] Create SMS service module (`backend/services/sms.js`)
- [ ] Implement SMS template system
- [ ] Add SMS queue (Bull + Redis)
- [ ] Handle opt-outs (STOP messages)
- [ ] Add delivery tracking via Twilio webhooks
- [ ] Implement ringless voicemail (Slybroadcast or Twilio)
- [ ] Add SMS scheduling
- [ ] Track SMS costs

**Files to Create:**
- `backend/services/email.js` - Email sending service
- `backend/services/sms.js` - SMS sending service
- `backend/jobs/campaignProcessor.js` - Background job for campaigns
- `backend/services/templates.js` - Template rendering

**Files to Modify:**
- `backend/routes/campaigns.js` - Trigger real sending on launch

**Estimated Effort:** 20-24 hours

---

### 10. DATA VALIDATION & SANITIZATION
**Status:** 🟡 HIGH PRIORITY
**Impact:** Security vulnerability (injection attacks)
**Current:** joi and zod installed but not used
**Required:** Input validation on all endpoints

**Action Items:**

**Backend (joi):**
- [ ] Create validation schemas for all endpoints
- [ ] Add validation middleware
- [ ] Validate request body, query params, and route params
- [ ] Sanitize user input to prevent SQL injection
- [ ] Add schema files for each route

**Frontend (zod + react-hook-form):**
- [ ] Create form schemas with zod
- [ ] Add real-time validation feedback
- [ ] Implement field-level error messages
- [ ] Add form submission handling

**Files to Create:**
- `backend/validators/leadValidators.js`
- `backend/validators/campaignValidators.js`
- `backend/validators/authValidators.js`
- `backend/middleware/validate.js`
- `frontend/schemas/leadSchema.ts`
- `frontend/schemas/campaignSchema.ts`

**Files to Modify:**
- All backend route files - Add validation middleware
- All frontend pages with forms - Add react-hook-form + zod

**Estimated Effort:** 12-16 hours

---

## Medium Priority Issues

### 11. MAP VISUALIZATION
**Status:** 🟠 MEDIUM PRIORITY
**Impact:** Missing promised feature
**Current:** Leaflet/react-leaflet installed but not implemented
**Required:** Interactive map showing hail events

**Action Items:**
- [ ] Create map page (`frontend/app/map/page.tsx`)
- [ ] Implement Leaflet map with hail event markers
- [ ] Color-code markers by hail size/severity
- [ ] Add popups with event details
- [ ] Add filters (date range, county, severity)
- [ ] Add heatmap layer for hail concentration
- [ ] Add drawing tools to select areas
- [ ] Show leads on map (if address geocoded)
- [ ] Add clustering for dense areas
- [ ] Make map mobile-responsive

**Additional Requirements:**
- [ ] Geocode property addresses (use Mapbox or Google Geocoding API)
- [ ] Store lat/lng in database

**Files to Create:**
- `frontend/app/map/page.tsx`
- `frontend/components/HailMap.tsx`
- `frontend/lib/geocoding.ts`

**Estimated Effort:** 12-16 hours

---

### 12. TESTING SUITE
**Status:** 🟠 MEDIUM PRIORITY
**Impact:** No code quality assurance
**Current:** No tests exist
**Required:** Comprehensive testing

**Action Items:**

**Backend Tests (Jest + Supertest):**
- [ ] Set up Jest configuration
- [ ] Create test database
- [ ] Write API endpoint tests (happy path + error cases)
- [ ] Write service layer unit tests
- [ ] Write middleware tests
- [ ] Add test coverage reporting (Istanbul/nyc)
- [ ] Set up CI/CD to run tests

**Frontend Tests (Jest + React Testing Library):**
- [ ] Set up Jest + RTL configuration
- [ ] Write component tests
- [ ] Write integration tests
- [ ] Write form validation tests
- [ ] Add E2E tests (Playwright or Cypress)
- [ ] Fix existing test failures (TEST_RESULTS.md shows Frontend: FAIL)

**Files to Create:**
- `backend/tests/` directory with test files
- `frontend/__tests__/` directory with test files
- `jest.config.js` (backend and frontend)
- `.github/workflows/test.yml` - CI/CD pipeline

**Estimated Effort:** 24-32 hours

---

### 13. STATE MANAGEMENT & API CLIENT
**Status:** 🟠 MEDIUM PRIORITY
**Impact:** Difficult to maintain as app grows
**Current:** Local useState, Zustand/React Query installed but unused
**Required:** Centralized state management

**Action Items:**
- [ ] Implement Zustand store for global state
  - Auth state
  - User preferences
  - UI state (theme, sidebar, etc.)
- [ ] Implement React Query for server state
  - Automatic caching
  - Background refetching
  - Optimistic updates
  - Infinite scroll for lists
- [ ] Create unified API client (`frontend/lib/api.ts`)
- [ ] Add request/response interceptors
- [ ] Implement automatic token refresh
- [ ] Add offline support (optional)

**Files to Create:**
- `frontend/store/authStore.ts`
- `frontend/store/uiStore.ts`
- `frontend/lib/api.ts`
- `frontend/lib/queryClient.ts`
- `frontend/hooks/useLeads.ts`
- `frontend/hooks/useCampaigns.ts`
- `frontend/hooks/useHailData.ts`

**Files to Modify:**
- All frontend pages - Replace fetch with React Query
- `frontend/app/layout.tsx` - Add QueryClientProvider

**Estimated Effort:** 12-16 hours

---

### 14. LOGGING & MONITORING
**Status:** 🟠 MEDIUM PRIORITY
**Impact:** No production visibility
**Current:** Only console.log, Winston installed but not used
**Required:** Production-grade logging

**Action Items:**
- [ ] Configure Winston logger
  - Console transport for development
  - File transport for production
  - Error log file separate from info logs
- [ ] Add structured logging (JSON format)
- [ ] Log all API requests (morgan middleware)
- [ ] Log errors with stack traces
- [ ] Add correlation IDs to requests
- [ ] Set up log aggregation (optional: LogDNA, Datadog, or ELK stack)
- [ ] Create logging middleware
- [ ] Add performance logging

**Files to Create:**
- `backend/config/logger.js`
- `backend/middleware/requestLogger.js`

**Files to Modify:**
- `backend/server.js` - Add request logging middleware
- All route files - Replace console.log with logger

**Estimated Effort:** 8-10 hours

---

### 15. RATE LIMITING & SECURITY HEADERS
**Status:** 🟠 MEDIUM PRIORITY
**Impact:** Vulnerable to abuse and attacks
**Current:** No rate limiting or security headers
**Required:** Basic security hardening

**Action Items:**
- [ ] Add express-rate-limit middleware
  - General API: 100 requests per 15 minutes
  - Auth endpoints: 5 requests per 15 minutes
  - Skip trace: 10 requests per hour (costs money)
- [ ] Add helmet middleware for security headers
  - Content Security Policy
  - X-Frame-Options
  - X-Content-Type-Options
  - Referrer-Policy
- [ ] Add CORS configuration based on environment
- [ ] Add request size limits (express.json({ limit: '10mb' }))
- [ ] Add IP-based blocking for repeated failures
- [ ] Implement API key authentication for external integrations

**Files to Modify:**
- `backend/server.js` - Add rate limiting and helmet

**Estimated Effort:** 4-6 hours

---

## Low Priority Enhancements

### 16. UNUSED DEPENDENCIES CLEANUP
- Remove or implement: redis, bull, pdf-lib, xlsx (backend)
- Remove or implement: recharts (frontend - currently not used for charts)

### 17. LEAD SCORING REFINEMENT
- Implement real scoring algorithm (currently hardcoded 60-100 range)
- Factors: property value, hail severity, time since event, prior contact

### 18. EXPORT FUNCTIONALITY
- Export leads to CSV
- Export campaign reports to PDF
- Export hail data to CSV

### 19. NOTIFICATION SYSTEM
- In-app notifications
- Email notifications for important events
- Browser push notifications

### 20. MOBILE APP
- React Native app for field reps
- Offline-first architecture
- GPS check-in at properties

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Make app functional with persistent data and security

1. Database Implementation (Issues #1)
2. Authentication & Authorization (Issue #2)
3. Environment Configuration (Issue #3)
4. Frontend Error Handling (Issue #4)

**Deliverables:**
- ✅ PostgreSQL database with schema
- ✅ User login/registration
- ✅ Protected API endpoints
- ✅ Proper error handling and UX

---

### Phase 2: Core Integrations (Weeks 3-4)
**Goal:** Connect to real external services

5. NOAA API Integration (Issue #5)
6. Skip Tracing Service (Issue #7)
7. Data Validation (Issue #10)

**Deliverables:**
- ✅ Live hail data from NOAA
- ✅ Real skip tracing
- ✅ Input validation and sanitization

---

### Phase 3: Marketing & CRM (Weeks 5-6)
**Goal:** Enable marketing automation

8. GoHighLevel Integration (Issue #8)
9. Email & SMS Campaigns (Issue #9)
10. Map Visualization (Issue #11)

**Deliverables:**
- ✅ Two-way GHL sync
- ✅ Email/SMS sending
- ✅ Interactive hail map

---

### Phase 4: Production Readiness (Weeks 7-8)
**Goal:** Deploy to production

11. Vercel Deployment (Issue #6)
12. Testing Suite (Issue #12)
13. Logging & Monitoring (Issue #14)
14. Rate Limiting & Security (Issue #15)
15. State Management (Issue #13)

**Deliverables:**
- ✅ Live production deployment
- ✅ Test coverage >70%
- ✅ Production monitoring
- ✅ Security hardening

---

## Quick Wins (Can Implement Immediately)

### 1. Environment Configuration Files
**Time:** 30 minutes
Create `.env.example` files to document required variables.

### 2. Toast Notifications
**Time:** 1 hour
Implement react-hot-toast for user feedback (already installed).

### 3. Loading States
**Time:** 2 hours
Add loading skeletons to all pages.

### 4. Security Headers
**Time:** 30 minutes
Add helmet middleware for basic security.

### 5. Rate Limiting
**Time:** 1 hour
Add express-rate-limit to protect endpoints.

---

## Success Metrics

### Technical Metrics
- ✅ All API endpoints protected with authentication
- ✅ Database persistence (no data loss on restart)
- ✅ Test coverage >70%
- ✅ Frontend build passes (Frontend: PASS)
- ✅ <2s page load time
- ✅ Zero security vulnerabilities (npm audit)

### Business Metrics
- ✅ Successfully sync contacts to GoHighLevel
- ✅ Send email/SMS campaigns
- ✅ Skip trace leads with real results
- ✅ Track hail events from NOAA in real-time
- ✅ Manage lead pipeline from new to closed

---

## Cost Estimates

### Development Time
- **Phase 1:** 160-200 hours (4-5 weeks @ 40 hrs/week)
- **Phase 2:** 120-160 hours (3-4 weeks)
- **Phase 3:** 120-160 hours (3-4 weeks)
- **Phase 4:** 140-180 hours (3.5-4.5 weeks)
- **Total:** 540-700 hours (13.5-17.5 weeks)

### Monthly Operational Costs
- **Database:** $20-50/month (Neon, Supabase, or Railway)
- **Hosting:** $20-50/month (Vercel Pro + backend)
- **Email:** $15-50/month (SendGrid - based on volume)
- **SMS:** Variable ($0.0079/message via Twilio)
- **Skip Tracing:** Variable ($0.15-0.50 per lookup)
- **Redis:** $10-20/month (Upstash)
- **Total:** ~$100-200/month + usage-based costs

---

## Next Steps

1. **Review & Prioritize:** Review this plan and adjust priorities
2. **Set Up Infrastructure:** Create database, get API keys
3. **Start Phase 1:** Begin with database implementation
4. **Weekly Check-ins:** Track progress and adjust plan
5. **Iterate:** Deploy incremental improvements

---

## Contact & Resources

**Documentation:**
- NOAA Storm Events: https://www.ncdc.noaa.gov/stormevents/
- GoHighLevel API: https://highlevel.stoplight.io/
- SendGrid API: https://docs.sendgrid.com/
- Twilio API: https://www.twilio.com/docs

**Questions or Issues:**
- Create GitHub issues for specific bugs
- Use project documentation for setup help

---

**Generated:** January 9, 2026
**Last Updated:** January 9, 2026
**Version:** 1.0
