/**
 * editor.js - AI Monkey script editor
 *
 * Handles creating and editing scripts with a form-based UI for metadata
 * and a large textarea for English-language instructions.
 */

import { getScript, saveScript } from '../lib/storage.js';
import { createTemplate, parseScript, serializeScript } from '../lib/parser.js';
import { decodeSharePayload } from '../lib/share.js';
import { detectLanguage } from '../lib/language.js';

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------

const pageTitle = document.getElementById('page-title');
const nameInput = document.getElementById('script-name');
const descriptionInput = document.getElementById('script-description');
const matchTextarea = document.getElementById('script-match');
const excludeTextarea = document.getElementById('script-exclude');
const conditionTextarea = document.getElementById('script-condition');
const runAtSelect = document.getElementById('script-runat');
const cacheSelect = document.getElementById('script-cache');
const versionInput = document.getElementById('script-version');
const bodyTextarea = document.getElementById('script-body');
const charCount = document.getElementById('char-count');
const statusChars = document.getElementById('status-chars');
const statusText = document.getElementById('status-text');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const testBtn = document.getElementById('test-btn');
const toastEl = document.getElementById('toast');

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let scriptId = null; // null = new script
let existingScript = null; // loaded script object for updates

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

let toastTimer = null;

function showToast(message, type = 'success') {
  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.className = `toast ${type}`;
  toastEl.hidden = false;
  void toastEl.offsetWidth;
  toastEl.classList.add('visible');

  toastTimer = setTimeout(() => {
    toastEl.classList.remove('visible');
    setTimeout(() => { toastEl.hidden = true; }, 200);
  }, 2500);
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

function goToDashboard() {
  const url = chrome.runtime.getURL('dashboard/dashboard.html');
  window.location.href = url;
}

// ---------------------------------------------------------------------------
// Character count
// ---------------------------------------------------------------------------

const langIndicator = document.getElementById('lang-indicator');

function updateCharCount() {
  const len = bodyTextarea.value.length;
  const text = `${len} character${len !== 1 ? 's' : ''}`;
  charCount.textContent = text;
  statusChars.textContent = text;
}

function updateLanguageIndicator() {
  const text = bodyTextarea.value;
  if (text.trim().length < 10) {
    langIndicator.hidden = true;
    return;
  }
  const result = detectLanguage(text);
  if (!result.isEnglish) {
    langIndicator.hidden = false;
    langIndicator.textContent = '🌐 Non-English detected — will auto-translate';
  } else {
    langIndicator.hidden = true;
  }
}

bodyTextarea.addEventListener('input', () => {
  updateCharCount();
  updateLanguageIndicator();
});

// ---------------------------------------------------------------------------
// Populate form from a script object
// ---------------------------------------------------------------------------

function populateForm(script) {
  const meta = script.metadata || {};
  nameInput.value = meta.name || '';
  descriptionInput.value = meta.description || '';
  versionInput.value = meta.version || '1.0';

  // Match patterns: array -> one per line
  const matches = Array.isArray(meta.match) ? meta.match : [];
  matchTextarea.value = matches.join('\n');

  // Exclude patterns
  const excludes = Array.isArray(meta.exclude) ? meta.exclude : [];
  excludeTextarea.value = excludes.join('\n');

  // Condition patterns
  const conditions = Array.isArray(meta.condition) ? meta.condition : [];
  conditionTextarea.value = conditions.join('\n');

  // Run-at
  if (meta.runAt) {
    runAtSelect.value = meta.runAt;
  }

  // Cache
  if (meta.cache) {
    cacheSelect.value = meta.cache;
  }

  // Body: if script has rawText, parse to get body; otherwise use script.body
  if (script.rawText) {
    const parsed = parseScript(script.rawText);
    bodyTextarea.value = parsed.body;
  } else if (script.body) {
    bodyTextarea.value = script.body;
  } else {
    bodyTextarea.value = '';
  }

  updateCharCount();
}

// ---------------------------------------------------------------------------
// Build script object from form
// ---------------------------------------------------------------------------

function buildScriptFromForm() {
  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();
  const version = versionInput.value.trim();
  const runAt = runAtSelect.value;
  const cache = cacheSelect.value;
  const body = bodyTextarea.value;

  // Parse match patterns (one per line, trimmed, non-empty)
  const matchPatterns = matchTextarea.value
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const excludePatterns = excludeTextarea.value
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const conditionPatterns = conditionTextarea.value
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const metadata = {
    name,
    description,
    match: matchPatterns,
    exclude: excludePatterns,
    condition: conditionPatterns,
    runAt,
    cache,
    version
  };

  // Build the raw text representation
  const rawText = serializeScript(metadata, body);

  const script = {
    metadata,
    body,
    rawText,
    enabled: existingScript ? existingScript.enabled : true
  };

  // Preserve id if editing
  if (scriptId) {
    script.id = scriptId;
  }

  return script;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate() {
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.focus();
    showToast('Script name is required', 'error');
    return false;
  }

  const matchPatterns = matchTextarea.value
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (matchPatterns.length === 0) {
    matchTextarea.focus();
    showToast('Please describe which sites this script should run on', 'error');
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

saveBtn.addEventListener('click', async () => {
  if (!validate()) return;

  saveBtn.disabled = true;
  statusText.textContent = 'Saving...';

  try {
    const script = buildScriptFromForm();
    await saveScript(script);
    showToast('Script saved');
    // Short delay so user sees the toast before redirect
    setTimeout(goToDashboard, 600);
  } catch (err) {
    showToast(`Failed to save: ${err.message}`, 'error');
    statusText.textContent = 'Save failed';
    saveBtn.disabled = false;
  }
});

// ---------------------------------------------------------------------------
// Cancel
// ---------------------------------------------------------------------------

cancelBtn.addEventListener('click', goToDashboard);

// ---------------------------------------------------------------------------
// Test Run
// ---------------------------------------------------------------------------

testBtn.addEventListener('click', async () => {
  testBtn.disabled = true;
  statusText.textContent = 'Running test...';

  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      showToast('No active tab found', 'error');
      return;
    }

    const response = await chrome.runtime.sendMessage({
      type: 'RUN_ON_PAGE',
      tabId: tab.id,
      scriptBody: bodyTextarea.value
    });

    if (response?.error) {
      showToast(`Test failed: ${response.error}`, 'error');
      statusText.textContent = 'Test failed';
    } else {
      showToast('Test run completed');
      statusText.textContent = 'Test run OK';
    }
  } catch (err) {
    showToast(`Test failed: ${err.message}`, 'error');
    statusText.textContent = 'Test failed';
  } finally {
    testBtn.disabled = false;
  }
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

async function init() {
  // Check URL params for script id
  const params = new URLSearchParams(window.location.search);
  scriptId = params.get('id');

  // Handle shared script install link
  const installData = params.get('install');
  if (installData) {
    try {
      const shared = decodeSharePayload(installData);
      pageTitle.textContent = 'Install Shared Script';
      document.title = 'AI Monkey - Install Script';
      populateForm({ metadata: shared.metadata, body: shared.body });
      showToast('Script loaded from share link — review and save to install');
      statusText.textContent = 'Review & Save';
      updateCharCount();
      return;
    } catch (err) {
      showToast('Invalid share link', 'error');
    }
  }

  if (scriptId) {
    pageTitle.textContent = 'Edit Script';
    document.title = 'AI Monkey - Edit Script';
    statusText.textContent = 'Loading...';

    try {
      existingScript = await getScript(scriptId);
      if (existingScript) {
        populateForm(existingScript);
        statusText.textContent = 'Ready';
      } else {
        showToast('Script not found', 'error');
        statusText.textContent = 'Script not found';
        scriptId = null;
      }
    } catch (err) {
      showToast('Failed to load script', 'error');
      statusText.textContent = 'Load failed';
      scriptId = null;
    }
  } else {
    // New script: use default template values
    pageTitle.textContent = 'New Script';
    const template = createTemplate('', '');
    const parsed = parseScript(template);
    matchTextarea.value = parsed.metadata.match.join('\n');
    runAtSelect.value = parsed.metadata.runAt;
    cacheSelect.value = parsed.metadata.cache;
    versionInput.value = parsed.metadata.version;
    statusText.textContent = 'Ready';

    // Pre-fill "Run on" with the source URL if passed via query param
    const sourceUrl = params.get('url');
    if (sourceUrl) {
      try {
        const urlObj = new URL(sourceUrl);
        matchTextarea.value = urlObj.hostname;
      } catch {
        matchTextarea.value = sourceUrl;
      }
    }
  }

  updateCharCount();
}

init();
