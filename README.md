# Physics Simulation Visualizer ⚛️

An interactive, premium physics simulation platform built with React, Vite, and the Canvas API. This visualizer transforms natural language problems into physically accurate, real-time 2D simulations using AI.

---

## ✨ Features

### 1. High-Fidelity Physics Engines
*   **Premium 2D Collisions**: Impulse-based resolution with conservation of momentum and energy. Supports elastic/inelastic modes, penetration correction, and real-time KE/Momentum analytics.
*   **Advanced Optics**: Converging/diverging lenses and mirrors with ray-tracing, stable unit scaling (m/cm), and virtual/real image calculation.
*   **Kinematics (1D/2D)**: Projectile motion with air resistance, parabolic trajectories, and impact detection.
*   **Dynamics & Forces**: Inclined plane simulations with static/kinetic friction, tension, and net force vectors.
*   **Oscillations & Waves**: SHM with spring-mass systems, damping effects, and transverse wave propagation.
*   **Electromagnetism**: Charge behavior in uniform electric/magnetic fields, Lorentz force visualization, and cyclotron motion.

### 2. AI-Powered Extraction
*   **Natural Language Processing**: powered by Gemini, the system extracts mass, velocity, gravity, and topic-specific constants from raw text.
*   **Intelligent Presets**: 20+ pre-configured scenarios across all major physics domains.

### 3. Modern Engineering UI
*   **Real-time HUD**: Dynamic data display showing velocities, energy states, and collision counts.
*   **Interactive Controls**: Floating play/pause/reset buttons, zoom controls, and live parameter sliders.
*   **Visual Polish**: Neon aesthetics, motion trails, vector arrows, and glassmorphic panels.

---
## Tech Stack

Our AI Physics Simulation Platform is built using a modular full-stack architecture combining AI, physics computation, and modern frontend technologies.

🖥️ Frontend (Physics Engine + UI)

React (App.jsx) – Core UI framework for building interactive components

Vite – Fast frontend build tool and development server

JavaScript (ES Modules) – Modular and scalable code structure

HTML5 Canvas – Real-time physics rendering and animation

CSS3 – Modern responsive UI styling

Clerk – User authentication and session management

⚙️ Backend (AI Processing Server)

Node.js – JavaScript runtime environment

Express.js – Lightweight REST API framework

dotenv – Secure environment variable management

CORS – Cross-origin resource sharing middleware

Rate Limiter (express-rate-limit) – Prevents API abuse and 429 errors

Custom AI Proxy Layer – Handles secure communication with AI provider

🧠 AI Layer

LLM API (Gemini / OpenAI) – Natural language understanding

Physics parameter extraction

Motion type classification

Structured JSON generation

🧮 Physics Simulation Engine

Custom-built Impulse-Based Collision Engine

Elastic & Inelastic collision support

Formula-based computation module

JSON-driven simulation initialization

Modular motion handlers:

Projectile Motion

Circular Motion

Linear Motion

Collision Dynamics

🔐 Authentication

Clerk

Secure login/signup

Session management

Protected routes

📡 Communication Layer

REST API (POST /api/parse)

JSON-based request/response system

Frontend ↔ Backend integration via fetch()

🛠 Development Tools

Git & GitHub – Version control

npm – Package management

VS Code – Development environment

## 🛠️ Step-by-Step Installation

Follow these steps to get the environment running locally:

### 1. Clone the Repository
```bash
git clone https://github.com/Siddish2837/vibe_coding_backend.git
cd vibe_coding_backend
```

### 2. Backend Setup (Server)
The backend handles AI processing and requires an API key.
```bash
cd server
npm install
```
*   Create a `.env` file in the `server/` directory:
    ```env
    API_KEY=your_gemini_api_key
    CLERK_SECRET_KEY=your_clerk_secret_key
    CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
    PORT=3000
    ```
*   Start the server:
    ```bash
    npm run dev
    ```

### 3. Frontend Setup
```bash
cd ..
npm install
```
*   Create a `.env` file in the root directory:
    ```env
    VITE_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
    ```
*   Start the frontend:
    ```bash
    npm run dev
    ```

---

## 🚀 How to Use

1.  **Sign In**: Authenticate using the Clerk-powered login.
2.  **Select a Topic**: Use the dropdown to choose your physics domain (e.g., Collisions).
3.  **Describe a Problem**: Type a scenario like: *"A 5kg ball moving at 10m/s hits a 2kg ball at rest elastically"* or click **Load Example**.
4.  **Visualize**: Click **Update Simulation** to see the AI generate the world.
5.  **Interact**: Use sliders to tweak parameters in real-time without stopping the clock.

---

## 📂 Architecture

*   `server/`: Express backend with global error handling and request timeouts (20s).
*   `src/simulation-engine/`: Modular physics simulations (Collisions, Optics, Incline, etc.).
*   `src/simulation-engine/simulation-core.js`: Core math and rendering primitives.
*   `src/components/RightPanel.jsx`: Main UI/Canvas bridge.

---
## DEMO

https://drive.google.com/file/d/1lSBtM7gkFTD3asRtdI30DJ3GRy0BoZqb/view?usp=drivesdk

---

## 🧑‍💻 Team: Strawhat Devs
*   **Karthikeya**
*   **Sai Charan**
*   **Phani**
*   **Siddish.K**
