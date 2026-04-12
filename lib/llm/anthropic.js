/**
 * anthropic.js - Anthropic provider for AI Monkey
 *
 * Sends message requests to the Anthropic Messages API and parses
 * the response into executable code with token usage metadata.
 */

import { LLMProvider } from './provider.js';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';

/**
 * Strip markdown code fences from LLM output.
 * Handles ```javascript, ```js, and bare ``` fences.
 *
 * @param {string} text - Raw LLM response text.
 * @returns {string} Cleaned code without fences.
 */
function stripCodeFences(text) {
  const trimmed = text.trim();
  const fenceRegex = /^```(?:javascript|js)?\s*\n?([\s\S]*?)\n?\s*```$/;
  const match = trimmed.match(fenceRegex);
  return match ? match[1].trim() : trimmed;
}

export class AnthropicProvider extends LLMProvider {
  /**
   * Generate code via the Anthropic Messages API.
   *
   * @param {string} systemPrompt - System-level instructions.
   * @param {string} userMessage - User message with page context and instruction.
   * @returns {Promise<{ code: string, tokens: { input: number, output: number }, model: string }>}
   */
  async generate(systemPrompt, userMessage) {
    const body = {
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ]
    };

    let response;
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    } catch (err) {
      throw new Error(`Anthropic request failed: ${err.message}`);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Anthropic API error (${response.status}): ${errorBody}`
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new Error(`Failed to parse Anthropic response as JSON: ${err.message}`);
    }

    // Validate expected response structure
    if (!data.content?.length || !data.content[0].text) {
      throw new Error('Anthropic response missing content or text');
    }

    const rawCode = data.content[0].text;
    const code = stripCodeFences(rawCode);

    return {
      code,
      tokens: {
        input: data.usage?.input_tokens ?? 0,
        output: data.usage?.output_tokens ?? 0
      },
      model: data.model || this.model
    };
  }
}
