/**
 * openrouter.js - OpenRouter provider for AI Monkey
 *
 * Sends chat completion requests to the OpenRouter API (OpenAI-compatible)
 * and parses the response into executable code with token usage metadata.
 */

import { LLMProvider } from './provider.js';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

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

export class OpenRouterProvider extends LLMProvider {
  /**
   * Generate code via the OpenRouter chat completions API.
   *
   * @param {string} systemPrompt - System-level instructions.
   * @param {string} userMessage - User message with page context and instruction.
   * @returns {Promise<{ code: string, tokens: { input: number, output: number }, model: string }>}
   */
  async generate(systemPrompt, userMessage) {
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.2
    };

    let response;
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://aimonkey.dev',
          'X-Title': 'AI Monkey'
        },
        body: JSON.stringify(body)
      });
    } catch (err) {
      throw new Error(`OpenRouter request failed: ${err.message}`);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `OpenRouter API error (${response.status}): ${errorBody}`
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new Error(`Failed to parse OpenRouter response as JSON: ${err.message}`);
    }

    // Validate expected response structure
    if (!data.choices?.length || !data.choices[0].message?.content) {
      throw new Error('OpenRouter response missing choices or message content');
    }

    const rawCode = data.choices[0].message.content;
    const code = stripCodeFences(rawCode);

    return {
      code,
      tokens: {
        input: data.usage?.prompt_tokens ?? 0,
        output: data.usage?.completion_tokens ?? 0
      },
      model: data.model || this.model
    };
  }
}
