const { spawn, execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

<<<<<<< HEAD
// ── Docker detection ──────────────────────────────────────────────────────────
// Use `docker info` (fast, no side-effects) to detect whether the Docker daemon
// is reachable before attempting `docker compose up -d`.
// This avoids a 10-second hang + wall of errors when Docker Desktop is stopped.

let dockerAvailable = false;
try {
  execSync('docker info', { stdio: 'ignore', timeout: 5000 });
  dockerAvailable = true;
} catch (_) {}

let dockerComposeSuccess = false;

if (dockerAvailable) {
  console.log('\x1b[36m[System] Docker detected — starting containerised backend stack...\x1b[0m');
  try {
    execSync('docker compose up -d', { stdio: 'inherit', cwd: __dirname });
    dockerComposeSuccess = true;
  } catch (e) {
    console.log('\x1b[31m[System] Warning: docker compose up failed. Falling back to local Python services.\x1b[0m');
  }
} else {
  console.log('\x1b[33m[System] Docker not running — local services mode (no Docker required).\x1b[0m');
=======
let dockerComposeSuccess = true;
// Ensure the dockerized backend stack is running before starting the frontend
console.log('\x1b[36m[System] Ensuring Dockerized Backend Services are up and running...\x1b[0m');
try {
  execSync('docker compose up -d', { stdio: 'inherit', cwd: __dirname });
} catch (e) {
  console.log('\x1b[31m[System] Warning: Failed to spin up backend containers. Continuing...\x1b[0m');
  dockerComposeSuccess = false;
>>>>>>> 026f1cc27eb0b42b049d2b7c85a299f6a4fcc6f4
}

// ── Service definitions ───────────────────────────────────────────────────────
// optional: true  → failure is logged but does NOT shut down other services.
// optional: false → failure is treated as fatal and triggers a full shutdown.
//
// Only the Frontend is truly fatal; MCP servers are optional — the app degrades
// gracefully when individual integrations are unavailable.

const services = [
  {
    name: 'Frontend',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: __dirname,
    color: '\x1b[36m', // Cyan
    optional: false,
  },
  {
    name: 'SlackMCP',
    command: 'node',
    args: ['index.cjs'],
    cwd: path.join(__dirname, 'MCP', 'slack'),
    color: '\x1b[33m', // Yellow
    optional: true,
  },
  {
    name: 'GmailMCP',
    command: 'npm',
    args: ['start'],
    cwd: path.join(__dirname, 'gmail-mcp-server'),
    color: '\x1b[34m', // Blue
    optional: true,
  },
  {
    name: 'WhatsAppMCP',
    command: 'node',
<<<<<<< HEAD
    args: ['index.js'],
    cwd: path.join(__dirname, 'MCP', 'google-calendar'),
    color: '\x1b[38;5;208m', // Orange
    optional: true,
  },
];

// ── Local Python backend (when Docker is not managing it) ─────────────────────
// Adds the FastAPI orchestrator (port 8000) and memory service (port 8001).
// Required for /api/v1/test-gcp and the full /api/v1/process pipeline.

if (!dockerComposeSuccess) {
  console.log('\x1b[33m[System] Appending local Python backend services (Orchestrator & MemoryService)...\x1b[0m');

  const isWin = process.platform === 'win32';
  const python = isWin
    ? path.join(__dirname, 'backend', 'venv', 'Scripts', 'python.exe')
    : path.join(__dirname, 'backend', 'venv', 'bin', 'python');

  if (!fs.existsSync(python)) {
    console.log('\x1b[31m[System] Python venv not found at ' + python + '.\x1b[0m');
    console.log('\x1b[31m[System] Run: cd backend && python -m venv venv && venv/Scripts/pip install -r requirements.txt\x1b[0m');
  }

  services.push(
    {
      name: 'MemoryService',
      command: python,
      args: ['-m', 'uvicorn', 'memory_service.main:app', '--host', '0.0.0.0', '--port', '8001'],
      cwd: path.join(__dirname, 'backend'),
      color: '\x1b[35m', // Magenta
      optional: true,
    },
    {
      name: 'Orchestrator',
      command: python,
      args: ['-m', 'uvicorn', 'orchestrator.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'],
      cwd: path.join(__dirname, 'backend'),
      color: '\x1b[32m', // Green
      optional: true,
    },
  );
}

// ── Process management ────────────────────────────────────────────────────────

=======
    args: ['index.cjs'],
    cwd: path.join(__dirname, 'MCP', 'whatsapp'),
    color: '\x1b[32m', // Green
  },
];

let ngrokAvailable = false;
try {
  execSync('which ngrok');
  ngrokAvailable = true;
} catch (e) {
  console.log('\x1b[33m[System] Warning: ngrok is not installed in the path. Exposing webhooks for WhatsApp Business locally will require a manual tunnel pointing to port 3003.\x1b[0m');
}

if (ngrokAvailable) {
  services.push({
    name: 'NgrokTunnel',
    command: 'ngrok',
    args: ['http', '3003'],
    cwd: __dirname,
    color: '\x1b[35m', // Magenta
  });
}

if (!dockerComposeSuccess) {
  console.log('\x1b[33m[System] Docker not active. Appending local Python services (Orchestrator & MemoryService) and CalendarMCP to the runner...\x1b[0m');
  services.push(
    {
      name: 'CalendarMCP',
      command: 'npm',
      args: ['start'],
      cwd: path.join(__dirname, 'calendar-mcp-server'),
      color: '\x1b[33m', // Yellow
    },
    {
      name: 'MemoryService',
      command: path.join(__dirname, 'backend', 'venv', 'bin', 'python'),
      args: ['-m', 'uvicorn', 'memory_service.main:app', '--host', '0.0.0.0', '--port', '8001'],
      cwd: path.join(__dirname, 'backend'),
      color: '\x1b[35m', // Magenta
    },
    {
      name: 'Orchestrator',
      command: path.join(__dirname, 'backend', 'venv', 'bin', 'python'),
      args: ['-m', 'uvicorn', 'orchestrator.main:app', '--host', '0.0.0.0', '--port', '8000'],
      cwd: path.join(__dirname, 'backend'),
      color: '\x1b[32m', // Green
    }
  );
} else {
  // We still need to make sure the dockerized calendar-mcp is up to date since we edited index.js
  console.log('\x1b[36m[System] Rebuilding dockerized Calendar MCP container with updated endpoints...\x1b[0m');
  try {
    execSync('docker compose up -d --build calendar-mcp', { stdio: 'inherit', cwd: __dirname });
  } catch (e) {
    console.log('\x1b[31m[System] Warning: Failed to rebuild calendar-mcp container.\x1b[0m');
  }
}

>>>>>>> 026f1cc27eb0b42b049d2b7c85a299f6a4fcc6f4
const children = [];

function killProcess(child) {
  if (!child || child.killed) return;

  if (process.platform === 'win32') {
    // taskkill kills the shell wrapper AND its child process tree on Windows.
    exec(`taskkill /pid ${child.pid} /f /t`, (err) => {
      if (err) child.kill();
    });
  } else {
    child.kill('SIGTERM');
  }
}

function startService(service) {
  const { name, command, args, cwd, color, optional } = service;
  const resetColor = '\x1b[0m';

  console.log(`${color}[System] Starting ${name}...${resetColor}`);

  const child = spawn(command, args, {
    cwd,
    shell: true,
    env: { ...process.env, FORCE_COLOR: 'true' },
  });

  children.push({ name, child });

  const logData = (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${color}[${name}]${resetColor} ${line}`);
      }
    });
  };

  child.stdout.on('data', logData);
  child.stderr.on('data', logData);

  child.on('close', (code) => {
    console.log(`${color}[System] ${name} exited with code ${code}${resetColor}`);
    if (code !== 0 && code !== null) {
      if (optional) {
        // Non-fatal: log and continue. The rest of the stack keeps running.
        console.log(`\x1b[33m[System] Optional service ${name} failed (code ${code}) — continuing without it.\x1b[0m`);
      } else {
        console.log(`\x1b[31m[System] Critical service ${name} failed. Shutting down all services...\x1b[0m`);
        shutdown();
      }
    }
  });

  child.on('error', (err) => {
    console.error(`\x1b[31m[System] Failed to start ${name}: ${err.message}\x1b[0m`);
    if (!optional) shutdown();
  });
}

function shutdown() {
  console.log('\n\x1b[36m[System] Stopping all services...\x1b[0m');
  children.forEach(({ name, child }) => {
    console.log(`\x1b[36m[System] Killing ${name} (pid ${child.pid})...\x1b[0m`);
    killProcess(child);
  });
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

// Handle exit signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start all services
services.forEach(startService);
