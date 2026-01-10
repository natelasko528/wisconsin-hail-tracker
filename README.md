# Wisconsin Hail Tracker CRM

A full-stack application for tracking hail storms and generating leads for roofing contractors in Wisconsin. Built with **Next.js 14**, **Express.js**, and **Supabase**.

## 🌩️ Features

### Data Layer
- **NOAA Storm Events Database** integration (2023-2026)
- Property parcel data integration
- Homeowner contact records
- Skip tracing API connections
- Geographic hail event mapping

### Lead Management
- Lead capture from hail maps
- Lead scoring algorithm (severity + property value)
- Pipeline stages: New → Contacted → Inspection Scheduled → Contract Signed
- Activity timeline per lead
- Notes and tagging system

### Marketing Automation
- Email campaign management
- SMS campaign support
- Campaign performance tracking
- Scheduled campaign launches

### GoHighLevel Integration
- Two-way contact sync
- Workflow triggers from hail events
- Automated campaign enrollment

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | Express.js, Node.js |
| Database | Supabase (PostgreSQL) |
| Design | Brutalist UI, Oxanium + Source Code Pro fonts |

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/natelasko528/wisconsin-hail-tracker.git
cd wisconsin-hail-tracker

# Install all dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Environment Setup

Create environment files with your Supabase credentials:

**Backend** (`backend/.env`):
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://hekxyqhylzczirrbpldx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://hekxyqhylzczirrbpldx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Running the Application

```bash
# From the root directory, start both servers
npm run dev

# Or start them separately:
# Terminal 1: Backend (port 3001)
cd backend && npm run dev

# Terminal 2: Frontend (port 3000)
cd frontend && npm run dev
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🗄️ Database Schema

### Core Tables (Supabase)

| Table | Description |
|-------|-------------|
| `storm_events` | NOAA hail event data |
| `properties` | Property parcel information |
| `leads` | Lead management with pipeline stages |
| `notes` | Lead notes and activity |
| `campaigns` | Marketing campaigns |
| `campaign_leads` | Campaign-lead associations |
| `skip_trace_results` | Skip tracing results |
| `ghl_sync_log` | GoHighLevel sync history |
| `activity_log` | System activity tracking |

## 📡 API Endpoints

### Hail Events
- `GET /api/hail` - List hail events with filters
- `GET /api/hail/stats` - Hail event statistics
- `GET /api/hail/counties` - List affected counties
- `GET /api/hail/:id` - Get specific event
- `POST /api/hail` - Create new event

### Leads
- `GET /api/leads` - List leads with filters
- `GET /api/leads/stats` - Lead statistics
- `GET /api/leads/:id` - Get lead details
- `POST /api/leads` - Create new lead
- `PATCH /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `POST /api/leads/:id/notes` - Add note to lead

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `POST /api/campaigns/:id/launch` - Launch campaign
- `POST /api/campaigns/:id/pause` - Pause campaign

### Skip Tracing
- `POST /api/skiptrace` - Run skip trace
- `POST /api/skiptrace/batch` - Batch skip trace
- `GET /api/skiptrace/batch/:id` - Get batch status

### GoHighLevel
- `POST /api/ghl/sync/contact` - Sync contact to GHL
- `POST /api/ghl/sync/batch` - Batch sync
- `GET /api/ghl/sync/logs` - View sync logs
- `GET /api/ghl/status` - Integration status

### Dashboard
- `GET /api/stats/dashboard` - Dashboard statistics
- `GET /api/stats/activity` - Activity feed

## 🎨 Design System

- **Border Radius**: 0px (sharp edges)
- **Primary Color**: Crimson (#B71C1C)
- **Accent Color**: Steel Blue (#4682B4)
- **Typography**: Oxanium (headings), Source Code Pro (body)
- **Touch Targets**: 44px+ for mobile

## 🔧 Configuration

### Supabase Project
- **Project ID**: `hekxyqhylzczirrbpldx`
- **Region**: us-east-1
- **Database**: PostgreSQL 17

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public anonymous key |
| `GHL_API_KEY` | GoHighLevel API key (optional) |
| `GHL_LOCATION_ID` | GHL location ID (optional) |

## 📁 Project Structure

```
wisconsin-hail-tracker/
├── backend/
│   ├── config/           # Configuration files
│   ├── lib/              # Supabase client
│   ├── middleware/       # Express middleware
│   ├── migrations/       # Database migrations
│   ├── routes/           # API routes
│   └── server.js         # Express server
├── frontend/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   └── styles/           # CSS styles
└── README.md
```

## 🚀 Deployment

### Vercel (Frontend)
```bash
cd frontend
vercel deploy
```

### Railway/Render (Backend)
Deploy the `/backend` directory with the following settings:
- Build Command: `npm install`
- Start Command: `npm start`
- Environment variables as specified above

## 📄 License

MIT License - see LICENSE for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with ❤️ for Wisconsin roofing contractors
