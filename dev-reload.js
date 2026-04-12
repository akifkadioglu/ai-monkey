#!/usr/bin/env node

/**
 * dev-reload.js - Auto-reload AI Monkey extension on file changes
 *
 * Usage: node dev-reload.js
 *
 * Watches the project directory for file changes and tells Chrome
 * to reload the extension automatically. Uses the Chrome DevTools
 * Protocol via the extension's built-in reload API.
 *
 * How it works:
 * 1. Watches for .js, .html, .css file changes
 * 2. Sends a reload signal to the extension via a tiny WebSocket server
 * 3. The extension's service worker connects to this server and reloads when signaled
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execFileSync } = require('child_process');

const DIR = path.resolve(__dirname);
const DEBOUNCE_MS = 500;
const PORT = 9234;

let clients = [];
let debounceTimer = null;

// --- Simple WebSocket-like SSE server ---
const server = http.createServer((req, res) => {
  if (req.url === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write('data: connected\n\n');
    clients.push(res);
    req.on('close', () => {
      clients = clients.filter(c => c !== res);
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('AI Monkey dev reload server');
  }
});

function notifyClients() {
  console.log(`  → Sending reload signal to ${clients.length} client(s)`);
  for (const client of clients) {
    client.write('data: reload\n\n');
  }
}

// --- File watcher ---
const WATCH_EXTENSIONS = new Set(['.js', '.html', '.css', '.json']);
const IGNORE_DIRS = new Set(['node_modules', '.git', '.claude', 'icons']);

const IGNORE_FILES = new Set(['manifest.json']); // Don't trigger on version bump

function shouldWatch(filePath) {
  const ext = path.extname(filePath);
  if (!WATCH_EXTENSIONS.has(ext)) return false;
  const rel = path.relative(DIR, filePath);
  if (IGNORE_FILES.has(rel)) return false;
  return !rel.split(path.sep).some(part => IGNORE_DIRS.has(part));
}

function bumpVersion() {
  try {
    execFileSync('node', [path.join(DIR, 'bump-version.js')], { stdio: 'inherit' });
  } catch (err) {
    console.error('  ⚠️  Version bump failed:', err.message);
  }
}

function watchDir(dir) {
  try {
    fs.watch(dir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      const fullPath = path.join(dir, filename);
      if (!shouldWatch(fullPath)) return;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const rel = path.relative(DIR, fullPath);
        console.log(`\n  📝 Changed: ${rel}`);
        bumpVersion();
        notifyClients();
      }, DEBOUNCE_MS);
    });
  } catch (err) {
    console.error('Watch error:', err.message);
  }
}

// --- Start ---
server.listen(PORT, () => {
  console.log(`
  🐵 AI Monkey Dev Reload Server
  ────────────────────────────────
  SSE endpoint: http://localhost:${PORT}/events
  Watching:     ${DIR}

  The extension will auto-reload when you change any .js, .html, .css, or .json file.
  `);
  watchDir(DIR);
});
