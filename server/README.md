# Backend Proxy Server

Secure proxy that sits between your frontend AI engine and the Gemini API. Hides the API key, prevents 429 errors with rate limiting and auto-retry.

## Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env and paste your Gemini API key
```

## Run

```bash
node server.js
```

Output: `🚀 Backend server running on http://localhost:3000`

## API

### POST /api/ai

Send the same payload your `ai.js` sends to Gemini:

```js
fetch('http://localhost:3000/api/ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: 'A ball is thrown at 20 m/s at 45 degrees' }] }],
    generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
  })
});
```

Returns the raw Gemini response: `{ candidates: [...] }`

### GET /health

Returns `{ status: "ok" }`

## Protection

| Feature | Details |
|---------|---------|
| API Key | Hidden in `.env`, never sent to frontend |
| Rate Limit | 10 requests / 30 seconds per IP |
| Retry | Auto-retries 429s up to 3× with exponential backoff |
| Logging | Logs timestamp, IP, body size, status, retries, duration |
| CORS | Allows localhost:5173, 5500, 3000, 8080 and file:// origins |

## File Structure

```
server/
  server.js        ← Express entry point
  aiProxy.js       ← Gemini proxy + retry logic
  rateLimiter.js   ← express-rate-limit config
  logger.js        ← Request logging middleware
  .env             ← Your API key (git-ignored)
  .env.example     ← Template
  package.json     ← Dependencies
```
