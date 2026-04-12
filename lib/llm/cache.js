/**
 * cache.js - Hash-based LLM response cache for AI Monkey
 *
 * Caches generated code keyed by a hash of script identity and URL,
 * avoiding redundant LLM calls for identical inputs.
 */

import { getCacheEntry, setCacheEntry } from '../storage.js';

/**
 * Simple string hash function (djb2 variant).
 * Produces a deterministic numeric hash from any string input.
 *
 * @param {string} str - The string to hash.
 * @returns {string} A hex-encoded hash string.
 */
function simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    // hash * 33 + charCode
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  // Convert to unsigned 32-bit then to hex for a compact key
  return (hash >>> 0).toString(16);
}

/**
 * Generate a cache key from the script identity and URL.
 *
 * @param {string} scriptId - Unique script identifier.
 * @param {string} scriptBody - The English instruction / script body text.
 * @param {string} url - The page URL the script targets.
 * @returns {string} A hex hash string suitable as a cache key.
 */
export function generateCacheKey(scriptId, scriptBody, url) {
  const raw = `${scriptId}::${scriptBody}::${url}`;
  return simpleHash(raw);
}

/**
 * Retrieve a cached LLM response for the given script and URL.
 *
 * @param {string} scriptId - Unique script identifier.
 * @param {string} scriptBody - The English instruction / script body text.
 * @param {string} url - The page URL the script targets.
 * @returns {Promise<{ code: string, tokens: { input: number, output: number } } | null>}
 *   The cached response, or null if not found.
 */
export async function getCachedResponse(scriptId, scriptBody, url) {
  const key = generateCacheKey(scriptId, scriptBody, url);
  const entry = await getCacheEntry(key);

  if (!entry || !entry.value) {
    return null;
  }

  return entry.value;
}

/**
 * Store an LLM response in the cache.
 *
 * @param {string} scriptId - Unique script identifier.
 * @param {string} scriptBody - The English instruction / script body text.
 * @param {string} url - The page URL the script targets.
 * @param {string} code - The generated JavaScript code.
 * @param {{ input: number, output: number }} tokens - Token usage from the LLM call.
 */
export async function setCachedResponse(scriptId, scriptBody, url, code, tokens) {
  const key = generateCacheKey(scriptId, scriptBody, url);
  await setCacheEntry(key, { code, tokens });
}
