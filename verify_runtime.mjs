
// Import modules
import { simulateLinearMotion } from './simulation-engine/motion-sim.js';
import { simulateProjectile } from './simulation-engine/projectile-sim.js';
import { simulateCircularMotion } from './simulation-engine/circular-sim.js';
import { simulateWave } from './simulation-engine/waves-sim.js';
import { simulateOptics } from './simulation-engine/optics-sim.js';
import { simulateEnergy } from './simulation-engine/energy-sim.js';
import { simulateCollisions } from './simulation-engine/collisions-sim.js';
import { simulateFields } from './simulation-engine/fields-sim.js';
import { simulateFriction } from './simulation-engine/friction-sim.js';
import { simulateIncline } from './simulation-engine/incline-sim.js';
import { simulateFluid } from './simulation-engine/fluid-sim.js';
import { simulateLift } from './simulation-engine/lift-sim.js';
import { simulateMagnetismAdvanced } from './simulation-engine/magnetism-advanced-sim.js';
import { simulateSpring } from './simulation-engine/spring-sim.js';
import { simulatePulley } from './simulation-engine/pulley-sim.js';
import { simulateGravity } from './simulation-engine/gravity-sim.js';
import { simulateThermo } from './simulation-engine/thermo-sim.js';
import { simulateElasticity } from './simulation-engine/elasticity-sim.js';

import { simulateProjectileIncline } from './simulation-engine/projectile-incline-sim.js';
import { simulateSpringFriction } from './simulation-engine/spring-friction-sim.js';
import { simulatePulleySpring } from './simulation-engine/pulley-spring-sim.js';
import { simulateMultiPulley } from './simulation-engine/multi-pulley-sim.js';

// Mock context
const mockCanvas = { width: 900, height: 600, getBoundingClientRect: () => ({ left: 0, top: 0, width: 900, height: 600 }) };
const noop = () => { };
const mockCtx = {
    save: noop, restore: noop,
    beginPath: noop, closePath: noop,
    moveTo: noop, lineTo: noop,
    arc: noop, fill: noop, stroke: noop,
    fillRect: noop, fillText: noop, clearRect: noop, strokeRect: noop, roundRect: noop,
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    setLineDash: noop,
    measureText: () => ({ width: 10, actualBoundingBoxLeft: 0, actualBoundingBoxRight: 10, actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 2 }),
    transform: noop, setTransform: noop,
    translate: noop, rotate: noop, scale: noop,
    clip: noop,
    drawImage: noop,
    bezierCurveTo: noop,
    quadraticCurveTo: noop,
    ellipse: noop,
    setLineDash: noop,
    getLineDash: () => [],
    strokeStyle: '', fillStyle: '',
    font: '', textAlign: '', textBaseline: '',
    shadowColor: '', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
    lineCap: '', lineJoin: '', lineWidth: 0,
};

const simObjects = [];
const mockSim = {
    addObject: (obj) => {
        simObjects.push(obj);
    },
    canvas: mockCanvas,
    ctx: mockCtx,
    camera: { unitScale: 1, unitLabel: 'm', zoom: 1, x: 0, y: 0 },
    worldToScreen: (x, y) => [x, y],
    registerObject: noop,
    stop: noop,
    start: noop,
    reset: noop,
};

// Generic runner
async function runSimTest(name, fn, params) {
    simObjects.length = 0;
    try {
        console.log(`Running ${name}...`);
        fn(params, mockSim);
        if (simObjects.length > 0) {
            for (const obj of simObjects) {
                if (obj.update) obj.update(0.016, 1.0);
                if (obj.render) obj.render(mockCtx, mockCanvas);
            }
            console.log(`✅ ${name} OK`);
        } else {
            console.log(`⚠️ ${name} produced no objects (might be static render?)`);
        }
    } catch (e) {
        console.error(`❌ ${name} CRASHED:`, e);
    }
}

// Tests
(async () => {
    await runSimTest('Linear Motion', simulateLinearMotion, { object: 'Car', initial_velocity: { magnitude: 20 }, acceleration: 2 });
    await runSimTest('Projectile', simulateProjectile, { object: 'Ball', initial_velocity: { magnitude: 30 }, launch_angle: 45, initial_height: 0 });
    await runSimTest('Circular', simulateCircularMotion, { object: 'Planet', radius: 5, angular_velocity: 2 });
    await runSimTest('Wave', simulateWave, { wave: { frequency: 2, amplitude: 1, wavelength: 4 } });
    await runSimTest('Optics', simulateOptics, { optics: { type: 'lens', focal_length: 2, object_distance: 5 } });
    await runSimTest('Energy', simulateEnergy, { mass: 2, height: 10 });
    await runSimTest('Collisions', simulateCollisions, { collision: { type: 'elastic', masses: [2, 1], velocities_before: [4, -2] } });
    await runSimTest('Fields', simulateFields, { electricity: { charge: 1e-6 }, magnetism: { magnetic_field: 0.5 } });
    await runSimTest('Friction', simulateFriction, { friction: { kinetic_coefficient: 0.2 } });
    await runSimTest('Incline', simulateIncline, { incline: { angle: 30 } });
    await runSimTest('Fluid', simulateFluid, { fluid: { density: 1000, velocity1: 2, area1: 0.05, area2: 0.02 } });
    await runSimTest('Lift', simulateLift, { lift: { velocity_top: 60, velocity_bottom: 45, wing_area: 20 } });
    await runSimTest('Magnetism Advanced', simulateMagnetismAdvanced, { electricity: { charge: 1.6e-19 }, magnetism: { magnetic_field: 0.5 }, initial_velocity: { magnitude: 1e6 } });
    await runSimTest('Spring', simulateSpring, { spring: { constant: 50, displacement: 1.5 } });
    await runSimTest('Pulley', simulatePulley, { pulley: { mass1: 10, mass2: 5 } });
    await runSimTest('Gravity', simulateGravity, { gravitation: { central_mass: 1.989e30, orbital_radius: 1.496e11 } });
    await runSimTest('Thermo', simulateThermo, { thermodynamics: { temperature_initial: 300, temperature_final: 500, moles: 1 } });
    await runSimTest('Elasticity', simulateElasticity, { elasticity: { young_modulus: 2e11, area: 0.01, original_length: 2 } });

    // Composites
    await runSimTest('Projectile+Incline', simulateProjectileIncline, { initial_velocity: { magnitude: 20 }, launch_angle: 25, incline: { angle: 45 } });
    await runSimTest('Spring+Friction', simulateSpringFriction, { spring: { constant: 50 }, friction: { kinetic_coefficient: 0.15 }, mass: 2 });
    await runSimTest('Pulley+Spring', simulatePulleySpring, { pulley: { mass1: 10, mass2: 5, spring_coupled: true, spring_constant: 20 } });
    await runSimTest('Multi-Pulley', simulateMultiPulley, { multi_pulley: { config: 'block_and_tackle', num_pulleys: 4, load_mass: 100, effort_mass: 28 } });
    await runSimTest('Pulley (Multi-Mass)', simulatePulley, { pulley: { masses_left: [10, 5], masses_right: [8, 2], spring_coupled: false } });

    console.log('\n--- ALL TESTS DONE ---');
})();
