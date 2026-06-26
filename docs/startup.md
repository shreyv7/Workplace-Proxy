# Project Startup Guide

This guide provides instructions and the exact commands to set up and run all Workplace Proxy services on macOS/Linux and Windows.

The project consists of four main services:
1. **Frontend**: Vite web interface running on port `5173`.
2. **Orchestrator**: Lyzr/ADK multi-agent debate server running on port `8000`.
3. **Memory Service**: Qdrant-backed semantic search API running on port `8001`.
4. **Calendar MCP**: Model Context Protocol calendar integration server running on port `3002`.

---

## ⚙️ Initial Setup (Run Once)

Before starting the services, ensure dependencies and environment configurations are initialized.

### macOS & Linux Setup
```bash
# 1. Install frontend dependencies and copy configuration
npm install
cp .env.example .env

# 2. Set up Python virtual environment and dependencies
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
cd ..

# 3. Install Calendar MCP dependencies
cd calendar-mcp-server
npm install
cd ..
```

### Windows Setup
For Windows setup, run the following in **PowerShell** or **Command Prompt**:

#### Using PowerShell:
```powershell
# 1. Install frontend dependencies and copy configuration
npm install
Copy-Item .env.example .env

# 2. Set up Python virtual environment and dependencies
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
cd ..

# 3. Install Calendar MCP dependencies
cd calendar-mcp-server
npm install
cd ..
```

#### Using Command Prompt (CMD):
```cmd
:: 1. Install frontend dependencies and copy configuration
npm install
copy .env.example .env

:: 2. Set up Python virtual environment and dependencies
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
cd ..

:: 3. Install Calendar MCP dependencies
cd calendar-mcp-server
npm install
cd ..
```

---

## ⚡ Method A: Unified Startup (Recommended)

This method runs all four services concurrently in a single terminal shell using the workspace process manager.

### macOS / Linux
```bash
npm run start:all
```

### Windows (PowerShell or Command Prompt)
```cmd
npm run start:all
```

---

## 🔍 Method B: Individual Startup (For Debugging)

To run, monitor, or debug each service individually, execute these commands in separate terminal sessions.

### macOS & Linux

#### 1. Frontend Web App (Port 5173)
```bash
npm run dev
```

#### 2. Memory Service (Port 8001)
```bash
cd backend
source venv/bin/activate
python -m uvicorn memory_service.main:app --host 0.0.0.0 --port 8001
```

#### 3. Orchestrator Service (Port 8000)
```bash
cd backend
source venv/bin/activate
python -m uvicorn orchestrator.main:app --host 0.0.0.0 --port 8000
```

#### 4. Calendar MCP Server (Port 3002)
```bash
cd calendar-mcp-server
npm start
```

---

### Windows (PowerShell)

#### 1. Frontend Web App (Port 5173)
```powershell
npm run dev
```

#### 2. Memory Service (Port 8001)
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn memory_service.main:app --host 0.0.0.0 --port 8001
```

#### 3. Orchestrator Service (Port 8000)
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn orchestrator.main:app --host 0.0.0.0 --port 8000
```

#### 4. Calendar MCP Server (Port 3002)
```powershell
cd calendar-mcp-server
npm start
```

---

### Windows (Command Prompt / CMD)

#### 1. Frontend Web App (Port 5173)
```cmd
npm run dev
```

#### 2. Memory Service (Port 8001)
```cmd
cd backend
call venv\Scripts\activate
python -m uvicorn memory_service.main:app --host 0.0.0.0 --port 8001
```

#### 3. Orchestrator Service (Port 8000)
```cmd
cd backend
call venv\Scripts\activate
python -m uvicorn orchestrator.main:app --host 0.0.0.0 --port 8000
```

#### 4. Calendar MCP Server (Port 3002)
```cmd
cd calendar-mcp-server
npm start
```
