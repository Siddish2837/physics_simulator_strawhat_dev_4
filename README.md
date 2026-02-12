# AI Engine — Physics Parameter Extraction & Routing

Converts natural-language physics problems into structured, validated JSON for simulation frontends. Uses the Gemini API through a backend proxy at `/api/ai`.

## Pipeline

```
User Input → ai.js → parser.js → formula-engine.js → router.js → Simulation
               ↓          ↓              ↓                ↓
         Gemini API   Normalize    Compute formulas   Route by topic
        (via proxy)   & validate   (hover tooltips)
```

## Quick Start

```js
import { extractParameters }    from './ai-engine/ai.js';
import { normalizeParams }      from './ai-engine/parser.js';
import { attachComputedValues } from './ai-engine/formula-engine.js';
import { routeToSimulation }    from './ai-engine/router.js';

// 1. Extract parameters from natural language
const raw = await extractParameters('A ball is thrown at 20 m/s at 45 degrees');

// 2. Normalize & validate
const clean = normalizeParams(raw);

// 3. Compute formulas (for hover tooltips)
const final = attachComputedValues(clean);

// 4. Route to simulation
routeToSimulation(final);
```

## Module Reference

| Module | Export | Description |
|--------|--------|-------------|
| `prompt.js` | `MASTER_PROMPT` | LLM system prompt |
| `ai.js` | `extractParameters(text)` | POST to `/api/ai`, return parsed JSON |
| `parser.js` | `normalizeParams(json)` | Validate, fill defaults, coerce types |
| `formula-engine.js` | `attachComputedValues(params)` | Compute derived values by topic |
| `router.js` | `registerSimulation(topic, fn)` | Register custom simulation handler |
| `router.js` | `routeToSimulation(params)` | Route params to simulation by topic |

## Backend Proxy

`ai.js` sends requests to `/api/ai` (relative URL). The backend proxy:
- Hides the Gemini API key
- Handles rate limiting (429 retry)
- Forwards `{ candidates: [...] }` response to the frontend

See `/server/README.md` for backend setup.

## Example Output

**Input:** `"A 2kg ball is thrown at 25 m/s at 60 degrees"`

**Output (after full pipeline):**
```json
{
  "topic": "projectile",
  "sub_topic": "angled_launch",
  "object": "ball",
  "mass": 2,
  "gravity": 9.8,
  "launch_angle": 60,
  "initial_velocity": { "magnitude": 25, "direction": "60 degrees above horizontal" },
  "formulas": {
    "equations": ["R = (v₀²·sin(2θ)) / g", "H = (v₀²·sin²(θ)) / (2g)"],
    "calculations": {
      "velocity_x": 12.5,
      "velocity_y": 21.650635,
      "range": 55.230153,
      "max_height": 23.928571,
      "time_of_flight": 4.418497
    }
  }
}
```

## Defaults (parser.js)

| Field | Default |
|-------|---------|
| `gravity` | `9.8` |
| `mass` | `1` |
| `initial_position` | `{ x0: 0, y0: 0, z0: 0 }` |
| Invalid values | `null` |
| Numeric strings | Coerced to numbers |

## Supported Topics

`linear_motion` · `projectile` · `circular_motion` · `forces` · `energy` · `collision` · `waves` · `optics` · `electricity` · `magnetism` · `thermodynamics` · `relativity`

## Connecting Simulations

```js
import { registerSimulation } from './ai-engine/router.js';

registerSimulation('projectile', (params) => {
  myCanvas.launchProjectile(params);
});
```
