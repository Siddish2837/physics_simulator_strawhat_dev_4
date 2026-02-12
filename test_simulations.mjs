
import { simulateEnergy } from './simulation-engine/energy-sim.js';
import { simulateCollisions } from './simulation-engine/collisions-sim.js';
import { simulateFields } from './simulation-engine/fields-sim.js';
import { simulateMagnetismAdvanced } from './simulation-engine/magnetism-advanced-sim.js';
import { getCamera } from './simulation-engine/simulation-core.js';

// Mock canvas/ctx
const mockCanvas = { width: 900, height: 600 };
const mockCtx = {
    save: () => { }, restore: () => { },
    beginPath: () => { }, closePath: () => { },
    moveTo: () => { }, lineTo: () => { },
    arc: () => { }, fill: () => { }, stroke: () => { },
    fillRect: () => { }, fillText: () => { },
    createLinearGradient: () => ({ addColorStop: () => { } }),
    createRadialGradient: () => ({ addColorStop: () => { } }),
    setLineDash: () => { },
    measureText: () => ({ width: 0 }),
    transform: () => { }, setTransform: () => { },
    translate: () => { }, rotate: () => { }, scale: () => { },
    clip: () => { },
    drawImage: () => { },
    bezierCurveTo: () => { },
    quadraticCurveTo: () => { },
};

// Mock sim object
const simObjects = [];
const mockSim = {
    addObject: (obj) => {
        simObjects.push(obj);
    }
};

async function testSim(name, fn, params) {
    console.log(`Testing ${name}...`);
    simObjects.length = 0; // clear
    try {
        fn(params, mockSim);
        if (simObjects.length === 0) {
            console.error(`❌ ${name}: No object added.`);
            return;
        }
        const obj = simObjects[0];
        // Test update
        if (obj.update) obj.update(0.016, 1.0); // dt, t
        // Test render
        if (obj.render) obj.render(mockCtx, mockCanvas);
        console.log(`✅ ${name} passed.`);
    } catch (e) {
        console.error(`❌ ${name} failed:`, e);
    }
}

async function runTests() {
    // Energy
    await testSim('Energy', simulateEnergy, { mass: 2, height: 10 });

    // Collision
    await testSim('Collision', simulateCollisions, { collision: { type: 'elastic', masses: [2, 1], velocities_before: [4, -2] } });

    // Fields (Electric)
    await testSim('Electric Field', simulateFields, { topic: 'electricity', electricity: { charge: 5, electric_field: 100 } });

    // Fields (Magnetic - via fields-sim.js)
    await testSim('Magnetic Field (via fields-sim)', simulateFields, { topic: 'magnetism', magnetism: { magnetic_field: 0.5 } });

    // Magnetism Advanced
    await testSim('Magnetism Advanced', simulateMagnetismAdvanced, { magnetism: { magnetic_field: 0.5 }, electricity: { charge: 1.6e-19 }, mass: 9.11e-31 });

    console.log('All tests completed.');
}

runTests();
