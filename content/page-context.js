// page-context.js - Extracts a compact DOM summary for AI Monkey
// Plain script (IIFE), NOT an ES module. Injected via chrome.scripting.executeScript.

(() => {
  const url = document.URL;
  const title = document.title || '';

  // Meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  const description = metaDesc ? (metaDesc.content || '').slice(0, 200) : '';

  // Semantic structure
  const semanticTags = ['header', 'nav', 'main', 'aside', 'footer', 'article', 'section'];
  const structure = [];
  for (const tag of semanticTags) {
    const els = document.querySelectorAll(tag);
    for (const el of els) {
      const id = el.id ? `#${el.id}` : '';
      const classes = el.className && typeof el.className === 'string'
        ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
        : '';
      structure.push(`<${tag}${id}${classes}>`);
      if (structure.length >= 30) break;
    }
    if (structure.length >= 30) break;
  }

  // Headings
  const headings = [];
  const headingEls = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  for (let i = 0; i < Math.min(headingEls.length, 20); i++) {
    const el = headingEls[i];
    const text = (el.textContent || '').trim().slice(0, 80);
    if (text) {
      headings.push(`${el.tagName.toLowerCase()}: ${text}`);
    }
  }

  // Elements with meaningful IDs
  const ids = [];
  const allWithId = document.querySelectorAll('[id]');
  for (let i = 0; i < allWithId.length && ids.length < 50; i++) {
    const id = allWithId[i].id;
    // Skip auto-generated or framework IDs (very short, or containing colons/hashes)
    if (id && id.length > 2 && !id.includes(':') && !/^\d+$/.test(id)) {
      ids.push(id);
    }
  }

  // ARIA labels
  const ariaLabels = [];
  const ariaEls = document.querySelectorAll('[aria-label]');
  for (let i = 0; i < Math.min(ariaEls.length, 30); i++) {
    const label = (ariaEls[i].getAttribute('aria-label') || '').trim().slice(0, 60);
    if (label) {
      ariaLabels.push(label);
    }
  }

  // Interactive element counts
  const counts = {
    buttons: document.querySelectorAll('button, [role="button"]').length,
    links: document.querySelectorAll('a[href]').length,
    inputs: document.querySelectorAll('input, textarea, select').length,
    forms: document.querySelectorAll('form').length
  };

  return {
    url,
    title,
    description,
    structure: structure.join(', '),
    headings: headings.join('; '),
    ids: ids.slice(0, 50).join(', '),
    ariaLabels: ariaLabels.join(', '),
    counts
  };
})();
