# 🧠 Workplace Proxy: Autonomous Cognitive OS

### 🏆 Hackathon Project by Team **Proceed Anyway**
**Team Members:** Shrey Vashistha, Devansh Tyagi, Anvi Sharma  
**Target Evaluation Date:** June 28, 2026

---

## 🌟 Executive Summary & Vision

**Workplace Proxy** transforms AI from a passive content generator into an active, protective, and highly personalized **Cognitive Operating System**. 

Designed specifically for neurodivergent professionals (ADHD, Autism, AuDHD) and individuals facing high cognitive fatigue, the platform acts as an intelligent **"Communication Buffer"** and workflow optimization layer. By sitting securely between an employee and the chaotic corporate digital ecosystem (Slack, Gmail, Google Calendar), Workplace Proxy intercepts incoming communication signals, strip-mines them of ambiguity, coordinates execution windows, and delivers structured, actionable clarity.

---

## 🚀 Key Features

*   **🔍 Dynamic Message Interception & Vagueness Translation:** Intercepts raw, unstructured communication (via Slack/Email). The agent swarm decodes "corporate speak" and vague requests (e.g., *"Can you look at this whenever?"*) into concrete deliverables based on historical context.
*   **🧩 Cognitive Preference Tailoring:** REST-restructured task cards format messages according to the user's selected profile (e.g., bullet points for ADHD, kanban/checklists for AuDHD, explicit action items for Autism).
*   **📅 Chronobiological Scheduling & Bandwidth Tracking:** Evaluates calendar availability and coordinates tasks based on the user's "Peak Focus Time" (Morning/Evening) and current cognitive saturation, suggesting optimal slots for a one-click lock-in.
*   **🛡️ Autonomous Boundary Deflection:** Proactively drafts context-aware boundary responses when working hours or bandwidth limits are violated (e.g., *"Acknowledged. I have blocked time to address this on Thursday"*).
*   **🌅 The Daily "Clarity" Briefing Dashboard:** A morning-facing workspace that synthesizes overnight noise into a single, prioritized chronological agenda.
*   **🔄 Continuous Calibration Engine:** Interactive feedback sliders (1–5 precision scores) let users rate translation accuracy, updating the twin agent's Qdrant embeddings to improve personalization over time.

---

## 🏗️ System Architecture & Data Flow

Workplace Proxy uses a **Multi-Agent Consensus Debate** architecture to achieve zero hallucination and high temporal alignment:

```
[Incoming Signal: Slack/Email] 
              │
              ▼
  ┌───────────────────────┐
  │ Agent 1: Interceptor  │ (Reads data stream via MCP)
  └───────────┬───────────┘
              │
              ▼
  ┌───────────────────────┐       ┌────────────────────────────┐
  │ Agent 2: Contextual   │ ◄───► │ Qdrant Vector Memory Layer │
  └───────────┬───────────┘       └────────────────────────────┘
              │ (Queries User Profile & Jargon History)
              ▼
  ┌───────────────────────┐       ┌────────────────────────────┐
  │ Agent 3: Scheduler    │ ◄───► │ Live Calendar State (MCP)  │
  └───────────┬───────────┘       └────────────────────────────┘
              │ (Evaluates Cognitive Load & Focus Slots)
              ▼
  ┌───────────────────────┐
  │ Agent 4: Twin Proxy   │ (Restructures syntax & formatting rules)
  └───────────┬───────────┘
              │
              ▼
  ┌───────────────────────┐
  │  Multi-Agent Debate   │ (Consensus engine negotiates final timeline)
  └───────────┬───────────┘
              │
              ▼
[Clean Payload to React Dashboard]
```

---

## 🛠️ The Tech Stack

### Frontend Client
*   **Framework:** React (TanStack Start)
*   **Styling:** Vanilla CSS, TailwindCSS, custom low-overhead pastel variants
*   **Visualizations:** WebGL Strands animation (`ogl` library)
*   **Deployment:** Vercel

### Backend Services
*   **APIs & Orchestration:** Python FastAPI
*   **Agent Orchestration:** Lyzr ADK & Google Gemini API (`gemini-flash-latest`)
*   **Vector Database:** Qdrant Cloud (Google Gemini `gemini-embedding-2` embeddings)
*   **Database & Auth:** Supabase (PostgreSQL with RLS)
*   **Integrations:** Dockerized Model Context Protocol (MCP) servers (Slack, Google Calendar, Gmail)
*   **Deployment:** Render (using a unified `render.yaml` infrastructure-as-code blueprint)

---

## 📦 Repository Structure

```
├── backend/                  # Python FastAPI services
│   ├── memory_service/       # Vector storage operations and embeddings logic
│   └── orchestrator/         # Main multi-agent execution & api router
├── calendar-mcp-server/      # Node.js Google Calendar MCP server
├── gmail-mcp-server/         # Node.js Gmail MCP server
├── MCP/                      # Additional MCP servers (Slack, shared configs)
├── personalisation/          # Onboarding, user authentication, and context hooks
├── src/                      # React application source code
│   └── routes/               # TanStack router tree
├── render.yaml               # Render Cloud Blueprint configurations
└── package.json              # Client dependencies and scripts
```

---

## 🚀 Local Setup & Development

### 1. Prerequisite Configuration
Ensure you have Node.js (v20+), Python (v3.11+), and Docker installed.

### 2. Configure Qdrant Cloud & Google Gemini
Copy the backend environment templates and populate your API credentials:
```bash
cp backend/.env.example backend/.env
```
Ensure your `backend/.env` has:
*   `GOOGLE_API_KEY`: Your Gemini API developer key.
*   `QDRANT_URL` & `QDRANT_API_KEY`: Your cloud endpoint and authorization token.

### 3. Install & Start Services
You can spin up the entire application locally using Docker:
```bash
docker-compose up --build
```
Alternatively, to run the client and backend individually for live reload:
```bash
# Start backend server
cd backend && pip install -r requirements.txt
python -m uvicorn orchestrator.main:app --host 0.0.0.0 --port 8000

# Start frontend client
npm install
npm run dev
```

---

## 🛡️ Hackathon Production Deployment

*   **Production Frontend:** [workplace-proxy.vercel.app](https://workplace-proxy.vercel.app)
*   **API & MCP services:** Hosted on **Render** (via automated `render.yaml` syncing).
*   **Vector Engine:** Hosted on **Qdrant Cloud**.
