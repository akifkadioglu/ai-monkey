/**
 * provider.js - Base LLM provider class for AI Monkey
 *
 * All LLM providers (OpenAI, Anthropic, etc.) extend this class
 * and implement the generate() method.
 */

export class LLMProvider {
  /**
   * @param {string} apiKey - The API key for the provider.
   * @param {string} model - The model identifier (e.g. "gpt-4o", "claude-sonnet-4-20250514").
   */
  constructor(apiKey, model) {
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Generate code from a system prompt and user message.
   * Subclasses must override this method.
   *
   * @param {string} systemPrompt - The system-level instructions.
   * @param {string} userMessage - The user-level message with page context and instruction.
   * @returns {Promise<{ code: string, tokens: { input: number, output: number }, model: string }>}
   */
  async generate(systemPrompt, userMessage) {
    throw new Error('Not implemented');
  }
}
