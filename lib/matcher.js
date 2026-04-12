/**
 * matcher.js - English-based URL matching for AI Monkey
 *
 * Instead of regex/glob patterns, users describe sites in plain English
 * like "YouTube", "All Google sites", "Reddit and Hacker News".
 *
 * The matcher extracts keywords and known site names from the description
 * and checks them against the URL's hostname and title.
 */

// ---------------------------------------------------------------------------
// Known site name → domain mappings
// ---------------------------------------------------------------------------

const SITE_DOMAINS = {
  youtube: ['youtube.com', 'youtu.be'],
  google: ['google.com', 'google.co'],
  gmail: ['mail.google.com'],
  'google docs': ['docs.google.com'],
  'google sheets': ['docs.google.com/spreadsheets'],
  'google drive': ['drive.google.com'],
  'google maps': ['maps.google.com'],
  github: ['github.com'],
  reddit: ['reddit.com', 'old.reddit.com'],
  'hacker news': ['news.ycombinator.com'],
  hackernews: ['news.ycombinator.com'],
  hn: ['news.ycombinator.com'],
  twitter: ['twitter.com', 'x.com'],
  x: ['x.com', 'twitter.com'],
  facebook: ['facebook.com', 'fb.com'],
  instagram: ['instagram.com'],
  linkedin: ['linkedin.com'],
  amazon: ['amazon.com', 'amazon.co'],
  ebay: ['ebay.com'],
  wikipedia: ['wikipedia.org'],
  stackoverflow: ['stackoverflow.com'],
  'stack overflow': ['stackoverflow.com'],
  netflix: ['netflix.com'],
  spotify: ['spotify.com'],
  twitch: ['twitch.tv'],
  discord: ['discord.com', 'discord.gg'],
  slack: ['slack.com'],
  notion: ['notion.so', 'notion.site'],
  figma: ['figma.com'],
  medium: ['medium.com'],
  substack: ['substack.com'],
  pinterest: ['pinterest.com'],
  tumblr: ['tumblr.com'],
  tiktok: ['tiktok.com'],
  whatsapp: ['web.whatsapp.com', 'whatsapp.com'],
  telegram: ['web.telegram.org', 'telegram.org'],
  chatgpt: ['chat.openai.com', 'chatgpt.com'],
  claude: ['claude.ai'],
  bing: ['bing.com'],
  yahoo: ['yahoo.com'],
  duckduckgo: ['duckduckgo.com'],
  nytimes: ['nytimes.com'],
  'new york times': ['nytimes.com'],
  cnn: ['cnn.com'],
  bbc: ['bbc.com', 'bbc.co.uk'],
  verge: ['theverge.com'],
  'the verge': ['theverge.com'],
  techcrunch: ['techcrunch.com'],
  producthunt: ['producthunt.com'],
  'product hunt': ['producthunt.com'],
  dribbble: ['dribbble.com'],
  behance: ['behance.net'],
  codepen: ['codepen.io'],
  jira: ['atlassian.net'],
  trello: ['trello.com'],
  asana: ['asana.com'],
  gitlab: ['gitlab.com'],
  bitbucket: ['bitbucket.org'],
  npm: ['npmjs.com'],
  pypi: ['pypi.org'],
  'docs.python': ['docs.python.org'],
  mdn: ['developer.mozilla.org'],
  'dev.to': ['dev.to'],
  devto: ['dev.to'],
  leetcode: ['leetcode.com'],
  coursera: ['coursera.org'],
  udemy: ['udemy.com'],
  'khan academy': ['khanacademy.org'],
};

// Category keywords that match broad groups of sites
const CATEGORY_PATTERNS = {
  'all sites': () => true,
  'every site': () => true,
  'every page': () => true,
  'all pages': () => true,
  'everywhere': () => true,
  'any site': () => true,
  'any page': () => true,
  'any website': () => true,
  'all websites': () => true,
};

// ---------------------------------------------------------------------------
// Core matching logic
// ---------------------------------------------------------------------------

/**
 * Check if a URL matches an English site description.
 *
 * @param {string} url - The full page URL.
 * @param {string} description - English description like "YouTube", "Google sites", etc.
 * @returns {boolean}
 */
function matchesSiteDescription(url, description) {
  if (!url || !description) return false;

  const descLower = description.toLowerCase().trim();
  const urlLower = url.toLowerCase();

  // Check category patterns first (e.g., "all sites", "everywhere")
  for (const [phrase, matcher] of Object.entries(CATEGORY_PATTERNS)) {
    if (descLower.includes(phrase)) {
      // Only match http/https URLs, not chrome:// etc.
      if (urlLower.startsWith('http://') || urlLower.startsWith('https://')) {
        return matcher();
      }
    }
  }

  let hostname = '';
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }

  // Check known site names
  for (const [siteName, domains] of Object.entries(SITE_DOMAINS)) {
    if (descLower.includes(siteName.toLowerCase())) {
      for (const domain of domains) {
        if (hostname === domain || hostname.endsWith('.' + domain) || urlLower.includes(domain)) {
          return true;
        }
      }
    }
  }

  // Extract potential domain-like words from the description
  // e.g., "example.com" or "mysite.org" written directly
  const domainRegex = /[a-z0-9][-a-z0-9]*\.[a-z]{2,}/gi;
  const domainMatches = description.match(domainRegex) || [];
  for (const domain of domainMatches) {
    if (hostname.includes(domain.toLowerCase())) {
      return true;
    }
  }

  // Keyword-based matching: extract meaningful words from description
  // and check if they appear in the hostname
  const keywords = extractKeywords(descLower);
  for (const keyword of keywords) {
    if (keyword.length >= 3 && hostname.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Extract meaningful keywords from an English description.
 * Strips common filler words.
 */
function extractKeywords(description) {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'it', 'as', 'be', 'was', 'are',
    'all', 'any', 'each', 'every', 'both', 'few', 'more', 'most', 'some',
    'such', 'no', 'not', 'only', 'same', 'so', 'than', 'too', 'very',
    'just', 'about', 'like', 'when', 'where', 'how', 'what', 'which',
    'who', 'whom', 'this', 'that', 'these', 'those', 'my', 'your',
    'site', 'sites', 'page', 'pages', 'website', 'websites', 'web',
    'run', 'runs', 'running', 'work', 'works', 'working',
  ]);

  return description
    .replace(/[^a-z0-9\s.-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim().replace(/^\.+|\.+$/g, ''))
    .filter((w) => w && !stopWords.has(w));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Test whether a URL matches any of the given site descriptions and does NOT
 * match any of the exclude descriptions.
 *
 * @param {string} url - The URL to test.
 * @param {string[]} matchDescriptions - English descriptions to match.
 * @param {string[]} [excludeDescriptions=[]] - English descriptions to exclude.
 * @returns {boolean}
 */
function matchesUrl(url, matchDescriptions, excludeDescriptions = []) {
  if (!matchDescriptions || matchDescriptions.length === 0) return false;

  // Must match at least one description
  const matched = matchDescriptions.some((desc) => matchesSiteDescription(url, desc));
  if (!matched) return false;

  // Must NOT match any exclude description
  if (excludeDescriptions.length > 0) {
    const excluded = excludeDescriptions.some((desc) => matchesSiteDescription(url, desc));
    if (excluded) return false;
  }

  return true;
}

/**
 * Find all scripts that match a given URL.
 *
 * @param {string} url - The page URL to match against.
 * @param {Object[]} scripts - Array of script objects.
 * @returns {Object[]} Scripts whose site descriptions match the URL.
 */
function findMatchingScripts(url, scripts) {
  return scripts.filter((script) => {
    if (!script.enabled) return false;

    const matchDescriptions = script.metadata?.match || [];
    const excludeDescriptions = script.metadata?.exclude || [];

    return matchesUrl(url, matchDescriptions, excludeDescriptions);
  });
}

export { matchesUrl, matchesSiteDescription, findMatchingScripts, extractKeywords };
