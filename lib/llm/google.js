/**
 * google.js - Google Gemini provider for AI Monkey
 *
 * Sends content generation requests to the Google Gemini API and parses
 * the response into executable code with token usage metadata.
 */

import { LLMProvider } from './provider.js';

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

export class GoogleProvider extends LLMProvider {
  /**
   * Generate code via the Google Gemini API.
   *
   * @param {string} systemPrompt - System-level instructions.
   * @param {string} userMessage - User message with page context and instruction.
   * @returns {Promise<{ code: string, tokens: { input: number, output: number }, model: string }>}
   */
  async generate(systemPrompt, userMessage) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const body = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
    };

    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    } catch (err) {
      throw new Error(`Google Gemini request failed: ${err.message}`);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Google Gemini API error (${response.status}): ${errorBody}`
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new Error(`Failed to parse Google Gemini response as JSON: ${err.message}`);
    }

    // Validate expected response structure
    if (!data.candidates?.length || !data.candidates[0].content?.parts?.length) {
      throw new Error('Google Gemini response missing candidates or content parts');
    }

    const rawCode = data.candidates[0].content.parts[0].text;
    const code = stripCodeFences(rawCode);

    return {
      code,
      tokens: {
        input: data.usageMetadata?.promptTokenCount ?? 0,
        output: data.usageMetadata?.candidatesTokenCount ?? 0
      },
      model: this.model
    };
  }
}
