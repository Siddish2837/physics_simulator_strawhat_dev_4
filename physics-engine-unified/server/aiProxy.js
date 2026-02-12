// ============================================================
// aiProxy.js — Gemini API proxy with retry + exponential backoff
// ============================================================

import fetch from 'node-fetch';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-2.0-flash';
const MAX_RETRIES = 5;

/**
 * Express route handler: POST /api/ai
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout per attempt

        try {
            const geminiRes = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // ---- Handle rate limiting with exponential backoff + jitter ----
            if (geminiRes.status === 429 && attempt < MAX_RETRIES) {
                retries++;
                const delay = getRetryDelay(geminiRes, attempt);
                console.warn(`[aiProxy] 429 Rate Limit. Attempt ${attempt}/${MAX_RETRIES}. Retrying in ${delay}ms...`);
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

            // ---- Success ----
            const data = await geminiRes.json();
            res.locals.retries = retries;
            return res.json(data);

        } catch (err) {
            lastError = err;
            retries++;
            if (attempt < MAX_RETRIES) {
                // Network error backoff
                const delay = Math.pow(2, attempt) * 1000 + (Math.random() * 500);
                console.warn(`[aiProxy] Network error. Attempt ${attempt}/${MAX_RETRIES}. Retrying in ${Math.round(delay)}ms...`);
                await sleep(delay);
            }
        }
    }

    // All retries exhausted
    res.locals.retries = retries;
    return res.status(502).json({
        error: 'Gemini API limit reached or network failure after multiple retries. Please wait a moment and try again.',
        detail: lastError?.message || 'Rate limit exhausted'
    });
}

// ---- Helpers ----

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelay(response, attempt) {
    let delay = Math.pow(2, attempt) * 1000; // Base: 2s, 4s, 8s, 16s...

    // Check for Retry-After header
    const retryAfter = response.headers?.get?.('retry-after');
    if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        if (!isNaN(seconds)) delay = seconds * 1000;
    }

    // Add randomized jitter (0-1s) to prevent thundering herd
    return delay + (Math.random() * 1000);
}

function safeParseJSON(text) {
    try { return JSON.parse(text); }
    catch { return text; }
}
