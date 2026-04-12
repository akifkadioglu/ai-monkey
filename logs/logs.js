/**
 * logs.js - AI Monkey execution log viewer
 *
 * Displays, filters, and manages execution logs.
 */

import { getLogs, clearLogs } from '../lib/storage.js';

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------

const logsList = document.getElementById('logs-list');
const emptyState = document.getElementById('empty-state');
const noResults = document.getElementById('no-results');
const logCountEl = document.getElementById('log-count');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const clearLogsBtn = document.getElementById('clear-logs-btn');
const autoRefreshEl = document.getElementById('auto-refresh');
const loadMoreBtn = document.getElementById('load-more-btn');
const toastEl = document.getElementById('toast');
const confirmModal = document.getElementById('confirm-modal');
const confirmCancel = document.getElementById('confirm-cancel');
const confirmOk = document.getElementById('confirm-ok');

// State
let allLogs = [];
let filteredLogs = [];
let displayCount = 50;
const PAGE_SIZE = 50;
let autoRefreshInterval = null;
let lastLogHash = '';

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
// Formatting helpers
// ---------------------------------------------------------------------------

function formatTimestamp(ts) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (isToday) return time;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + time;
}

function truncateUrl(url, maxLen = 60) {
  if (!url) return '';
  if (url.length <= maxLen) return url;
  return url.substring(0, maxLen) + '...';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function getLogStatus(log) {
  if (log.cached) return 'cached';
  if (log.error || log.status === 'error') return 'error';
  return 'success';
}

function computeHash(logs) {
  // Simple hash for change detection
  return logs.length + '-' + (logs[0]?.id || '') + '-' + (logs[0]?.timestamp || '');
}

function filterLogs() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;

  filteredLogs = allLogs.filter((log) => {
    // Status filter
    if (status !== 'all' && getLogStatus(log) !== status) return false;

    // Search filter
    if (query) {
      const name = (log.scriptName || '').toLowerCase();
      const url = (log.url || '').toLowerCase();
      if (!name.includes(query) && !url.includes(query)) return false;
    }

    return true;
  });
}

function renderLogs() {
  filterLogs();

  // Update count
  logCountEl.textContent = `${allLogs.length} ${allLogs.length === 1 ? 'log' : 'logs'}`;

  // Show/hide states
  if (allLogs.length === 0) {
    logsList.innerHTML = '';
    emptyState.hidden = false;
    noResults.hidden = true;
    loadMoreBtn.hidden = true;
    return;
  }

  emptyState.hidden = true;

  if (filteredLogs.length === 0) {
    logsList.innerHTML = '';
    noResults.hidden = false;
    loadMoreBtn.hidden = true;
    return;
  }

  noResults.hidden = true;

  const toShow = filteredLogs.slice(0, displayCount);
  loadMoreBtn.hidden = toShow.length >= filteredLogs.length;

  logsList.innerHTML = toShow.map((log) => renderLogCard(log)).join('');

  // Attach event listeners
  logsList.querySelectorAll('.log-card-header').forEach((header) => {
    header.addEventListener('click', () => {
      const card = header.closest('.log-card');
      card.classList.toggle('expanded');
    });
  });

  // Copy buttons
  logsList.querySelectorAll('.btn-copy').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const code = btn.dataset.code;
      navigator.clipboard.writeText(code).then(() => {
        btn.classList.add('copied');
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.textContent = 'Copy';
        }, 1500);
      });
    });
  });
}

function renderLogCard(log) {
  const status = getLogStatus(log);
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
  const hasCode = log.generatedCode || log.code;
  const code = log.generatedCode || log.code || '';
  const hasError = log.error;
  const inputTokens = log.inputTokens ?? log.tokensInput ?? null;
  const outputTokens = log.outputTokens ?? log.tokensOutput ?? null;

  return `
    <div class="log-card status-${status}" data-id="${log.id}">
      <div class="log-card-header">
        <svg class="log-expand-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        <div class="log-summary">
          <span class="log-script-name">${escapeHtml(log.scriptName || 'Unknown Script')}</span>
          <span class="log-url" title="${escapeHtml(log.url || '')}">${escapeHtml(truncateUrl(log.url))}</span>
        </div>
        <div class="log-meta">
          <span class="status-badge ${status}">${statusLabel}</span>
          <span class="log-timestamp">${formatTimestamp(log.timestamp)}</span>
        </div>
      </div>
      <div class="log-card-body">
        <div class="log-detail-row">
          <span class="log-detail-label">URL</span>
          <span class="log-detail-value">${escapeHtml(log.url || 'N/A')}</span>
        </div>
        ${hasError ? `
        <div class="log-detail-row">
          <span class="log-detail-label">Error</span>
          <span class="log-detail-value error-text">${escapeHtml(log.error)}</span>
        </div>` : ''}
        ${(inputTokens !== null || outputTokens !== null) ? `
        <div class="log-tokens">
          ${inputTokens !== null ? `<span class="token-item">Input: <span>${inputTokens.toLocaleString()}</span></span>` : ''}
          ${outputTokens !== null ? `<span class="token-item">Output: <span>${outputTokens.toLocaleString()}</span></span>` : ''}
        </div>` : ''}
        ${hasCode ? `
        <div class="code-block-wrapper">
          <div class="code-block-header">
            <span class="code-block-label">Generated JavaScript</span>
            <button class="btn-copy" data-code="${escapeHtml(code)}">Copy</button>
          </div>
          <div class="code-block">
            <pre>${escapeHtml(code)}</pre>
          </div>
        </div>` : ''}
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------

async function loadLogs() {
  allLogs = await getLogs();
  const hash = computeHash(allLogs);
  if (hash !== lastLogHash) {
    lastLogHash = hash;
    renderLogs();
  }
}

// ---------------------------------------------------------------------------
// Search & filter
// ---------------------------------------------------------------------------

searchInput.addEventListener('input', () => {
  displayCount = PAGE_SIZE;
  renderLogs();
});

statusFilter.addEventListener('change', () => {
  displayCount = PAGE_SIZE;
  renderLogs();
});

// ---------------------------------------------------------------------------
// Load more
// ---------------------------------------------------------------------------

loadMoreBtn.addEventListener('click', () => {
  displayCount += PAGE_SIZE;
  renderLogs();
});

// ---------------------------------------------------------------------------
// Clear Logs
// ---------------------------------------------------------------------------

clearLogsBtn.addEventListener('click', () => {
  if (allLogs.length === 0) {
    showToast('No logs to clear', 'error');
    return;
  }
  confirmModal.hidden = false;
});

confirmCancel.addEventListener('click', () => {
  confirmModal.hidden = true;
});

confirmOk.addEventListener('click', async () => {
  confirmModal.hidden = true;
  await clearLogs();
  allLogs = [];
  lastLogHash = '';
  renderLogs();
  showToast('All logs cleared');
});

confirmModal.addEventListener('click', (e) => {
  if (e.target === confirmModal) {
    confirmModal.hidden = true;
  }
});

// ---------------------------------------------------------------------------
// Auto-refresh
// ---------------------------------------------------------------------------

autoRefreshEl.addEventListener('change', () => {
  if (autoRefreshEl.checked) {
    autoRefreshInterval = setInterval(loadLogs, 5000);
  } else {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

async function init() {
  allLogs = await getLogs();
  lastLogHash = computeHash(allLogs);
  renderLogs();
}

init();
