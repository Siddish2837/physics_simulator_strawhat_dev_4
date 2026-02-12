// ============================================================
// server.js — Express backend for Gemini API proxy
// ============================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleAIRequest } from './aiProxy.js';
import { aiRateLimiter } from './rateLimiter.js';
import { requestLogger } from './logger.js';
import { clerkMiddleware } from '@clerk/express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Middleware ----
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());
app.use(requestLogger());

// ---- Routes ----
import physicsRouter from './routes/physics.js';
app.use('/api', physicsRouter);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- Error Handling ----
app.use((err, req, res, next) => {
    console.error('[Global Error Handler]:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
});

// Prevent process exit on unhandled errors
process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

// ---- Start ----
app.listen(PORT, () => {
    console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`   POST /api/parse  → Physics parsing`);
    console.log(`   GET  /health     → Health check\n`);
});
