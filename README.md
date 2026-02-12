📘 AI Physics Simulation Platform

Complete AI-powered Physics Simulation Platform
Backend + Unified Physics Engine + Frontend App

Built by Team Strawhat Devs 🚀

🏗 Project Structure (Updated)

<img width="579" height="542" alt="image" src="https://github.com/user-attachments/assets/74e4c36d-6c43-45e4-882b-205c00d48f8f" />


🔎 Important Clarification

physics-engine-unified/src/App.jsx
✅ This is the actual frontend application.

Root index.html
⚠️ This is only for backend testing and debugging.

physics-engine-unified/index.html
✅ This is the real Vite entry for the frontend app.

🧠 What This Platform Does

Accepts physics problems as natural language

Uses AI to extract structured parameters

Identifies motion type

Runs realistic physics simulation

Supports premium collision engine

Uses Clerk for authentication

Uses AI API (Gemini/OpenAI) for parsing

⚙️ Tech Stack
Backend

Node.js

Express.js

AI API (Gemini / OpenAI)

dotenv

CORS

Rate limiter

Frontend

React (App.jsx)

Vite

Canvas-based simulation

Modular physics engine

Authentication

Clerk

Physics Engine

Custom impulse-based collision engine

Formula-based solver

JSON-driven simulation

🚀 Installation Guide (Step-by-Step – Beginner Friendly)
1️⃣ Clone the Project
git clone https://github.com/Siddish2837/vibe_coding_backend.git
cd vibe_coding_backend

2️⃣ Setup Backend
cd server
npm install


Create .env inside server/

PORT=3000
AI_API_KEY=your_ai_api_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here


Start backend:

npm start


You should see:

Server running on http://localhost:3000

3️⃣ Setup Frontend (Actual App)
cd ../physics-engine-unified
npm install


Create .env inside physics-engine-unified/

VITE_API_URL=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here


Start frontend:

npm run dev


Open:

http://localhost:5173


That loads App.jsx (actual app).

🔐 How to Add API Keys Properly

NEVER commit real keys.

Instead create:

server/.env
AI_API_KEY=sk-xxxx
CLERK_SECRET_KEY=sk_test_xxxx

physics-engine-unified/.env
VITE_API_URL=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxx


Add .env to .gitignore.

🚨 Fixing 429 Error (Rate Limit Error)

429 means:

Too many API requests

API quota exceeded

Free tier limit hit

Fix 1: Add Rate Limiter on Backend

In server.js:

import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10
});

app.use(limiter);

Fix 2: Add Retry Delay in AI Call
await new Promise(resolve => setTimeout(resolve, 1500));

Fix 3: Upgrade AI API Plan

Free tiers usually allow:

5–15 requests per minute

Fix 4: Cache Responses

Store repeated physics problems in memory:

const cache = {};
if (cache[text]) return cache[text];

🔌 API Flow

Frontend (App.jsx)
⬇
POST /api/parse
⬇
Backend (Express)
⬇
AI API
⬇
Structured JSON
⬇
Simulation Engine

🧪 Testing Backend Only

Open:

http://localhost:3000/index.html


That is only for testing backend.

NOT the real app.

🌟 Features

AI-based parameter extraction

Realistic collision simulation

Elastic & inelastic physics

JSON-based architecture

Clerk authentication

Modular simulation engine

Production-ready structure

🛠 Common Errors & Fixes
❌ 429 Too Many Requests

→ Reduce request frequency
→ Add rate limit
→ Upgrade API plan

❌ CORS Error

→ Add:

app.use(cors());

❌ Undefined API URL

→ Check VITE_API_URL in frontend .env

🧑‍💻 Team

Strawhat Devs
Second Year CSE

Karthik

Sai

Phani

Siddish
