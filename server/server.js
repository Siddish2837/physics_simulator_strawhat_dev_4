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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Middleware ----

// Serve frontend files from project root (parent of server/)
app.use(express.static(path.join(__dirname, '..')));

app.use(express.json({ limit: '1mb' }));

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5500',
        'http://localhost:3000',
        'http://localhost:8080',
        'http://127.0.0.1:5500',
        'http://127.0.0.1:8080',
        'null'  // allows file:// origins (local HTML files)
    ],
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(requestLogger());

// ---- Routes ----

app.post('/api/ai', aiRateLimiter, handleAIRequest);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- Start ----

app.listen(PORT, () => {
    console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`   POST /api/ai  → Gemini proxy`);
    console.log(`   GET  /health  → Health check`);
    console.log(`   Demo: http://localhost:${PORT}/demo.html\n`);
});
