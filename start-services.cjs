const { spawn, execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

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
    args: ['index.js'],
    cwd: path.join(__dirname, 'MCP', 'slack'),
    color: '\x1b[33m', // Yellow
    optional: true,
  },
  {
    name: 'EmailMCP',
    command: 'node',
    args: ['index.js'],
    cwd: path.join(__dirname, 'MCP', 'email'),
    color: '\x1b[34m', // Blue
    optional: true,
  },
  {
    name: 'CalendarMCP',
    command: 'node',
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
