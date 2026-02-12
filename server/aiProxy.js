// ============================================================
// aiProxy.js — Gemini API proxy with retry + exponential backoff
// ============================================================

import fetch from 'node-fetch';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-2.0-flash';
const MAX_RETRIES = 3;

/**
 * Express route handler: POST /api/ai
 *
 * Accepts the exact same payload the frontend ai.js sends,
 * forwards it to the Gemini API with the server-side API key,
 * and returns the raw Gemini response to the frontend.
 */
export async function handleAIRequest(req, res) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return res.status(500).json({
            error: 'Server misconfiguration: API_KEY is not set in .env'
        });
    }

    const body = req.body;
    if (!body || !body.contents) {
        return res.status(400).json({
            error: 'Invalid request body. Expected { contents: [{ parts: [{ text: "..." }] }] }'
        });
    }

    const url = `${GEMINI_BASE}/${MODEL}:generateContent?key=${apiKey}`;
    let lastError = null;
    let retries = 0;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const geminiRes = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            // ---- Handle rate limiting with exponential backoff ----
            if (geminiRes.status === 429 && attempt < MAX_RETRIES) {
                retries++;
                const delay = getRetryDelay(geminiRes, attempt);
                console.warn(`[aiProxy] 429 from Gemini. Retry ${attempt}/${MAX_RETRIES} in ${delay}ms...`);
                await sleep(delay);
                continue;
            }

            // ---- Non-429 error ----
            if (!geminiRes.ok) {
                const errText = await geminiRes.text().catch(() => 'Unknown Gemini error');
                res.locals.retries = retries;
                return res.status(geminiRes.status).json({
                    error: `Gemini API error (HTTP ${geminiRes.status})`,
                    detail: safeParseJSON(errText)
                });
            }

            // ---- Success: forward Gemini response as-is ----
            const data = await geminiRes.json();
            res.locals.retries = retries;
            return res.json(data);

        } catch (err) {
            lastError = err;
            retries++;
            if (attempt < MAX_RETRIES) {
                const delay = Math.pow(2, attempt) * 1000;
                console.warn(`[aiProxy] Network error. Retry ${attempt}/${MAX_RETRIES} in ${delay}ms...`);
                await sleep(delay);
            }
        }
    }

    // All retries exhausted
    res.locals.retries = retries;
    return res.status(502).json({
        error: 'Failed to reach Gemini API after multiple retries.',
        detail: lastError?.message || 'Unknown error'
    });
}

// ---- Helpers ----

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelay(response, attempt) {
    const fallback = Math.pow(2, attempt) * 1000;
    const retryAfter = response.headers?.get?.('retry-after');
    if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        if (!isNaN(seconds)) return seconds * 1000;
    }
    return fallback;
}

function safeParseJSON(text) {
    try { return JSON.parse(text); }
    catch { return text; }
}
