# Project Startup Guide

This guide provides instructions and the exact commands to set up and run all Workplace Proxy services on macOS/Linux and Windows.

The project consists of six services:

| Service | Port | Description |
|---|---|---|
| **Frontend** | 5173 | Vite + React web interface |
| **Orchestrator** | 8000 | Lyzr/ADK multi-agent debate server |
| **Memory Service** | 8001 | Qdrant-backed semantic search API (Role 3) |
| **Calendar MCP** | 3002 | Google Calendar API bridge |
| **Gmail MCP** | 3001 | Gmail API bridge |
| **Slack MCP** | 3000 | Slack API bridge + OAuth callback |

---

## Prerequisites

- Node.js 18+ (`node --version`)
- Python 3.11+ (`python --version`)
- A Google Cloud project with Gmail API and Calendar API enabled
- A Supabase project with Google OAuth configured
- (Optional) A Slack App for real Slack data

---

## ⚙️ Initial Setup (Run Once)

### 1. Environment files

```bash
# Root (frontend)
cp .env.example .env

# Backend (orchestrator + memory)
cp backend/.env.example backend/.env

# MCP servers
cp calendar-mcp-server/.env.example calendar-mcp-server/.env
cp gmail-mcp-server/.env.example gmail-mcp-server/.env
cp slack-mcp-server/.env.example slack-mcp-server/.env
```

### 2. Fill in credentials

**`backend/.env`** — required values:
```
GOOGLE_API_KEY=<your Gemini API key from aistudio.google.com>
LYZR_API_KEY=<your Lyzr API key from studio.lyzr.ai>
LYZR_ENABLED=true
```

**`calendar-mcp-server/.env`** — for real Calendar data (skip for demo mode):
```
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_ACCESS_TOKEN=<provider_token from Supabase session after Google OAuth>
```

**`gmail-mcp-server/.env`** — for real Gmail data (skip for demo mode):
```
GOOGLE_CLIENT_ID=<same as above>
GOOGLE_CLIENT_SECRET=<same as above>
GOOGLE_ACCESS_TOKEN=<needs gmail.readonly scope>
```

**`slack-mcp-server/.env`** — for real Slack data:
```
SLACK_CLIENT_ID=<from api.slack.com/apps>
SLACK_CLIENT_SECRET=<from api.slack.com/apps>
# OR if you already have a bot token:
SLACK_BOT_TOKEN=xoxb-...
```

All three MCP servers fall back to realistic demo data when credentials are not set.

### 3. Install dependencies

**macOS / Linux:**
```bash
# Frontend
npm install

# Python backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# MCP servers
cd calendar-mcp-server && npm install && cd ..
cd gmail-mcp-server    && npm install && cd ..
cd slack-mcp-server    && npm install && cd ..
```

**Windows (PowerShell):**
```powershell
npm install
cd backend; python -m venv venv; .\venv\Scripts\Activate.ps1; pip install -r requirements.txt; cd ..
cd calendar-mcp-server; npm install; cd ..
cd gmail-mcp-server;    npm install; cd ..
cd slack-mcp-server;    npm install; cd ..
```

**Windows (CMD):**
```cmd
npm install
cd backend && python -m venv venv && call venv\Scripts\activate && pip install -r requirements.txt && cd ..
cd calendar-mcp-server && npm install && cd ..
cd gmail-mcp-server    && npm install && cd ..
cd slack-mcp-server    && npm install && cd ..
```

---

## 🔐 Google OAuth Setup (Supabase)

Google sign-in and the Calendar/Gmail integrations all flow through Supabase. No `GOOGLE_CLIENT_ID` is needed in the frontend `.env`.

1. In the Supabase dashboard → **Authentication → Providers → Google**: paste your OAuth 2.0 Client ID and Client Secret.
2. Add these to the **Authorised redirect URIs** in Google Cloud Console:
   - `https://<your-supabase-project>.supabase.co/auth/v1/callback`
3. On the **Google Cloud Console → OAuth consent screen**, add these scopes:
   - `email`, `profile`, `openid` (for login)
   - `https://www.googleapis.com/auth/calendar.readonly` (for Calendar integration)
   - `https://www.googleapis.com/auth/gmail.readonly` (for Gmail integration)
4. In **Authorised JavaScript origins**, add `http://localhost:5173`.

After signing in, your Google `provider_token` is available as `session.provider_token`. Set this as `GOOGLE_ACCESS_TOKEN` in the MCP server `.env` files to enable real API calls from those servers.

---

## 💬 Slack App Setup

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and create a new app ("From scratch").
2. Under **OAuth & Permissions → Bot Token Scopes**, add:
   - `channels:history`
   - `channels:read`
   - `chat:write`
   - `users:read`
3. Under **OAuth & Permissions → Redirect URLs**, add:
   ```
   http://localhost:3000/oauth/callback
   ```
4. Under **Basic Information → App Credentials**, copy the **Client ID** and **Client Secret** into `slack-mcp-server/.env`.
5. After starting all services, go to **Integrations** in the app and click **Connect** next to Slack. This triggers the OAuth flow.

---

## ⚡ Method A: Unified Startup (Recommended)

Starts all six services concurrently with color-coded logs.

```bash
npm run start:all
```

Works on macOS, Linux, and Windows (PowerShell / CMD).

---

## 🔍 Method B: Individual Startup (For Debugging)

Run each service in a separate terminal.

### macOS / Linux

```bash
# Terminal 1 — Frontend (port 5173)
npm run dev

# Terminal 2 — Memory Service (port 8001)
cd backend && source venv/bin/activate
python -m uvicorn memory_service.main:app --host 0.0.0.0 --port 8001

# Terminal 3 — Orchestrator (port 8000)
cd backend && source venv/bin/activate
python -m uvicorn orchestrator.main:app --host 0.0.0.0 --port 8000

# Terminal 4 — Calendar MCP (port 3002)
cd calendar-mcp-server && npm start

# Terminal 5 — Gmail MCP (port 3001)
cd gmail-mcp-server && npm start

# Terminal 6 — Slack MCP (port 3000)
cd slack-mcp-server && npm start
```

### Windows (PowerShell)

```powershell
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Memory Service
cd backend; .\venv\Scripts\Activate.ps1; python -m uvicorn memory_service.main:app --host 0.0.0.0 --port 8001

# Terminal 3 — Orchestrator
cd backend; .\venv\Scripts\Activate.ps1; python -m uvicorn orchestrator.main:app --host 0.0.0.0 --port 8000

# Terminal 4 — Calendar MCP
cd calendar-mcp-server; npm start

# Terminal 5 — Gmail MCP
cd gmail-mcp-server; npm start

# Terminal 6 — Slack MCP
cd slack-mcp-server; npm start
```

### Windows (CMD)

```cmd
:: Terminal 1 — Frontend
npm run dev

:: Terminal 2 — Memory Service
cd backend && call venv\Scripts\activate && python -m uvicorn memory_service.main:app --host 0.0.0.0 --port 8001

:: Terminal 3 — Orchestrator
cd backend && call venv\Scripts\activate && python -m uvicorn orchestrator.main:app --host 0.0.0.0 --port 8000

:: Terminal 4 — Calendar MCP
cd calendar-mcp-server && npm start

:: Terminal 5 — Gmail MCP
cd gmail-mcp-server && npm start

:: Terminal 6 — Slack MCP
cd slack-mcp-server && npm start
```

---

## ✅ Health Check URLs

Once all services are running:

| Service | Health URL |
|---|---|
| Orchestrator | http://localhost:8000/health |
| Orchestrator API docs | http://localhost:8000/docs |
| Calendar MCP | http://localhost:3002/health |
| Gmail MCP | http://localhost:3001/health |
| Slack MCP | http://localhost:3000/health |
| Slack OAuth status | http://localhost:3000/oauth/status |

---

## 🎭 Demo Mode

Set `DEMO_MODE=true` in `backend/.env` to skip all LLM calls and return a deterministic demo response for the canonical test message. Useful for live demos without API cost.

All three MCP servers also have built-in demo mode: if credentials are not set, they return realistic mock data so the integration pipeline still runs end-to-end.

---

## 🗄️ Supabase Migration

Run the following SQL migrations in the Supabase dashboard → **SQL Editor** in order:

1. `supabase/migrations/001_user_profiles.sql` — User profiles table
2. `supabase/migrations/002_user_integrations.sql` — Integration connection status table

These only need to run once per Supabase project.
