#!/usr/bin/env node

/**
 * bump-version.js - Auto-increment the patch version in manifest.json
 *
 * Usage: node bump-version.js
 *
 * Bumps 0.1.0 → 0.1.1 → 0.1.2 → ... etc.
 * Also updates the about page version badge if present.
 */

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, 'manifest.json');
const ABOUT_HTML_PATH = path.join(__dirname, 'about', 'about.html');

// Read manifest
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
const oldVersion = manifest.version;

// Bump patch version
const parts = oldVersion.split('.').map(Number);
parts[2] = (parts[2] || 0) + 1;
const newVersion = parts.join('.');

// Write manifest
manifest.version = newVersion;
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');

// Update about page version badge if it exists
try {
  let aboutHtml = fs.readFileSync(ABOUT_HTML_PATH, 'utf-8');
  aboutHtml = aboutHtml.replace(
    /v\d+\.\d+\.\d+/,
    `v${newVersion}`
  );
  fs.writeFileSync(ABOUT_HTML_PATH, aboutHtml);
} catch { /* about page might not exist */ }

console.log(`  📦 Version: ${oldVersion} → ${newVersion}`);
