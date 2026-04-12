/**
 * prompt-builder.js - Prompt engineering core for AI Monkey
 *
 * Constructs the system prompt and user message that guide the LLM
 * to produce clean, executable JavaScript for browser automation.
 */

import { detectLanguage } from '../language.js';

/**
 * Build the system prompt that instructs the LLM on how to behave.
 * This prompt is provider-agnostic and used for every code generation request.
 *
 * @returns {string} The system prompt string.
 */
export function buildSystemPrompt() {
  return `You are a browser automation assistant for a Chrome extension called AI Monkey.

You receive a description of a webpage (DOM context) and an English instruction describing what the user wants to accomplish on that page.

Your task is to return ONLY valid, executable JavaScript code. Do not include any explanations, comments about what the code does, or markdown formatting. Return raw JavaScript only.

Rules:
- The code will be injected into the page's MAIN world and executed immediately.
- Use standard DOM APIs: querySelector, querySelectorAll, getElementById, getElementsByClassName, etc.
- For hiding elements, prefer setting element.style.display = 'none'.
- For removing elements, use element.remove().
- For modifying text content, use element.textContent or element.innerHTML.
- Always wrap your code in an IIFE: (function() { ... })();
- If the instruction requires monitoring for dynamic content (e.g. single-page applications that load content asynchronously), use a MutationObserver to watch for DOM changes and re-apply the modifications.
- Handle cases where target elements might not exist yet: check for null/undefined before operating on elements.
- Never use alert(), confirm(), or prompt() unless explicitly asked.
- Never navigate away from the page unless explicitly asked.
- Keep the code concise and efficient.
- IMPORTANT: The user's instructions may be written in any language. If the instructions are not in English, first understand what they mean, then generate the JavaScript code accordingly. The instructions describe what should happen on the page regardless of what language they are written in.`;
}

/**
 * Build the user message that combines page context with the English instruction.
 *
 * @param {Object} pageContext - Page context extracted by content/page-context.js.
 * @param {string} englishInstruction - The user's plain-English instruction.
 * @returns {string} The formatted user message.
 */
export function buildUserMessage(pageContext, englishInstruction) {
  let ctx = `## Page Context\n`;
  ctx += `URL: ${pageContext.url || 'unknown'}\n`;
  ctx += `Title: ${pageContext.title || 'unknown'}\n`;

  if (pageContext.description) {
    ctx += `Description: ${pageContext.description}\n`;
  }
  if (pageContext.structure) {
    ctx += `Structure: ${pageContext.structure}\n`;
  }
  if (pageContext.headings) {
    ctx += `Headings: ${pageContext.headings}\n`;
  }
  if (pageContext.ids) {
    ctx += `Element IDs: ${pageContext.ids}\n`;
  }
  if (pageContext.ariaLabels) {
    ctx += `ARIA Labels: ${pageContext.ariaLabels}\n`;
  }
  if (pageContext.counts) {
    const c = pageContext.counts;
    ctx += `Counts: ${c.buttons} buttons, ${c.links} links, ${c.inputs} inputs, ${c.forms} forms\n`;
  }

  // Detect language of the instruction
  const langResult = detectLanguage(englishInstruction);
  let instructionBlock;

  if (!langResult.isEnglish) {
    instructionBlock = `## Instruction (non-English — interpret the meaning and generate JavaScript accordingly)\n${englishInstruction}`;
  } else {
    instructionBlock = `## Instruction\n${englishInstruction}`;
  }

  return `${ctx}\n${instructionBlock}`;
}
