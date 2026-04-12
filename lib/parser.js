/**
 * parser.js - AIMonkey metadata header parser
 *
 * Parses and serializes the AIMonkey metadata block:
 *
 *   // ==AIMonkey==
 *   // @name        Script Name
 *   // @match       YouTube
 *   // @match       Reddit and Hacker News
 *   // ==/AIMonkey==
 *
 *   English instructions here...
 */

// Regex that captures the full metadata block (including delimiters)
const HEADER_RE = /\/\/\s*==AIMonkey==\s*\n([\s\S]*?)\/\/\s*==\/AIMonkey==/;

// Regex for a single metadata line: // @key   value
const META_LINE_RE = /^\/\/\s*@(\S+)\s+(.*?)\s*$/;

/**
 * Parse a raw AIMonkey script string into metadata + body.
 *
 * @param {string} rawText - The full script text including the header block.
 * @returns {{ metadata: Object, body: string }}
 *   metadata contains: name, description, match (array), exclude (array),
 *   runAt, cache, version.
 *   body contains everything after the header block, trimmed.
 */
function parseScript(rawText) {
  const metadata = {
    name: '',
    description: '',
    match: [],
    exclude: [],
    condition: [],
    runAt: 'document-idle',
    cache: 'auto',
    version: ''
  };

  const headerMatch = HEADER_RE.exec(rawText);

  if (headerMatch) {
    const headerBody = headerMatch[1];
    const lines = headerBody.split('\n');

    for (const line of lines) {
      const m = META_LINE_RE.exec(line.trim());
      if (!m) continue;

      const [, key, value] = m;

      switch (key) {
        case 'name':
          metadata.name = value;
          break;
        case 'description':
          metadata.description = value;
          break;
        case 'match':
          metadata.match.push(value);
          break;
        case 'exclude':
          metadata.exclude.push(value);
          break;
        case 'condition':
          metadata.condition.push(value);
          break;
        case 'run-at':
          metadata.runAt = value;
          break;
        case 'cache':
          metadata.cache = value;
          break;
        case 'version':
          metadata.version = value;
          break;
        // Unknown keys are silently ignored
      }
    }
  }

  // Body is everything after the closing delimiter, trimmed
  let body = '';
  if (headerMatch) {
    const endIndex = headerMatch.index + headerMatch[0].length;
    body = rawText.slice(endIndex).trim();
  } else {
    // No header found -- treat entire text as body
    body = rawText.trim();
  }

  return { metadata, body };
}

/**
 * Serialize metadata and body back into the AIMonkey script format.
 *
 * @param {Object} metadata - The metadata object (name, description, match, etc.).
 * @param {string} body - The English-language instructions.
 * @returns {string} The full script text with header block.
 */
function serializeScript(metadata, body) {
  const lines = ['// ==AIMonkey=='];

  if (metadata.name) {
    lines.push(`// @name        ${metadata.name}`);
  }
  if (metadata.description) {
    lines.push(`// @description ${metadata.description}`);
  }

  // Write each match pattern on its own line
  const matches = Array.isArray(metadata.match) ? metadata.match : [metadata.match].filter(Boolean);
  for (const pattern of matches) {
    lines.push(`// @match       ${pattern}`);
  }

  // Write each exclude pattern on its own line
  const excludes = Array.isArray(metadata.exclude) ? metadata.exclude : [metadata.exclude].filter(Boolean);
  for (const pattern of excludes) {
    lines.push(`// @exclude     ${pattern}`);
  }

  // Write each condition on its own line
  const conditions = Array.isArray(metadata.condition) ? metadata.condition : [metadata.condition].filter(Boolean);
  for (const cond of conditions) {
    lines.push(`// @condition   ${cond}`);
  }

  if (metadata.runAt) {
    lines.push(`// @run-at      ${metadata.runAt}`);
  }
  if (metadata.cache) {
    lines.push(`// @cache       ${metadata.cache}`);
  }
  if (metadata.version) {
    lines.push(`// @version     ${metadata.version}`);
  }

  lines.push('// ==/AIMonkey==');
  lines.push('');

  // Append the body
  if (body) {
    lines.push(body);
  }

  return lines.join('\n');
}

/**
 * Create a new script template string with the given name and match pattern.
 *
 * @param {string} name - The script name.
 * @param {string} matchPattern - A URL match pattern (e.g. "*://example.com/*").
 * @returns {string} A ready-to-edit script template.
 */
function createTemplate(name, matchSite) {
  const metadata = {
    name: name || 'New Script',
    description: '',
    match: [matchSite || ''],
    exclude: [],
    runAt: 'document-idle',
    cache: 'auto',
    version: '1.0'
  };

  const body = 'Describe what this script should do in plain English...';

  return serializeScript(metadata, body);
}

export { parseScript, serializeScript, createTemplate };
