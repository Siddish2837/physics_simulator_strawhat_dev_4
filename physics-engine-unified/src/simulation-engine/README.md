# Simulation Engine

Modular physics simulation engine that visualizes AI-extracted parameters on HTML5 Canvas.

## Setup

```html
<link rel="stylesheet" href="simulation-engine/ui-overlay.css">
<canvas id="simCanvas" width="900" height="600"></canvas>
<script type="module">
  import { initSimulation, load } from './simulation-engine/simulation-core.js';
  import { simulateProjectile }   from './simulation-engine/projectile-sim.js';
  import { initTooltip }          from './simulation-engine/tooltip.js';

  const { canvas } = initSimulation('simCanvas');
  initTooltip(canvas, () => []); // pass getObjects()

  // Load a simulation with AI Engine output:
  load(simulateProjectile, aiEngineParams);
</script>
```

## Full Pipeline Integration

```js
import { extractParameters }    from './ai-engine/ai.js';
import { normalizeParams }      from './ai-engine/parser.js';
import { attachComputedValues } from './ai-engine/formula-engine.js';
import { initSimulation, load, getObjects } from './simulation-engine/simulation-core.js';
import { initTooltip }          from './simulation-engine/tooltip.js';
// Import simulations
import { simulateProjectile }   from './simulation-engine/projectile-sim.js';

// Setup canvas + tooltips
const { canvas } = initSimulation('simCanvas');
initTooltip(canvas, getObjects);

// AI → Simulate
const raw   = await extractParameters('A ball is thrown at 20 m/s at 45 degrees');
const clean = normalizeParams(raw);
const final = attachComputedValues(clean);
load(simulateProjectile, final);
```

## Modules

| File | Export | Visualizes |
|------|--------|------------|
| `simulation-core.js` | `initSimulation`, `load`, `start`, `stop`, `updateParams`, `reset` | Canvas + animation loop |
| `motion-sim.js` | `simulateLinearMotion` | Dot + velocity/acceleration arrows |
| `projectile-sim.js` | `simulateProjectile` | Parabolic trajectory + vectors |
| `circular-sim.js` | `simulateCircularMotion` | Rotating dot + centripetal arrow |
| `waves-sim.js` | `simulateWave` | Animated waveform |
| `optics-sim.js` | `simulateOptics` | Ray diagrams / lens diagrams |
| `energy-sim.js` | `simulateEnergy` | KE/PE/Total bar charts |
| `collisions-sim.js` | `simulateCollisions` | Elastic/inelastic collisions |
| `fields-sim.js` | `simulateFields` | Electric/magnetic field lines |
| `tooltip.js` | `initTooltip`, `destroyTooltip` | Hover formula popup |

## Controls

```js
import { start, stop, reset, updateParams } from './simulation-engine/simulation-core.js';

stop();                     // Pause
start();                    // Resume
reset();                    // Reset to initial state
updateParams(newParams);    // Real-time "what-if" update
```

## Topic Routing

```js
const SIM_MAP = {
  linear_motion:   simulateLinearMotion,
  projectile:      simulateProjectile,
  circular_motion: simulateCircularMotion,
  waves:           simulateWave,
  optics:          simulateOptics,
  energy:          simulateEnergy,
  collision:       simulateCollisions,
  electricity:     simulateFields,
  magnetism:       simulateFields
};

const simFn = SIM_MAP[params.topic];
if (simFn) load(simFn, params);
```
