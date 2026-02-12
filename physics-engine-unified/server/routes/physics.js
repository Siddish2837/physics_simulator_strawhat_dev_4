// ============================================================
// server/routes/physics.js — Physics parsing endpoint
// ============================================================

import express from 'express';
import { handleAIRequest } from '../aiProxy.js';
import { normalizeParams } from '../parser.js';
import { MASTER_PROMPT } from '../prompt.js';
import { requireAuth } from '@clerk/express';

const router = express.Router();

/**
 * POST /api/parse
 * Receives { text: "physics problem" }
 * Returns { success: true, data: { ...extracted parameters } }
 */
router.post('/parse', requireAuth(), async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ success: false, error: 'Text is required' });
    }

    try {
        // Mocking the request object for handleAIRequest logic
        // or refactoring handleAIRequest to be a utility.
        // For simplicity and speed, we implement the direct call here.

        const aiBody = {
            contents: [{
                parts: [{
                    text: `${MASTER_PROMPT}\n\nPROBLEM: ${text}`
                }]
            }],
            generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json'
            }
        };

        // Create a custom response object to capture handleAIRequest output
        // or just call handleAIRequest if we align the payloads.
        // Actually, let's keep it simple as the user requested:

        req.body = aiBody; // Redirect body for handleAIRequest

        // We override res.json to capture the data and wrap it
        const originalJson = res.json.bind(res);
        res.json = (data) => {
            if (res.headersSent) return;

            if (data.error) {
                return originalJson({ success: false, error: data.error });
            }

            // Extract the text from Gemini response
            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!responseText) {
                return originalJson({ success: false, error: 'Invalid AI response from Gemini' });
            }

            try {
                // 1. Pre-process response: Remove any invisible chars/markdown wrappers
                let cleanText = responseText.trim();

                // 2. Find potential JSON boundaries
                const startIdx = cleanText.indexOf('{');
                const endIdx = cleanText.lastIndexOf('}');

                if (startIdx === -1 || endIdx === -1) {
                    throw new Error('No JSON object boundaries ({}) found in AI response');
                }

                const jsonStr = cleanText.substring(startIdx, endIdx + 1);

                let rawJson;
                try {
                    rawJson = JSON.parse(jsonStr);
                } catch (parseErr) {
                    console.error('[physics-route] JSON.parse failed. Content:', jsonStr);
                    // Attempt aggressive cleaning: remove common AI errors
                    const aggressiveClean = jsonStr
                        .replace(/,\s*([\]}])/g, '$1') // remove trailing commas
                        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // quote unquoted keys
                        .replace(/'/g, '"'); // replace single with double quotes

                    try {
                        rawJson = JSON.parse(aggressiveClean);
                    } catch (retryErr) {
                        throw new Error(`Invalid JSON format: ${parseErr.message}`);
                    }
                }

                const normalized = normalizeParams(rawJson);
                return originalJson({ success: true, data: normalized });
            } catch (e) {
                console.error('[physics-route] Handling Error:', e);
                return originalJson({
                    success: false,
                    error: e.message || 'Failed to parse AI JSON',
                    diagnostic: {
                        snippet: responseText.substring(0, 100),
                        full_length: responseText.length
                    }
                });
            }
        };

        await handleAIRequest(req, res);

    } catch (error) {
        console.error('[physics-route] Error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
