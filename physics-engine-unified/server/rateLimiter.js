// ============================================================
// rateLimiter.js — Express rate limiting middleware
// ============================================================

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter: max 10 requests per 30-second window per IP.
 * Returns a structured JSON error on limit breach.
 */
export const aiRateLimiter = rateLimit({
    windowMs: 30 * 1000,       // 30-second window
    max: 10,                    // max 10 requests per window
    standardHeaders: true,      // Return rate limit info in headers
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            error: 'Rate limit exceeded. Slow down.',
            retryAfter: 30
        });
    }
});
