const { spawn, execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

let dockerComposeSuccess = true;
// Ensure the dockerized backend stack is running before starting the frontend
console.log('\x1b[36m[System] Ensuring Dockerized Backend Services are up and running...\x1b[0m');
try {
  execSync('docker compose up -d', { stdio: 'inherit', cwd: __dirname });
} catch (e) {
  console.log('\x1b[31m[System] Warning: Failed to spin up backend containers. Continuing...\x1b[0m');
  dockerComposeSuccess = false;
}

const services = [
  {
    name: 'Frontend',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: __dirname,
    color: '\x1b[36m', // Cyan
  },
  {
    name: 'SlackMCP',
    command: 'node',
    args: ['index.cjs'],
    cwd: path.join(__dirname, 'MCP', 'slack'),
    color: '\x1b[33m', // Yellow
  },
  {
    name: 'EmailMCP',
    command: 'node',
    args: ['index.cjs'],
    cwd: path.join(__dirname, 'MCP', 'email'),
    color: '\x1b[34m', // Blue
  },
  {
    name: 'Role1CalendarMCP',
    command: 'node',
    args: ['index.cjs'],
    cwd: path.join(__dirname, 'MCP', 'google-calendar'),
    color: '\x1b[38;5;208m', // Orange
  },
  {
    name: 'CalendarMCP',
    command: 'npm',
    args: ['start'],
    cwd: path.join(__dirname, 'calendar-mcp-server'),
    color: '\x1b[33m', // Yellow
  },
  {
    name: 'GmailMCP',
    command: 'npm',
    args: ['start'],
    cwd: path.join(__dirname, 'gmail-mcp-server'),
    color: '\x1b[34m', // Blue
  },
  {
    name: 'SlackOAuthMCP',
    command: 'npm',
    args: ['start'],
    cwd: path.join(__dirname, 'slack-mcp-server'),
    color: '\x1b[95m', // Magenta bright
  },
];

if (!dockerComposeSuccess) {
  console.log('\x1b[33m[System] Docker not active. Appending local Python services (Orchestrator & MemoryService) to the runner...\x1b[0m');
  services.push(
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
}

const children = [];

function killProcess(child) {
  if (!child || child.killed) return;
  
  if (process.platform === 'win32') {
    // Windows taskkill to cleanly kill the shell wrapper and its child process tree
    exec(`taskkill /pid ${child.pid} /f /t`, (err) => {
      if (err) {
        child.kill();
      }
    });
  } else {
    child.kill('SIGTERM');
  }
}

function startService(service) {
  const { name, command, args, cwd, color } = service;
  const resetColor = '\x1b[0m';
  
  console.log(`${color}[System] Starting ${name}...${resetColor}`);
  
  const child = spawn(command, args, {
    cwd,
    shell: true,
    env: { ...process.env, FORCE_COLOR: 'true' }
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
      console.log(`\x1b[31m[System] Critical service ${name} failed. Shutting down all services...\x1b[0m`);
      shutdown();
    }
  });
  
  child.on('error', (err) => {
    console.error(`\x1b[31m[System] Failed to start ${name}: ${err.message}\x1b[0m`);
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
