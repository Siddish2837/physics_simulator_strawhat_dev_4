// ============================================================
// logger.js — Lightweight request logger
// ============================================================

/**
 * Log an incoming request with timestamp, IP, payload size,
 * response status, and retry count.
 */
export function logRequest({ ip, method, path, bodySize, status, retries, duration }) {
    const timestamp = new Date().toISOString();
    const parts = [
        `[${timestamp}]`,
        `${method} ${path}`,
        `IP=${ip}`,
        `body=${bodySize}B`,
        `status=${status}`,
        retries > 0 ? `retries=${retries}` : null,
        duration != null ? `${duration}ms` : null
    ].filter(Boolean);

    console.log(parts.join(' | '));
}

/**
 * Express middleware that logs every request after it completes.
 */
export function requestLogger() {
    return (req, res, next) => {
        const start = Date.now();

        // Capture original end to log after response is sent
        const originalEnd = res.end;
        res.end = function (...args) {
            const duration = Date.now() - start;
            logRequest({
                ip: req.ip || req.connection?.remoteAddress || 'unknown',
                method: req.method,
                path: req.path,
                bodySize: req.headers['content-length'] || 0,
                status: res.statusCode,
                retries: res.locals?.retries || 0,
                duration
            });
            originalEnd.apply(this, args);
        };

        next();
    };
}
