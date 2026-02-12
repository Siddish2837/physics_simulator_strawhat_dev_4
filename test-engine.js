// ============================================================
// test-engine.js — Smoke test for parser, formula-engine, router
// ============================================================
// Run: node test-engine.js
// ============================================================

import { normalizeParams } from './parser.js';
import { attachComputedValues } from './formula-engine.js';
import { routeToSimulation, registerSimulation } from './router.js';

let passed = 0;
let failed = 0;

function assert(condition, label) {
    if (condition) {
        console.log(`  ✅ ${label}`);
        passed++;
    } else {
        console.error(`  ❌ ${label}`);
        failed++;
    }
}

function isClose(a, b, tol = 0.01) {
    return Math.abs(a - b) < tol;
}

// ───────────────────────────────────────────────
// TEST 1: normalizeParams — defaults & shape
// ───────────────────────────────────────────────
console.log('\n─── TEST 1: normalizeParams (defaults & shape) ───');
{
    const raw = { topic: 'projectile', launch_angle: '45' };
    const clean = normalizeParams(raw);

    assert(clean.gravity === 9.8, 'gravity default = 9.8');
    assert(clean.mass === 1, 'mass default = 1');
    assert(clean.initial_position.x0 === 0, 'initial_position.x0 default = 0');
    assert(clean.launch_angle === 45, 'string "45" coerced to number 45');
    assert(clean.topic === 'projectile', 'topic preserved');
    assert(typeof clean.forces === 'object', 'forces section exists');
    assert(typeof clean.energy === 'object', 'energy section exists');
    assert(typeof clean.collision === 'object', 'collision section exists');
    assert(Array.isArray(clean.collision.masses), 'collision.masses is array');
    assert(Array.isArray(clean.formulas.equations), 'formulas.equations is array');
    assert(typeof clean.formulas.calculations === 'object', 'formulas.calculations is object');
}

// ───────────────────────────────────────────────
// TEST 2: normalizeParams — invalid topic fuzzy match
// ───────────────────────────────────────────────
console.log('\n─── TEST 2: normalizeParams (topic validation) ───');
{
    const raw1 = { topic: 'Projectile Motion' };
    const clean1 = normalizeParams(raw1);
    assert(clean1.topic === 'projectile', 'fuzzy match "Projectile Motion" → "projectile"');

    const raw2 = { topic: 'xyzzy' };
    const clean2 = normalizeParams(raw2);
    assert(clean2.topic === 'linear_motion', 'unknown topic defaults to "linear_motion"');
}

// ───────────────────────────────────────────────
// TEST 3: normalizeParams — NaN / undefined cleaned
// ───────────────────────────────────────────────
console.log('\n─── TEST 3: normalizeParams (NaN/undefined cleanup) ───');
{
    const raw = { topic: 'energy', time: NaN, distance: undefined };
    const clean = normalizeParams(raw);
    assert(clean.time === null, 'NaN replaced with null');
    assert(clean.distance === null, 'undefined replaced with null');
}

// ───────────────────────────────────────────────
// TEST 4: attachComputedValues — projectile
// ───────────────────────────────────────────────
console.log('\n─── TEST 4: attachComputedValues (projectile) ───');
{
    const params = normalizeParams({
        topic: 'projectile',
        initial_velocity: { magnitude: 20, direction: 'up-right' },
        launch_angle: 45,
        launch_height: 0,
        gravity: 9.8
    });
    const result = attachComputedValues(params);

    assert(result.formulas.equations.length > 0, 'has equations');
    assert(result.formulas.calculations.range !== undefined, 'range computed');
    assert(result.formulas.calculations.max_height !== undefined, 'max_height computed');
    assert(result.formulas.calculations.time_of_flight !== undefined, 'time_of_flight computed');
    assert(isClose(result.formulas.calculations.range, 40.816, 0.1), 'range ≈ 40.82m');
    assert(isClose(result.formulas.calculations.max_height, 10.204, 0.1), 'max_height ≈ 10.2m');
}

// ───────────────────────────────────────────────
// TEST 5: attachComputedValues — waves
// ───────────────────────────────────────────────
console.log('\n─── TEST 5: attachComputedValues (waves) ───');
{
    const params = normalizeParams({
        topic: 'waves',
        waves: { frequency: 500, wavelength: 0.68 }
    });
    const result = attachComputedValues(params);

    assert(result.formulas.calculations.wave_speed !== undefined, 'wave_speed computed');
    assert(isClose(result.formulas.calculations.wave_speed, 340, 1), 'v = fλ = 500×0.68 = 340');
}

// ───────────────────────────────────────────────
// TEST 6: attachComputedValues — energy
// ───────────────────────────────────────────────
console.log('\n─── TEST 6: attachComputedValues (energy) ───');
{
    const params = normalizeParams({
        topic: 'energy',
        mass: 2,
        initial_velocity: { magnitude: 10 },
        launch_height: 5
    });
    const result = attachComputedValues(params);

    assert(isClose(result.formulas.calculations.kinetic_energy, 100, 0.1), 'KE = 0.5×2×100 = 100');
    assert(isClose(result.formulas.calculations.potential_energy_gravitational, 98, 0.1), 'PE = 2×9.8×5 = 98');
}

// ───────────────────────────────────────────────
// TEST 7: attachComputedValues — optics (Snell's law)
// ───────────────────────────────────────────────
console.log('\n─── TEST 7: attachComputedValues (optics) ───');
{
    const params = normalizeParams({
        topic: 'optics',
        optics: {
            indices: { n1: 1.0, n2: 1.5 },
            angles: { incidence: 30 }
        }
    });
    const result = attachComputedValues(params);

    assert(result.formulas.calculations.angle_of_refraction !== undefined, 'refraction angle computed');
    assert(isClose(result.formulas.calculations.angle_of_refraction, 19.47, 0.1), 'Snell: sin(θ₂) = n1·sin(30)/n2');
}

// ───────────────────────────────────────────────
// TEST 8: attachComputedValues — electricity (Ohm's law)
// ───────────────────────────────────────────────
console.log('\n─── TEST 8: attachComputedValues (electricity) ───');
{
    const params = normalizeParams({
        topic: 'electricity',
        electricity: { voltage: 12, resistance: 4 }
    });
    const result = attachComputedValues(params);

    assert(isClose(result.electricity.current, 3, 0.01), 'I = V/R = 12/4 = 3');
    assert(isClose(result.formulas.calculations.power, 36, 0.01), 'P = V²/R = 144/4 = 36');
}

// ───────────────────────────────────────────────
// TEST 9: routeToSimulation — default stubs
// ───────────────────────────────────────────────
console.log('\n─── TEST 9: routeToSimulation (default stubs) ───');
{
    const params = normalizeParams({ topic: 'projectile' });
    const result = routeToSimulation(params);
    assert(result.simulation === 'projectile', 'routed to projectile');
    assert(result.status === 'ready', 'status = ready');
}

// ───────────────────────────────────────────────
// TEST 10: registerSimulation + routeToSimulation
// ───────────────────────────────────────────────
console.log('\n─── TEST 10: registerSimulation (custom handler) ───');
{
    let called = false;
    registerSimulation('waves', (p) => {
        called = true;
        return { custom: true };
    });
    const params = normalizeParams({ topic: 'waves' });
    const result = routeToSimulation(params);
    assert(called === true, 'custom handler was invoked');
    assert(result.custom === true, 'custom handler return value received');
}

// ───────────────────────────────────────────────
// SUMMARY
// ───────────────────────────────────────────────
console.log(`\n═══════════════════════════════════════`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log(`═══════════════════════════════════════\n`);

process.exit(failed > 0 ? 1 : 0);
