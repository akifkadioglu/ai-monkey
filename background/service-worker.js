// Service Worker - Central Orchestrator for AI Monkey

// We use dynamic imports since this is a module service worker

// ---------------------------------------------------------------------------
// Dev auto-reload: connects to dev-reload.js server and reloads on changes
// Only active during development (fails silently in production)
// ---------------------------------------------------------------------------
try {
  const devReload = new EventSource('http://localhost:9234/events');
  devReload.onmessage = (event) => {
    if (event.data === 'reload') {
      console.log('[AI Monkey] Dev reload triggered');
      chrome.runtime.reload();
    }
  };
  devReload.onerror = () => {
    devReload.close(); // Dev server not running, stop trying
  };
} catch { /* Dev server not available — ignore */ }

// Listen for tab updates to run matching scripts
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only act on complete page loads (or document-start for those scripts)
  if (changeInfo.status !== 'complete') return;
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return;

  const { getEnabledScripts } = await import('../lib/storage.js');
  const { findMatchingScripts } = await import('../lib/matcher.js');

  const scripts = await getEnabledScripts();
  const matching = findMatchingScripts(tab.url, scripts);

  if (matching.length === 0) return;

  // Update badge with count of matching scripts
  chrome.action.setBadgeText({ text: String(matching.length), tabId });
  chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });

  // Execute each matching script (check conditions first)
  for (const script of matching) {
    try {
      // Check conditions if any are defined
      const conditions = script.metadata?.condition || [];
      if (conditions.length > 0) {
        const conditionsMet = await checkConditions(tabId, conditions);
        if (!conditionsMet) {
          console.log(`[AI Monkey] Skipping "${script.metadata?.name}" - conditions not met`);
          continue;
        }
      }
      await executeScript(tabId, tab.url, script);
    } catch (err) {
      console.error(`[AI Monkey] Error executing "${script.name}":`, err);
      const { addLog } = await import('../lib/storage.js');
      await addLog({
        scriptId: script.id,
        scriptName: script.name,
        url: tab.url,
        status: 'error',
        error: err.message,
        tokensUsed: null,
        generatedCode: null
      });
    }
  }
});

/**
 * Check if page conditions are met by injecting a check script.
 * Conditions are plain-English descriptions of elements that should exist.
 * We check for common patterns (cookie banners, sidebars, modals, etc.)
 * by looking for matching selectors and text content.
 */
async function checkConditions(tabId, conditions) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: (conditionList) => {
      // Map common English descriptions to selector/text heuristics
      const checks = conditionList.map((condition) => {
        const cond = condition.toLowerCase();

        // Check for common element descriptions
        const heuristics = [
          { keywords: ['cookie', 'consent', 'banner'], selectors: ['[class*="cookie"]', '[id*="cookie"]', '[class*="consent"]', '[id*="consent"]', '[class*="gdpr"]', '[id*="gdpr"]', '[class*="cookie-banner"]'] },
          { keywords: ['sidebar', 'side bar', 'side-bar'], selectors: ['[class*="sidebar"]', '[id*="sidebar"]', 'aside', 'nav[class*="side"]'] },
          { keywords: ['modal', 'dialog', 'popup', 'pop-up'], selectors: ['[class*="modal"]', '[id*="modal"]', '[role="dialog"]', '[class*="popup"]', '[class*="overlay"]'] },
          { keywords: ['login', 'sign in', 'signin'], selectors: ['[class*="login"]', '[id*="login"]', 'form[action*="login"]', 'form[action*="signin"]', '[class*="sign-in"]'] },
          { keywords: ['ad', 'advertisement', 'ads'], selectors: ['[class*="ad-"]', '[class*="advert"]', '[id*="ad-"]', '[class*="sponsored"]', 'ins.adsbygoogle'] },
          { keywords: ['header', 'nav', 'navigation'], selectors: ['header', 'nav', '[role="navigation"]', '[class*="header"]'] },
          { keywords: ['footer'], selectors: ['footer', '[class*="footer"]', '[role="contentinfo"]'] },
          { keywords: ['video', 'player'], selectors: ['video', '[class*="player"]', '[class*="video"]', 'iframe[src*="youtube"]'] },
          { keywords: ['comment', 'comments'], selectors: ['[class*="comment"]', '[id*="comment"]', '#comments'] },
          { keywords: ['notification', 'alert'], selectors: ['[class*="notification"]', '[class*="alert"]', '[role="alert"]'] },
        ];

        // Try heuristic matches
        for (const h of heuristics) {
          if (h.keywords.some((kw) => cond.includes(kw))) {
            for (const sel of h.selectors) {
              const el = document.querySelector(sel);
              if (el && el.offsetParent !== null) return true; // visible element found
            }
          }
        }

        // Generic text search: look for elements containing the condition text keywords
        const words = cond
          .replace(/[^a-z0-9\s]/g, '')
          .split(/\s+/)
          .filter((w) => w.length > 3);

        if (words.length > 0) {
          const allElements = document.querySelectorAll('button, a, div, span, p, h1, h2, h3, h4, h5, h6, section, [role]');
          for (const el of allElements) {
            if (el.offsetParent === null) continue; // hidden
            const text = (el.textContent || '').toLowerCase();
            const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
            const combined = text + ' ' + ariaLabel;
            if (words.every((w) => combined.includes(w))) return true;
          }
        }

        return false;
      });

      // All conditions must be met
      return checks.every(Boolean);
    },
    args: [conditions],
    world: 'MAIN'
  });

  return results?.[0]?.result === true;
}

async function executeScript(tabId, url, script) {
  const { getSettings, addLog } = await import('../lib/storage.js');
  const { getCachedResponse, setCachedResponse } = await import('../lib/llm/cache.js');
  const { buildSystemPrompt, buildUserMessage } = await import('../lib/llm/prompt-builder.js');

  const settings = await getSettings();

  if (!settings.apiKey) {
    throw new Error('No API key configured. Please set your API key in AI Monkey settings.');
  }

  let code, tokens;

  // Check cache first
  if (settings.cacheEnabled && script.cache !== 'none') {
    const cached = await getCachedResponse(script.id, script.body, url);
    if (cached) {
      code = cached.code;
      tokens = cached.tokens;
      // Inject cached code
      await injectCode(tabId, code);
      await addLog({
        scriptId: script.id, scriptName: script.name, url,
        status: 'success (cached)', tokensUsed: tokens, generatedCode: code, error: null
      });
      return;
    }
  }

  // Extract page context
  const pageContext = await extractPageContext(tabId);

  // Build prompts
  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(pageContext, script.body);

  // Call LLM
  const provider = await createProvider(settings);
  const result = await provider.generate(systemPrompt, userMessage);
  code = result.code;
  tokens = result.tokens;

  // Cache the result
  if (settings.cacheEnabled && script.cache !== 'none') {
    await setCachedResponse(script.id, script.body, url, code, tokens);
  }

  // Inject the generated code
  await injectCode(tabId, code);

  // Log success
  await addLog({
    scriptId: script.id, scriptName: script.name, url,
    status: 'success', tokensUsed: tokens, generatedCode: code, error: null
  });
}

async function extractPageContext(tabId) {
  // Inject page-context.js into the tab and get back DOM summary
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content/page-context.js'],
    world: 'ISOLATED'
  });

  // The content script returns page context via the last expression
  if (results && results[0] && results[0].result) {
    return results[0].result;
  }
  return { url: '', title: '', elements: 'Could not extract page context' };
}

async function injectCode(tabId, code) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (codeStr) => {
      try {
        eval(codeStr);
      } catch(e) {
        console.error('[AI Monkey] Execution error:', e);
      }
    },
    args: [code],
    world: 'MAIN'
  });
}

async function createProvider(settings) {
  switch (settings.provider) {
    case 'anthropic': {
      const { AnthropicProvider } = await import('../lib/llm/anthropic.js');
      return new AnthropicProvider(settings.apiKey, settings.model);
    }
    case 'google': {
      const { GoogleProvider } = await import('../lib/llm/google.js');
      return new GoogleProvider(settings.apiKey, settings.model);
    }
    case 'groq': {
      const { GroqProvider } = await import('../lib/llm/groq.js');
      return new GroqProvider(settings.apiKey, settings.model);
    }
    case 'openrouter': {
      const { OpenRouterProvider } = await import('../lib/llm/openrouter.js');
      return new OpenRouterProvider(settings.apiKey, settings.model);
    }
    default: {
      const { OpenAIProvider } = await import('../lib/llm/openai.js');
      return new OpenAIProvider(settings.apiKey, settings.model);
    }
  }
}

// Listen for messages from popup/dashboard/editor
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch(err => sendResponse({ error: err.message }));
  return true; // async response
});

async function handleMessage(message) {
  const storage = await import('../lib/storage.js');

  switch (message.type) {
    case 'RUN_SCRIPT': {
      const { tabId, scriptId } = message;
      const script = await storage.getScript(scriptId);
      if (!script) throw new Error('Script not found');
      const tab = await chrome.tabs.get(tabId);
      await executeScript(tabId, tab.url, script);
      return { success: true };
    }
    case 'GET_MATCHING_SCRIPTS': {
      const { url } = message;
      const { findMatchingScripts } = await import('../lib/matcher.js');
      const scripts = await storage.getEnabledScripts();
      return findMatchingScripts(url, scripts);
    }
    case 'RUN_ON_PAGE': {
      // Run a script body directly on a tab (for testing from editor)
      const { tabId, scriptBody } = message;
      const { getSettings } = storage;
      const settings = await getSettings();
      if (!settings.apiKey) throw new Error('No API key configured');

      const pageContext = await extractPageContext(tabId);
      const { buildSystemPrompt, buildUserMessage } = await import('../lib/llm/prompt-builder.js');
      const systemPrompt = buildSystemPrompt();
      const userMessage = buildUserMessage(pageContext, scriptBody);
      const provider = await createProvider(settings);
      const result = await provider.generate(systemPrompt, userMessage);
      await injectCode(tabId, result.code);
      return { success: true, code: result.code, tokens: result.tokens };
    }
    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}
