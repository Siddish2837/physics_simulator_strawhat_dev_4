// ============================================================
// index.js — Wire all simulation modules together
// ============================================================

import { initSimulation, load, start, stop, reset, setZoom, resetView, getCanvas } from './simulation-core.js';
import { registerSimulation, routeToSimulation } from './router.js';
import { normalizeParams } from './parser.js';
import { attachComputedValues } from './formula-engine.js';

// Import all simulation functions
import { simulateLinearMotion } from './motion-sim.js';
import { simulateProjectile } from './projectile-sim.js';
import { simulateCircularMotion } from './circular-sim.js';
import { simulateEnergy } from './energy-sim.js';
import { simulateWave } from './waves-sim.js';
import { simulateCollisions } from './collisions-sim.js';
import { simulateOptics } from './optics-sim.js';
import { simulateFields } from './fields-sim.js';
import { simulateFriction } from './friction-sim.js';
import { simulateIncline } from './incline-sim.js';
import { simulateFluid } from './fluid-sim.js';
import { simulateLift } from './lift-sim.js';
import { simulateSpring } from './spring-sim.js';
import { simulatePulley } from './pulley-sim.js';
import { simulateGravity } from './gravity-sim.js';
import { simulateElasticity } from './elasticity-sim.js';
import { simulateMultiPulley } from './multi-pulley-sim.js';
import { simulateMagnetismAdvanced } from './magnetism-advanced-sim.js';
import { simulateThermo } from './thermo-sim.js';
import { simulateProjectileIncline } from './projectile-incline-sim.js';
import { simulateSpringFriction } from './spring-friction-sim.js';
import { simulatePulleySpring } from './pulley-spring-sim.js';

// Register all simulation handlers
registerSimulation('linear_motion', simulateLinearMotion);
registerSimulation('projectile', simulateProjectile);
registerSimulation('circular_motion', simulateCircularMotion);
registerSimulation('forces', simulateLinearMotion);
registerSimulation('energy', simulateEnergy);
registerSimulation('waves', simulateWave);
registerSimulation('collision', simulateCollisions);
registerSimulation('optics', simulateOptics);
registerSimulation('electricity', simulateFields);
registerSimulation('magnetism', simulateFields);
registerSimulation('friction', simulateFriction);
registerSimulation('inclined_plane', simulateIncline);
registerSimulation('fluid_dynamics', simulateFluid);
registerSimulation('lift', simulateLift);
registerSimulation('spring', simulateSpring);
registerSimulation('pulley', simulatePulley);
registerSimulation('gravitation', simulateGravity);
registerSimulation('elasticity', simulateElasticity);
registerSimulation('multi_pulley', simulateMultiPulley);
registerSimulation('magnetism_advanced', simulateMagnetismAdvanced);
registerSimulation('thermodynamics', simulateThermo);
registerSimulation('projectile_incline', simulateProjectileIncline);
registerSimulation('spring_friction', simulateSpringFriction);
registerSimulation('pulley_spring', simulatePulleySpring);

// Topic mapping: frontend topic string → canonical engine topic
const FRONTEND_TO_ENGINE = {
    '1D Motion & Projectiles': 'projectile',
    'Forces & Friction': 'forces',
    'Energy & Springs': 'energy',
    'Oscillations & Waves': 'waves',
    'Circular Motion': 'circular_motion',
    'Collisions': 'collision',
    'Optics': 'optics',
    'Electricity': 'electricity',
    'Magnetism': 'magnetism',
    'Thermodynamics': 'thermodynamics',
    'Gravitation': 'gravitation',
    'Fluid Dynamics': 'fluid_dynamics',
    'Lift (Aerodynamics)': 'lift',
    'Pulley Systems': 'pulley',
    'Elasticity': 'elasticity',
    'Multi-Pulley Systems': 'multi_pulley',
};

/**
 * Initialize the simulation engine on a canvas element.
 * @param {string} canvasId — The id of the canvas element
 * @returns {object} — Control functions
 */
export function setupSimulation(canvasId) {
    const { canvas, ctx } = initSimulation(canvasId);
    return { canvas, ctx };
}

/**
 * Run a simulation with given parameters.
 * @param {object} rawParams — Raw params from the backend or UI
 * @param {string} frontendTopic — The frontend topic string
 */
export function runSimulation(rawParams, frontendTopic) {
    // 1. Determine canonical engine topic
    let engineTopic = rawParams.topic || FRONTEND_TO_ENGINE[frontendTopic] || 'linear_motion';

    // 2. Map UI flat parameters to engine schema
    const engineParams = buildEngineParams(rawParams, engineTopic);

    // 3. Special case: if it's "forces", determine if it's actually an incline or friction
    if (engineTopic === 'forces') {
        if (engineParams.incline && engineParams.incline.angle > 0) engineTopic = 'inclined_plane';
        else if (engineParams.friction && (engineParams.friction.static_coefficient > 0 || engineParams.friction.kinetic_coefficient > 0)) engineTopic = 'friction';
        else engineTopic = 'linear_motion';
        engineParams.topic = engineTopic;
    }

    // 4. Normalize params (fills defaults, coerces types)
    const normalized = normalizeParams(engineParams);

    // 5. Attach computed values (formulas & calculations)
    attachComputedValues(normalized);

    // 6. Route and Load
    const handler = getHandler(normalized.topic);
    if (handler) {
        load(handler, normalized);
    } else {
        console.error(`[index] No handler found for topic "${normalized.topic}"`);
    }
}

/**
 * Maps UI-flat keys (like inclineAngle) to nested schema keys (like incline.angle).
 */
function buildEngineParams(params, topic) {
    const p = JSON.parse(JSON.stringify(params)); // Deep copy
    p.topic = topic;

    // Mapping for common UI keys
    if (p.inclineAngle != null) { p.incline = p.incline || {}; p.incline.angle = p.inclineAngle; }
    if (p.frictionCoeff != null) { p.friction = p.friction || {}; p.friction.kinetic_coefficient = p.frictionCoeff; }
    if (p.appliedForce != null) { p.forces = p.forces || {}; p.forces.applied = p.appliedForce; }
    if (p.springK != null) { p.spring = p.spring || {}; p.spring.constant = p.springK; }
    if (p.focalLength != null) { p.optics = p.optics || {}; p.optics.focal_length = p.focalLength; }
    if (p.objectDistance != null) { p.optics = p.optics || {}; p.optics.object_distance = p.objectDistance; }
    if (p.electricField != null) { p.electricity = p.electricity || {}; p.electricity.electric_field = p.electricField; }
    if (p.magneticField != null) { p.magnetism = p.magnetism || {}; p.magnetism.magnetic_field = p.magneticField; }
    if (p.mass1 != null && p.collision) { p.collision.masses = [p.mass1, p.mass2]; } // Example map
    if (p.velocity1 != null && p.collision) { p.collision.velocities_before = [p.velocity1, p.velocity2]; }

    return p;
}

/**
 * Internal helper to resolve topic to simulation function.
 */
function getHandler(topic) {
    const simMap = {
        'linear_motion': simulateLinearMotion,
        'projectile': simulateProjectile,
        'circular_motion': simulateCircularMotion,
        'forces': simulateLinearMotion,
        'energy': simulateEnergy,
        'waves': simulateWave,
        'collision': simulateCollisions,
        'optics': simulateOptics,
        'electricity': simulateFields,
        'magnetism': simulateFields,
        'friction': simulateFriction,
        'inclined_plane': simulateIncline,
        'fluid_dynamics': simulateFluid,
        'lift': simulateLift,
        'spring': simulateSpring,
        'pulley': simulatePulley,
        'gravitation': simulateGravity,
        'elasticity': simulateElasticity,
        'multi_pulley': simulateMultiPulley,
        'magnetism_advanced': simulateMagnetismAdvanced,
        'thermodynamics': simulateThermo,
        'projectile_incline': simulateProjectileIncline,
        'spring_friction': simulateSpringFriction,
        'pulley_spring': simulatePulleySpring
    };
    return simMap[topic] || simulateLinearMotion;
}

export { start, stop, reset, setZoom, resetView, getCanvas };
