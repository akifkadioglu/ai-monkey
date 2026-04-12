/**
 * popup.js - AI Monkey popup controller
 *
 * Renders matching scripts for the current tab, handles toggle/run actions,
 * and provides navigation to extension pages.
 */

import { getScripts, getSettings, toggleScript } from '../lib/storage.js';
import { matchesUrl } from '../lib/matcher.js';

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------

const scriptsList = document.getElementById('scripts-list');
const emptyState = document.getElementById('empty-state');
const scriptCount = document.getElementById('script-count');
const apiKeyWarning = document.getElementById('api-key-warning');
const settingsLinkWarning = document.getElementById('settings-link-warning');
const toastEl = document.getElementById('toast');

// ---------------------------------------------------------------------------
// Toast helper
// ---------------------------------------------------------------------------

let toastTimer = null;

function showToast(message, type = 'success') {
  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.className = `toast ${type}`;
  toastEl.hidden = false;

  // Trigger reflow so the transition plays
  void toastEl.offsetWidth;
  toastEl.classList.add('visible');

  toastTimer = setTimeout(() => {
    toastEl.classList.remove('visible');
    setTimeout(() => {
      toastEl.hidden = true;
    }, 200);
  }, 2000);
}

// ---------------------------------------------------------------------------
// Open extension page helper
// ---------------------------------------------------------------------------

function openExtensionPage(path) {
  const url = chrome.runtime.getURL(path);
  chrome.tabs.create({ url });
}

// ---------------------------------------------------------------------------
// Render a single script row
// ---------------------------------------------------------------------------

function renderScriptRow(script, tabId) {
  const row = document.createElement('div');
  row.className = 'script-row';

  // Info (name + first match pattern)
  const info = document.createElement('div');
  info.className = 'script-info';

  const name = document.createElement('div');
  name.className = 'script-name';
  name.textContent = script.metadata?.name || script.name || 'Untitled Script';

  const pattern = document.createElement('div');
  pattern.className = 'script-pattern';
  const sites = script.metadata?.match || [];
  pattern.textContent = sites[0] || 'No sites specified';

  info.appendChild(name);
  info.appendChild(pattern);

  // Toggle
  const toggle = document.createElement('label');
  toggle.className = 'toggle';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = script.enabled;
  checkbox.addEventListener('change', async () => {
    try {
      const newState = await toggleScript(script.id);
      checkbox.checked = newState;
    } catch (err) {
      checkbox.checked = !checkbox.checked;
      showToast('Failed to toggle script', 'error');
    }
  });

  const slider = document.createElement('span');
  slider.className = 'toggle-slider';

  toggle.appendChild(checkbox);
  toggle.appendChild(slider);

  // Run button
  const runBtn = document.createElement('button');
  runBtn.className = 'btn-run';
  runBtn.textContent = 'Run';
  runBtn.addEventListener('click', async () => {
    runBtn.disabled = true;
    runBtn.textContent = '...';
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'RUN_SCRIPT',
        tabId,
        scriptId: script.id
      });

      if (response?.error) {
        showToast(response.error, 'error');
      } else {
        showToast('Script executed successfully', 'success');
      }
    } catch (err) {
      showToast('Failed to run script', 'error');
    } finally {
      runBtn.disabled = false;
      runBtn.textContent = 'Run';
    }
  });

  row.appendChild(info);
  row.appendChild(toggle);
  row.appendChild(runBtn);

  return row;
}

// ---------------------------------------------------------------------------
// Main initialisation
// ---------------------------------------------------------------------------

async function init() {
  // Get the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentUrl = tab?.url || '';
  const tabId = tab?.id;

  // Load scripts and settings in parallel
  const [scriptsObj, settings] = await Promise.all([
    getScripts(),
    getSettings()
  ]);

  const allScripts = Object.values(scriptsObj);

  // Check API key
  if (!settings.apiKey) {
    apiKeyWarning.hidden = false;
  }

  // Show total count
  const totalCount = allScripts.length;
  scriptCount.textContent = `${totalCount} script${totalCount !== 1 ? 's' : ''} total`;

  // Find matching scripts (include disabled ones in the popup so users can toggle them)
  const matchingScripts = allScripts.filter((script) => {
    const matchPatterns = script.metadata?.match || [];
    const excludePatterns = script.metadata?.exclude || [];
    return matchesUrl(currentUrl, matchPatterns, excludePatterns);
  });

  // Render
  if (matchingScripts.length === 0) {
    scriptsList.innerHTML = '';
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
    const fragment = document.createDocumentFragment();
    for (const script of matchingScripts) {
      fragment.appendChild(renderScriptRow(script, tabId));
    }
    scriptsList.appendChild(fragment);
  }

  // Footer links
  document.querySelectorAll('.footer-link[data-page]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      // Pass current tab URL when opening the editor for a new script
      if (page === 'editor/editor.html' && currentUrl && !currentUrl.startsWith('chrome')) {
        openExtensionPage(`${page}?url=${encodeURIComponent(currentUrl)}`);
      } else {
        openExtensionPage(page);
      }
    });
  });

  // Warning banner settings link
  settingsLinkWarning.addEventListener('click', (e) => {
    e.preventDefault();
    openExtensionPage('settings/settings.html');
  });
}

init();
