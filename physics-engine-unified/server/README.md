# Physics AI Proxy Server

A secure Express backend providing Gemini-powered physics parameter extraction, robust error handling, and Clerk authentication.

## 🛠️ Setup

```bash
cd server
npm install
cp .env.example .env
# Fill in Gemini and Clerk keys
```

## 🚀 Run

```bash
npm run dev
```

Output: `🚀 Backend server running on http://localhost:3000`

## 📡 API Endpoints

### POST /api/parse
Extracts physics parameters from natural language descriptions. Requires Clerk authentication.

**Request:**
```json
{ "text": "A 2kg ball moves at 5m/s and hits a stationary block." }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "topic": "collision",
    "collision": { "masses": [2, 1], "velocities_before": [5, 0] }
  }
}
```

### POST /api/ai
Direct proxy to Gemini API (deprecated in favor of `/api/parse`).

### GET /health
Returns server status: `{ "status": "ok", "timestamp": "..." }`

## 🛡️ Protection & Stability

| Feature | Details |
|---------|---------|
| **Auth** | Secure route protection via `@clerk/express`. |
| **Stability** | Global error handlers prevent process exit on failure. |
| **Timeout** | 20s request timeouts per attempt to prevent hanging. |
| **Rate Limit** | 10 requests / 30 seconds per IP. |
| **Retry** | Auto-retries Gemini 429s with exponential backoff. |
| **Logger** | Detailed request logging including duration and retries. |

## 📂 File Structure

```
server/
  server.js        ← Entry point with error middleware
  aiProxy.js       ← Gemini proxy + retry + timeout logic
  parser.js        ← Physics parameter normalization
  prompt.js        ← Master physics extraction prompt
  routes/          ← Modular API routes
  logger.js        ← Request logging middleware
  .env             ← Keys (git-ignored)
```
