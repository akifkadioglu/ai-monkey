/**
 * share.js - Script sharing via URL for AI Monkey
 *
 * Encodes a script into a compact URL fragment that can be shared.
 * Recipients open the link to preview and install the script.
 *
 * Format: editor/editor.html?install=<base64url-encoded JSON>
 *
 * The payload is a minimal subset of the script (no id, timestamps, etc.)
 * to keep the URL as short as possible.
 */

/**
 * Encode a script into a shareable URL.
 * @param {Object} script - The full script object.
 * @returns {string} The full extension URL for sharing.
 */
function encodeShareUrl(script) {
  const payload = {
    n: script.metadata?.name || '',
    d: script.metadata?.description || '',
    m: script.metadata?.match || [],
    e: script.metadata?.exclude || [],
    r: script.metadata?.runAt || 'document-idle',
    c: script.metadata?.cache || 'auto',
    v: script.metadata?.version || '1.0',
    b: script.body || ''
  };

  const json = JSON.stringify(payload);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  // Make URL-safe base64
  const urlSafe = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return urlSafe;
}

/**
 * Decode a share payload from a URL-safe base64 string.
 * @param {string} encoded - The base64url-encoded string.
 * @returns {Object} A script-like object ready to be saved.
 */
function decodeSharePayload(encoded) {
  // Restore standard base64
  let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding
  while (b64.length % 4) b64 += '=';

  const json = decodeURIComponent(escape(atob(b64)));
  const payload = JSON.parse(json);

  return {
    metadata: {
      name: payload.n || 'Shared Script',
      description: payload.d || '',
      match: payload.m || [],
      exclude: payload.e || [],
      runAt: payload.r || 'document-idle',
      cache: payload.c || 'auto',
      version: payload.v || '1.0'
    },
    body: payload.b || '',
    enabled: true
  };
}

/**
 * Generate a copyable share link for a script.
 * @param {Object} script - The script to share.
 * @returns {string} The full chrome-extension:// URL (only works for extension pages).
 */
function generateShareFragment(script) {
  return encodeShareUrl(script);
}

export { encodeShareUrl, decodeSharePayload, generateShareFragment };
