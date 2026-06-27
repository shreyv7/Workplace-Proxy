# Workplace Proxy — MCP Servers Testing & Configuration Guide

This guide walks you through setting up credentials, authenticating your accounts, and verifying the end-to-end multi-agent swarm flow with real-time Slack, Google Calendar, and Gmail integrations.

---

## Phase 1: Manual API Configuration

### 1. Google Cloud Console Setup (for Google Calendar & Gmail)
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., **"Workplace Proxy"**) or select an existing one.
3. Enable the following APIs:
   - **Google Calendar API**
   - **Gmail API**
4. Go to **APIs & Services → OAuth Consent Screen**:
   - Set **User Type** to **External**.
   - Fill out the required app registration details.
   - Under **Test Users**, add the Google email address you plan to authenticate. *(Critical: Google Cloud will block login attempts from unverified apps unless the user is explicitly listed here.)*
5. Go to **APIs & Services → Credentials → Create Credentials → OAuth Client ID**:
   - Set the application type to **Web application**.
   - Under **Authorized redirect URIs**, add exactly these redirect endpoints:
     - `http://localhost:3002/oauth2callback` (for Calendar)
     - `http://localhost:3001/oauth2callback` (for Gmail)
   - Click **Create** and copy your **Client ID** and **Client Secret**.

---

### 2. Slack App Console Setup
1. Go to [api.slack.com/apps](https://api.slack.com/apps) and click **Create New App** → choose **From Scratch**.
2. Name your app (e.g., **"Workplace Proxy"**) and select your workspace.
3. Under **OAuth & Permissions → Scopes → Bot Token Scopes**, add these permissions:
   - `channels:history` — Allows the Interceptor to read public channel logs
   - `channels:read` — Allows listing public channels
   - `users:read` — Allows resolving human sender names
4. Click **Install to Workspace** at the top of the page.
5. Copy the generated **Bot User OAuth Token** (starts with `xoxb-`).
6. Open your Slack desktop or web client, go to the channel you want to monitor (e.g., `#general`), and invite the bot:
   ```text
   /invite @Your_Slack_App_Name
   ```
7. Right-click the channel name in Slack, click **View channel details**, and copy the **Channel ID** (starts with `C...`).

---

## Phase 2: Start Services & Configure the UI

1. Open your terminal in the workspace root and start all services concurrently:
   ```bash
   npm run start:all
   ```
   *This commands automatically spins up the Dockerized backend services along with the local Slack, Email, and Google Calendar MCP servers.*

2. Navigate to [http://localhost:5173/integrations](http://localhost:5173/integrations) in your browser.
3. Configure the integrations using the credentials created in Phase 1:
   - **Slack:** Paste the `xoxb-...` bot token and the `C...` Channel ID. Click **Save Configuration**.
   - **Google Calendar:** Paste the Client ID and Client Secret. Click **Save**, then click **Authenticate Account** to complete Google OAuth consent.
   - **Email:** Paste the Client ID and Client Secret. Click **Save**, then click **Authenticate Account** to complete Google OAuth consent.

*(Once authorized, the status indicators on the Integrations page will turn green and show `connected`!)*

---

## Phase 3: Inbound Signal Testing & Event Sync

### 1. Test Ingestion & Agent Swarm Debate
1. Post an ambiguous or vague message in your monitored Slack channel, for example:
   ```text
   Hey, can you take a look at the deployment logs whenever you get a chance? No rush.
   ```
2. Navigate to the **Daily Clarity Briefing** dashboard homepage ([http://localhost:5173/](http://localhost:5173/)).
3. Within 20 seconds, the message will appear under your **Clarity Inbox** showing:
   - `translation_status: "processing"` with real-time logs indicating active agent swarm debate.
   - The finalized, structured neurodivergent-friendly task checklist.

### 2. Verify Google Calendar Sync
1. On the dashboard inbox card for the translated message, click **Acknowledge**.
2. Open your **Google Calendar** interface.
3. Verify that the task has been booked automatically in the suggested time slot!
