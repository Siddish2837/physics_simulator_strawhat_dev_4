// ============================================================
// ai.js — LLM request handler via backend proxy at /api/ai
// ============================================================
// Browser-safe. Uses fetch to POST to our Node.js proxy.
// The proxy hides the Gemini API key and handles rate limiting.
// ============================================================

import { MASTER_PROMPT } from './prompt.js';

/** Configurable proxy URL — change this if your backend runs elsewhere */
let PROXY_URL = 'http://localhost:3000/api/ai';

/**
 * Set a custom proxy URL (e.g., for production deployments).
 * @param {string} url
 */
export function setProxyURL(url) { PROXY_URL = url; }

/**
 * Send a natural-language physics problem to the backend proxy,
 * which forwards it to the Gemini API, and return the extracted
 * physics parameters as a clean JS object.
 *
 * @param {string} problemText — The user's physics problem in plain English.
 * @returns {Promise<object>}  — Parsed JSON matching the master schema.
 */
export async function extractParameters(problemText) {
    if (!problemText || typeof problemText !== 'string' || !problemText.trim()) {
        throw new Error('problemText must be a non-empty string.');
    }

    // Build the Gemini-compatible request body
    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        text: `${MASTER_PROMPT}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nUSER PROBLEM\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${problemText.trim()}`
                    }
                ]
            }
        ],
        generationConfig: {
            temperature: 0.1,
            topP: 0.95,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json'
        }
    };

    // ---- POST to backend proxy ----
    let response;
    try {
        response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
    } catch (networkError) {
        throw new Error(
            `Cannot reach backend proxy at ${PROXY_URL}. ` +
            `Make sure the server is running (cd server && node server.js).\n` +
            `Error: ${networkError.message}`
        );
    }

    if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error');
        throw new Error(`Backend proxy error (HTTP ${response.status}): ${errorBody}`);
    }

    // ---- Parse the proxy response (Gemini envelope) ----
    let result;
    try {
        result = await response.json();
    } catch (err) {
        throw new Error(`Failed to parse proxy response as JSON: ${err.message}`);
    }

    // ---- Extract raw text from Gemini response ----
    const raw = extractRawText(result);
    if (!raw) {
        throw new Error('Gemini returned an empty or unrecognizable response.');
    }

    // ---- Strip formatting noise & parse physics JSON ----
    const cleaned = stripNoise(raw);

    let params;
    try {
        params = JSON.parse(cleaned);
    } catch (parseError) {
        throw new Error(
            `Failed to parse LLM output as JSON.\n` +
            `Error: ${parseError.message}\n` +
            `Raw (first 500 chars): ${cleaned.substring(0, 500)}`
        );
    }

    if (typeof params !== 'object' || params === null || Array.isArray(params)) {
        throw new Error('LLM output is not a JSON object.');
    }

    return params;
}

// --------------- Helpers ---------------

/**
 * Navigate the Gemini response envelope:
 * result.candidates[0].content.parts[0].text
 */
function extractRawText(result) {
    try {
        const parts = result?.candidates?.[0]?.content?.parts;
        if (!parts || parts.length === 0) return null;
        return parts
            .filter(p => typeof p.text === 'string')
            .map(p => p.text)
            .join('')
            .trim() || null;
    } catch {
        return null;
    }
}

/**
 * Strip backticks, markdown fences, and stray quotes from LLM output.
 */
function stripNoise(text) {
    let s = text.trim();
    // Remove ```json ... ``` or ``` ... ```
    s = s.replace(/^```(?:json)?\s*\n?/i, '');
    s = s.replace(/\n?\s*```\s*$/i, '');
    return s.trim();
}
