/**
 * about.js - AI Monkey features, changelog, and roadmap page
 */

// ---------------------------------------------------------------------------
// Features data
// ---------------------------------------------------------------------------

const features = {
  core: [
    { name: 'English-language scripts', desc: 'Write what you want in plain English — AI generates the JavaScript', done: true },
    { name: 'Auto-run on matching pages', desc: 'Scripts execute automatically when you visit matching sites', done: true },
    { name: 'English site matching', desc: 'Just type "YouTube" or "Reddit" — no regex or glob patterns needed', done: true },
    { name: '70+ known site mappings', desc: 'YouTube, GitHub, Reddit, Hacker News, Twitter/X, Amazon, and more', done: true },
    { name: 'Category matching', desc: '"All sites", "everywhere", "any website" for global scripts', done: true },
    { name: 'Exclude sites in English', desc: '"Don\'t run on YouTube Shorts page" — exclusions are English too', done: true },
    { name: 'Compact DOM context extraction', desc: 'Sends page structure, headings, IDs, and ARIA labels to the LLM', done: true },
    { name: 'LLM response caching', desc: 'Same script + same site reuses generated code to save tokens', done: true },
    { name: 'Per-script cache control', desc: 'Set cache to "auto" or "none" for each script', done: true },
    { name: 'Run-at timing', desc: 'Choose document-start, document-end, or document-idle', done: true },
  ],
  llm: [
    { name: 'OpenAI support', desc: 'GPT-4o, GPT-4, or any OpenAI-compatible model', done: true },
    { name: 'Anthropic support', desc: 'Claude Sonnet, Opus, Haiku with proper browser CORS headers', done: true },
    { name: 'Bring your own API key', desc: 'No vendor lock-in — your key stays in local storage', done: true },
    { name: 'Test Connection', desc: 'Verify your API key works before saving', done: true },
    { name: 'Model selection', desc: 'Choose any model your provider supports', done: true },
  ],
  management: [
    { name: 'Dashboard', desc: 'Card-based view of all scripts with search and filter', done: true },
    { name: 'Script editor', desc: 'Form-based metadata + large English instructions textarea', done: true },
    { name: 'Enable/disable toggle', desc: 'Per-script on/off without deleting', done: true },
    { name: 'Import/export', desc: 'JSON format — bulk import and export all scripts', done: true },
    { name: 'Test Run', desc: 'Run a script on the current tab directly from the editor', done: true },
  ],
  ui: [
    { name: 'Popup', desc: 'Quick view of scripts matching the current tab with run buttons', done: true },
    { name: 'Badge count', desc: 'Extension icon shows number of matching scripts per tab', done: true },
    { name: 'Execution logs', desc: 'Full history with timestamps, status, tokens used, and generated code', done: true },
    { name: 'Log filtering', desc: 'Search by script name or URL, filter by status', done: true },
    { name: 'Dark theme', desc: 'Consistent indigo-accented dark UI across all pages', done: true },
  ],
};

// ---------------------------------------------------------------------------
// Changelog data
// ---------------------------------------------------------------------------

const changelog = [
  {
    version: 'v0.1.0',
    date: 'April 11, 2026',
    tag: 'initial',
    tagLabel: 'Initial Release',
    changes: [
      { type: 'added', text: 'English-language scripts — describe automations in plain English' },
      { type: 'added', text: 'English site matching — type "YouTube" instead of *://youtube.com/*' },
      { type: 'added', text: '70+ built-in site name-to-domain mappings' },
      { type: 'added', text: 'OpenAI and Anthropic LLM provider support' },
      { type: 'added', text: 'Auto-run scripts on matching pages via service worker' },
      { type: 'added', text: 'Compact DOM context extraction for accurate code generation' },
      { type: 'added', text: 'LLM response caching to save API tokens' },
      { type: 'added', text: 'Script dashboard with search, import, and export' },
      { type: 'added', text: 'Form-based script editor with Test Run' },
      { type: 'added', text: 'Popup with per-tab script matching and quick controls' },
      { type: 'added', text: 'Execution log viewer with filtering and code preview' },
      { type: 'added', text: 'Settings page with API key management and Test Connection' },
      { type: 'added', text: 'Dark theme across all extension pages' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Roadmap data
// ---------------------------------------------------------------------------

const roadmap = [
  {
    phase: 'Up Next',
    icon: 'next',
    emoji: '🎯',
    subtitle: 'v0.2.0 — Planned',
    items: [
      { icon: '🌐', text: 'Firefox support', desc: 'Port to Firefox with WebExtension APIs' },
      { icon: '🤖', text: 'Google Gemini provider', desc: 'Add Gemini as a third LLM option' },
      { icon: '🔄', text: 'MutationObserver auto-mode', desc: 'Automatically re-run scripts when SPAs update content' },
      { icon: '📦', text: 'Script sharing', desc: 'Share scripts via URL or import from a public library' },
      { icon: '🧩', text: 'Script variables', desc: 'User-defined variables like {{username}} that prompt on first run' },
      { icon: '⏱️', text: 'Token usage dashboard', desc: 'Track API costs per script with charts and totals' },
    ],
  },
  {
    phase: 'Later',
    icon: 'later',
    emoji: '🔮',
    subtitle: 'v0.3.0 — Exploring',
    items: [
      { icon: '💬', text: 'Conversational debugging', desc: 'Chat with AI about why a script isn\'t working' },
      { icon: '📸', text: 'Visual page context', desc: 'Send a screenshot to the LLM for better element targeting' },
      { icon: '🔗', text: 'Script chaining', desc: 'Run scripts in sequence — output of one feeds the next' },
      { icon: '📋', text: 'Script templates', desc: 'Pre-built templates for common tasks (ad blocking, dark mode, etc.)' },
      { icon: '🔒', text: 'Code review mode', desc: 'Review generated JS before it runs on sensitive sites' },
      { icon: '🌍', text: 'Multi-language instructions', desc: 'Write scripts in any language, not just English' },
    ],
  },
  {
    phase: 'Future',
    icon: 'future',
    emoji: '🚀',
    subtitle: 'Long-term vision',
    items: [
      { icon: '🏪', text: 'Script marketplace', desc: 'Community-driven script library with ratings and reviews' },
      { icon: '🤝', text: 'Team sharing', desc: 'Share script collections within organizations' },
      { icon: '📱', text: 'Mobile support', desc: 'Run scripts on mobile browsers via companion app' },
      { icon: '🧠', text: 'Local LLM support', desc: 'Run with Ollama or llama.cpp — no API key needed' },
      { icon: '⚡', text: 'Hybrid execution', desc: 'Cache common patterns as static JS, only call LLM for new pages' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Render functions
// ---------------------------------------------------------------------------

function renderFeature(feature) {
  const item = document.createElement('div');
  item.className = 'feature-item';

  const status = document.createElement('div');
  status.className = `feature-status ${feature.done ? 'done' : 'planned'}`;
  status.innerHTML = feature.done
    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
    : '?';

  const body = document.createElement('div');
  body.className = 'feature-body';

  const name = document.createElement('div');
  name.className = 'feature-name';
  name.textContent = feature.name;

  const desc = document.createElement('div');
  desc.className = 'feature-desc';
  desc.textContent = feature.desc;

  body.appendChild(name);
  body.appendChild(desc);

  item.appendChild(status);
  item.appendChild(body);

  return item;
}

function renderFeatures() {
  const groups = { core: 'features-core', llm: 'features-llm', management: 'features-management', ui: 'features-ui' };

  let total = 0;
  let done = 0;

  for (const [key, containerId] of Object.entries(groups)) {
    const container = document.getElementById(containerId);
    const items = features[key];
    for (const feature of items) {
      container.appendChild(renderFeature(feature));
      total++;
      if (feature.done) done++;
    }
  }

  // Progress summary
  const pct = Math.round((done / total) * 100);
  const summary = document.getElementById('progress-summary');
  summary.innerHTML = `
    <div class="progress-stat">
      <div class="number">${done}/${total}</div>
      <div class="label">features shipped</div>
    </div>
    <div class="progress-bar-container">
      <div class="progress-label">
        <span>Progress</span>
        <span>${pct}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${pct}%"></div>
      </div>
    </div>
  `;
}

function renderChangelog() {
  const container = document.getElementById('changelog');

  for (const entry of changelog) {
    const el = document.createElement('div');
    el.className = 'changelog-entry';

    el.innerHTML = `
      <div class="changelog-dot"></div>
      <div class="changelog-header">
        <span class="changelog-version">${entry.version}</span>
        <span class="changelog-date">${entry.date}</span>
        <span class="changelog-tag ${entry.tag}">${entry.tagLabel}</span>
      </div>
      <ul class="changelog-changes">
        ${entry.changes.map((c) => `
          <li>
            <span class="change-type ${c.type}">${c.type}</span>
            <span>${c.text}</span>
          </li>
        `).join('')}
      </ul>
    `;

    container.appendChild(el);
  }
}

function renderRoadmap() {
  const container = document.getElementById('roadmap');

  for (const phase of roadmap) {
    const el = document.createElement('div');
    el.className = 'roadmap-phase';

    el.innerHTML = `
      <div class="phase-header">
        <div class="phase-icon ${phase.icon}">${phase.emoji}</div>
        <div>
          <div class="phase-title">${phase.phase}</div>
          <div class="phase-subtitle">${phase.subtitle}</div>
        </div>
      </div>
      <div class="roadmap-items">
        ${phase.items.map((item) => `
          <div class="roadmap-item">
            <span class="roadmap-item-icon">${item.icon}</span>
            <div>
              <div class="roadmap-item-text">${item.text}</div>
              <div class="roadmap-item-desc">${item.desc}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.appendChild(el);
  }
}

// ---------------------------------------------------------------------------
// Tab switching
// ---------------------------------------------------------------------------

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
  });
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

document.getElementById('back-link').addEventListener('click', (e) => {
  e.preventDefault();
  // Try chrome extension URL, fall back to relative path
  try {
    const url = chrome.runtime.getURL('dashboard/dashboard.html');
    window.location.href = url;
  } catch {
    window.location.href = '../dashboard/dashboard.html';
  }
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

renderFeatures();
renderChangelog();
renderRoadmap();
