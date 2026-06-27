const { spawn, execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// ── Docker detection ──────────────────────────────────────────────────────────
// Use `docker info` to detect whether the Docker daemon is reachable.
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
}

// ── Service definitions ───────────────────────────────────────────────────────
// optional: true  → failure is logged but does NOT shut down other services.
// optional: false → failure is treated as fatal and triggers a full shutdown.

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
    args: ['index.cjs'],
    cwd: path.join(__dirname, 'MCP', 'whatsapp'),
    color: '\x1b[32m', // Green
    optional: true,
  },
];

// ── ngrok Tunnel for WhatsApp ──────────────────────────────────────────────────
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
    optional: true,
  });
}

// ── Local Python backend (when Docker is not managing it) ─────────────────────
if (!dockerComposeSuccess) {
  console.log('\x1b[33m[System] Docker not active. Appending local Python services (Orchestrator & MemoryService) and CalendarMCP to the runner...\x1b[0m');
  
  services.push({
    name: 'CalendarMCP',
    command: 'npm',
    args: ['start'],
    cwd: path.join(__dirname, 'calendar-mcp-server'),
    color: '\x1b[38;5;208m', // Orange
    optional: true,
  });

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

// ── Process management ────────────────────────────────────────────────────────
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
  console.log('\x1b[31m[System] Stopping all services...\x1b[0m');
  children.forEach(({ name, child }) => {
    console.log(`[System] Stopping ${name}...`);
    killProcess(child);
  });
  process.exit(0);
}

// Handle termination signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start all services
services.forEach(startService);
