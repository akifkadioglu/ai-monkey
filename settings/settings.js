/**
 * settings.js - AI Monkey settings page
 *
 * Manages API configuration, defaults, and data operations.
 */

import {
  getSettings,
  saveSettings,
  getScripts,
  saveScript,
  getLogs,
  clearLogs,
  clearCache,
  DEFAULT_SETTINGS
} from '../lib/storage.js';

// ---------------------------------------------------------------------------
// Provider & model configuration
// ---------------------------------------------------------------------------

const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', desc: 'Fast & smart, best value', default: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Fastest, cheapest' },
      { id: 'gpt-4.1', name: 'GPT-4.1', desc: 'Latest flagship model' },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', desc: 'Compact latest model' },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', desc: 'Smallest, fastest' },
      { id: 'o3', name: 'o3', desc: 'Reasoning model' },
      { id: 'o4-mini', name: 'o4-mini', desc: 'Fast reasoning' },
    ]
  },
  anthropic: {
    name: 'Anthropic',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', desc: 'Best balance of speed & quality', default: true },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', desc: 'Most capable' },
      { id: 'claude-haiku-3-5-20241022', name: 'Claude Haiku 3.5', desc: 'Fastest, cheapest' },
    ]
  },
  google: {
    name: 'Google',
    models: [
      { id: 'gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro', desc: 'Most capable', default: true },
      { id: 'gemini-2.5-flash-preview-04-17', name: 'Gemini 2.5 Flash', desc: 'Fast & efficient' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Previous gen fast' },
    ]
  },
  groq: {
    name: 'Groq',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', desc: 'Best open model', default: true },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', desc: 'Ultra fast' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', desc: 'Fast MoE model' },
    ]
  },
  openrouter: {
    name: 'OpenRouter',
    models: [
      { id: 'openai/gpt-4o', name: 'GPT-4o (via OR)', desc: 'Routes to OpenAI', default: true },
      { id: 'anthropic/claude-sonnet-4-20250514', name: 'Sonnet 4 (via OR)', desc: 'Routes to Anthropic' },
      { id: 'google/gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro (via OR)', desc: 'Routes to Google' },
    ]
  },
};

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------

const providerEl = document.getElementById('provider');
const modelEl = document.getElementById('model');
const customModelGroup = document.getElementById('custom-model-group');
const customModelEl = document.getElementById('custom-model');
const apiKeyEl = document.getElementById('api-key');
const toggleKeyBtn = document.getElementById('toggle-key');
const eyeOpen = document.getElementById('eye-open');
const eyeClosed = document.getElementById('eye-closed');
const testBtn = document.getElementById('test-btn');
const testResult = document.getElementById('test-result');
const defaultRunAtEl = document.getElementById('default-runat');
const cacheEnabledEl = document.getElementById('cache-enabled');
const cacheLabel = document.getElementById('cache-label');
const cacheCountEl = document.getElementById('cache-count');
const logCountEl = document.getElementById('log-count');
const clearCacheBtn = document.getElementById('clear-cache-btn');
const clearLogsBtn = document.getElementById('clear-logs-btn');
const exportBtn = document.getElementById('export-btn');
const resetBtn = document.getElementById('reset-btn');
const saveBtn = document.getElementById('save-btn');
const toastEl = document.getElementById('toast');
const confirmModal = document.getElementById('confirm-modal');
const confirmTitle = document.getElementById('confirm-title');
const confirmBody = document.getElementById('confirm-body');
const confirmCancel = document.getElementById('confirm-cancel');
const confirmOk = document.getElementById('confirm-ok');

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
// Confirmation modal helper
// ---------------------------------------------------------------------------

let confirmResolve = null;

function showConfirm(title, body) {
  confirmTitle.textContent = title;
  confirmBody.textContent = body;
  confirmModal.hidden = false;
  return new Promise((resolve) => {
    confirmResolve = resolve;
  });
}

confirmCancel.addEventListener('click', () => {
  confirmModal.hidden = true;
  if (confirmResolve) confirmResolve(false);
});

confirmOk.addEventListener('click', () => {
  confirmModal.hidden = true;
  if (confirmResolve) confirmResolve(true);
});

confirmModal.addEventListener('click', (e) => {
  if (e.target === confirmModal) {
    confirmModal.hidden = true;
    if (confirmResolve) confirmResolve(false);
  }
});

// ---------------------------------------------------------------------------
// Provider & model population
// ---------------------------------------------------------------------------

function populateProviders(selectedProvider) {
  providerEl.innerHTML = '';
  for (const [key, provider] of Object.entries(PROVIDERS)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = provider.name;
    if (key === selectedProvider) opt.selected = true;
    providerEl.appendChild(opt);
  }
}

function populateModels(providerKey, selectedModelId) {
  const provider = PROVIDERS[providerKey];
  if (!provider) return;

  modelEl.innerHTML = '';

  let hasMatch = false;

  for (const model of provider.models) {
    const opt = document.createElement('option');
    opt.value = model.id;
    opt.textContent = `${model.name}  \u2014  ${model.desc}`;
    if (model.id === selectedModelId) {
      opt.selected = true;
      hasMatch = true;
    }
    modelEl.appendChild(opt);
  }

  // Add custom option
  const customOpt = document.createElement('option');
  customOpt.value = '__custom__';
  customOpt.textContent = 'Custom model...';
  modelEl.appendChild(customOpt);

  // If the saved model doesn't match any known model, select custom
  if (selectedModelId && !hasMatch && selectedModelId !== '__custom__') {
    customOpt.selected = true;
    customModelEl.value = selectedModelId;
    customModelGroup.hidden = false;
  } else {
    customModelGroup.hidden = true;
  }

  // If nothing selected, select the default
  if (!selectedModelId && !hasMatch) {
    const defaultModel = provider.models.find(m => m.default) || provider.models[0];
    if (defaultModel) {
      modelEl.value = defaultModel.id;
    }
  }
}

function getSelectedModelId() {
  const val = modelEl.value;
  if (val === '__custom__') {
    return customModelEl.value.trim();
  }
  return val;
}

function getDefaultModelForProvider(providerKey) {
  const provider = PROVIDERS[providerKey];
  if (!provider) return 'gpt-4o';
  const def = provider.models.find(m => m.default);
  return def ? def.id : provider.models[0]?.id || 'gpt-4o';
}

// ---------------------------------------------------------------------------
// Event: provider change
// ---------------------------------------------------------------------------

providerEl.addEventListener('change', () => {
  const provider = providerEl.value;
  const defaultModel = getDefaultModelForProvider(provider);
  populateModels(provider, defaultModel);
  customModelGroup.hidden = true;
  customModelEl.value = '';
});

// ---------------------------------------------------------------------------
// Event: model change
// ---------------------------------------------------------------------------

modelEl.addEventListener('change', () => {
  if (modelEl.value === '__custom__') {
    customModelGroup.hidden = false;
    customModelEl.focus();
  } else {
    customModelGroup.hidden = true;
    customModelEl.value = '';
  }
});

// ---------------------------------------------------------------------------
// Load & populate form
// ---------------------------------------------------------------------------

async function loadForm() {
  const settings = await getSettings();

  populateProviders(settings.provider || 'openai');
  populateModels(settings.provider || 'openai', settings.model);

  apiKeyEl.value = settings.apiKey || '';
  defaultRunAtEl.value = settings.defaultRunAt || 'document-idle';
  cacheEnabledEl.checked = settings.cacheEnabled !== false;
  updateCacheLabel();

  await updateCounts();
}

function updateCacheLabel() {
  cacheLabel.textContent = cacheEnabledEl.checked ? 'Enabled' : 'Disabled';
}

async function updateCounts() {
  const result = await chrome.storage.local.get('cache');
  const cache = result.cache || {};
  const cacheCount = Object.keys(cache).length;
  cacheCountEl.textContent = `${cacheCount} ${cacheCount === 1 ? 'entry' : 'entries'}`;

  const logs = await getLogs();
  logCountEl.textContent = `${logs.length} ${logs.length === 1 ? 'entry' : 'entries'}`;
}

// ---------------------------------------------------------------------------
// API key show/hide toggle
// ---------------------------------------------------------------------------

toggleKeyBtn.addEventListener('click', () => {
  const isPassword = apiKeyEl.type === 'password';
  apiKeyEl.type = isPassword ? 'text' : 'password';
  eyeOpen.hidden = !isPassword;
  eyeClosed.hidden = isPassword;
});

// ---------------------------------------------------------------------------
// Cache toggle label
// ---------------------------------------------------------------------------

cacheEnabledEl.addEventListener('change', updateCacheLabel);

// ---------------------------------------------------------------------------
// Test Connection
// ---------------------------------------------------------------------------

testBtn.addEventListener('click', async () => {
  const provider = providerEl.value;
  const apiKey = apiKeyEl.value.trim();
  const model = getSelectedModelId() || getDefaultModelForProvider(provider);

  if (!apiKey) {
    testResult.className = 'test-result error';
    testResult.innerHTML = '<span class="result-icon">&#x2717;</span> API key is required';
    return;
  }

  testBtn.disabled = true;
  testResult.className = 'test-result';
  testResult.textContent = 'Testing...';

  try {
    switch (provider) {
      case 'openai': {
        const resp = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).error?.message || `HTTP ${resp.status}`);
        testResult.className = 'test-result success';
        testResult.innerHTML = '<span class="result-icon">&#x2713;</span> Connected to OpenAI';
        break;
      }
      case 'anthropic': {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({ model, max_tokens: 1, messages: [{ role: 'user', content: 'Hi' }] })
        });
        if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).error?.message || `HTTP ${resp.status}`);
        testResult.className = 'test-result success';
        testResult.innerHTML = '<span class="result-icon">&#x2713;</span> Connected to Anthropic';
        break;
      }
      case 'google': {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).error?.message || `HTTP ${resp.status}`);
        testResult.className = 'test-result success';
        testResult.innerHTML = '<span class="result-icon">&#x2713;</span> Connected to Google';
        break;
      }
      case 'groq': {
        const resp = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).error?.message || `HTTP ${resp.status}`);
        testResult.className = 'test-result success';
        testResult.innerHTML = '<span class="result-icon">&#x2713;</span> Connected to Groq';
        break;
      }
      case 'openrouter': {
        const resp = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).error?.message || `HTTP ${resp.status}`);
        testResult.className = 'test-result success';
        testResult.innerHTML = '<span class="result-icon">&#x2713;</span> Connected to OpenRouter';
        break;
      }
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (err) {
    testResult.className = 'test-result error';
    testResult.innerHTML = `<span class="result-icon">&#x2717;</span> ${err.message}`;
  } finally {
    testBtn.disabled = false;
  }
});

// ---------------------------------------------------------------------------
// Save settings
// ---------------------------------------------------------------------------

saveBtn.addEventListener('click', async () => {
  const provider = providerEl.value;
  const model = getSelectedModelId() || getDefaultModelForProvider(provider);
  const apiKey = apiKeyEl.value.trim();
  const defaultRunAt = defaultRunAtEl.value;
  const cacheEnabled = cacheEnabledEl.checked;

  await saveSettings({
    provider,
    model,
    apiKey,
    defaultRunAt,
    cacheEnabled
  });

  showToast('Settings saved');
});

// ---------------------------------------------------------------------------
// Clear Cache
// ---------------------------------------------------------------------------

clearCacheBtn.addEventListener('click', async () => {
  await clearCache();
  await updateCounts();
  showToast('Cache cleared');
});

// ---------------------------------------------------------------------------
// Clear Logs
// ---------------------------------------------------------------------------

clearLogsBtn.addEventListener('click', async () => {
  await clearLogs();
  await updateCounts();
  showToast('Logs cleared');
});

// ---------------------------------------------------------------------------
// Export All Scripts
// ---------------------------------------------------------------------------

exportBtn.addEventListener('click', async () => {
  const scripts = await getScripts();
  const scriptList = Object.values(scripts);

  if (scriptList.length === 0) {
    showToast('No scripts to export', 'error');
    return;
  }

  const blob = new Blob([JSON.stringify(scriptList, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-monkey-scripts-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Exported ${scriptList.length} script${scriptList.length === 1 ? '' : 's'}`);
});

// ---------------------------------------------------------------------------
// Reset Settings
// ---------------------------------------------------------------------------

resetBtn.addEventListener('click', async () => {
  const confirmed = await showConfirm(
    'Reset Settings',
    'This will reset all settings to their defaults. Your scripts and logs will not be affected. Continue?'
  );

  if (!confirmed) return;

  await saveSettings({ ...DEFAULT_SETTINGS });
  await loadForm();
  showToast('Settings reset to defaults');
});

// ---------------------------------------------------------------------------
// Google Drive Backup (graceful — skip if gdrive.js not available)
// ---------------------------------------------------------------------------

async function initGdrive() {
  try {
    const gdrive = await import('../lib/gdrive.js');
    // If gdrive module exists, wire up the UI
    const gdriveStatus = document.getElementById('gdrive-status');
    const gdriveLastBackup = document.getElementById('gdrive-last-backup');
    const gdriveConnectBtn = document.getElementById('gdrive-connect-btn');
    const gdriveBackupBtn = document.getElementById('gdrive-backup-btn');
    const gdriveRestoreBtn = document.getElementById('gdrive-restore-btn');
    const gdriveDisconnectBtn = document.getElementById('gdrive-disconnect-btn');

    if (!gdriveConnectBtn) return; // UI elements not present

    async function updateGdriveUI() {
      const signedIn = await gdrive.isSignedIn();
      if (signedIn) {
        gdriveStatus.textContent = 'Connected';
        gdriveConnectBtn.textContent = 'Connected';
        gdriveConnectBtn.disabled = true;
        gdriveBackupBtn.disabled = false;
        gdriveRestoreBtn.disabled = false;
        gdriveDisconnectBtn.disabled = false;
        const info = await gdrive.getBackupInfo();
        gdriveLastBackup.textContent = info.exists && info.modifiedTime
          ? new Date(info.modifiedTime).toLocaleString()
          : 'No backup yet';
      } else {
        gdriveStatus.textContent = 'Not connected';
        gdriveConnectBtn.textContent = 'Connect Google Drive';
        gdriveConnectBtn.disabled = false;
        gdriveBackupBtn.disabled = true;
        gdriveRestoreBtn.disabled = true;
        gdriveDisconnectBtn.disabled = true;
        gdriveLastBackup.textContent = 'Never';
      }
    }

    gdriveConnectBtn.addEventListener('click', async () => {
      try {
        gdriveConnectBtn.disabled = true;
        gdriveConnectBtn.textContent = 'Connecting...';
        await gdrive.getAuthToken(true);
        showToast('Connected to Google Drive');
        await updateGdriveUI();
      } catch (err) {
        showToast(`Failed to connect: ${err.message}`, 'error');
        gdriveConnectBtn.disabled = false;
        gdriveConnectBtn.textContent = 'Connect Google Drive';
      }
    });

    gdriveBackupBtn.addEventListener('click', async () => {
      gdriveBackupBtn.disabled = true;
      gdriveBackupBtn.textContent = 'Backing up...';
      try {
        const scripts = await getScripts();
        const result = await gdrive.backupToDrive(scripts);
        showToast('Backup complete');
        if (result.modifiedTime) gdriveLastBackup.textContent = new Date(result.modifiedTime).toLocaleString();
      } catch (err) {
        showToast(`Backup failed: ${err.message}`, 'error');
      } finally {
        gdriveBackupBtn.disabled = false;
        gdriveBackupBtn.textContent = 'Backup Now';
      }
    });

    gdriveRestoreBtn.addEventListener('click', async () => {
      const confirmed = await showConfirm('Restore from Backup', 'This will import scripts from your Google Drive backup. Existing scripts with matching IDs will be overwritten. Continue?');
      if (!confirmed) return;
      gdriveRestoreBtn.disabled = true;
      gdriveRestoreBtn.textContent = 'Restoring...';
      try {
        const scripts = await gdrive.restoreFromDrive();
        let count = 0;
        for (const script of scripts) { await saveScript(script); count++; }
        showToast(`Restored ${count} script${count !== 1 ? 's' : ''}`);
      } catch (err) {
        showToast(`Restore failed: ${err.message}`, 'error');
      } finally {
        gdriveRestoreBtn.disabled = false;
        gdriveRestoreBtn.textContent = 'Restore from Backup';
      }
    });

    gdriveDisconnectBtn.addEventListener('click', async () => {
      const confirmed = await showConfirm('Disconnect Google Drive', 'This will remove Google Drive access. Your backup on Drive will not be deleted. Continue?');
      if (!confirmed) return;
      try {
        await gdrive.signOut();
        showToast('Disconnected from Google Drive');
        await updateGdriveUI();
      } catch (err) {
        showToast(`Failed to disconnect: ${err.message}`, 'error');
      }
    });

    await updateGdriveUI();
  } catch {
    // gdrive.js not available — hide the section
    const gdriveSection = document.querySelector('.section-card:has(#gdrive-connect-btn)');
    if (gdriveSection) gdriveSection.hidden = true;
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

loadForm();
initGdrive();
