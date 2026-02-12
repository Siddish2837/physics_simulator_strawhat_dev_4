// ============================================================
// router.js — Route params.topic to simulation functions
// ============================================================
// Simulation functions are NOT implemented here — they belong
// to the simulation layer. This module provides routing logic
// and stub hooks the frontend should override.
// ============================================================

const handlers = {};

/**
 * Register a custom simulation handler for a topic.
 * @param {string}   topic   — One of the valid physics topics
 * @param {function} handler — Function receiving the params object
 */
export function registerSimulation(topic, handler) {
    if (typeof topic !== 'string' || !topic.trim()) throw new Error('Topic must be a non-empty string.');
    if (typeof handler !== 'function') throw new Error('Handler must be a function.');
    handlers[topic.toLowerCase().trim()] = handler;
}

/**
 * Route validated, formula-enriched parameters to the correct simulation.
 * Checks for custom handlers first, then falls back to built-in stubs.
 *
 * @param {object} params — Final params object (output of attachComputedValues)
 * @returns {*} — Whatever the simulation handler returns
 */
export function routeToSimulation(params) {
    if (!params || typeof params !== 'object') throw new Error('[router] Invalid params object.');
    const topic = (params.topic || '').toLowerCase().trim();
    if (!topic) throw new Error('[router] No topic found in params.');

    // Custom handler takes priority
    if (handlers[topic]) {
        console.log(`[router] → custom handler: "${topic}"`);
        return handlers[topic](params);
    }

    // Built-in stub routing
    switch (topic) {
        case 'linear_motion': return stub('linear_motion', params);
        case 'projectile': return stub('projectile', params);
        case 'circular_motion': return stub('circular_motion', params);
        case 'forces': return stub('forces', params);
        case 'energy': return stub('energy', params);
        case 'collision': return stub('collision', params);
        case 'waves': return stub('waves', params);
        case 'optics': return stub('optics', params);
        case 'electricity': return stub('electricity', params);
        case 'magnetism': return stub('magnetism', params);
        case 'thermodynamics': return stub('thermodynamics', params);
        case 'relativity': return stub('relativity', params);
        case 'friction': return stub('friction', params);
        case 'inclined_plane': return stub('inclined_plane', params);
        case 'fluid_dynamics': return stub('fluid_dynamics', params);
        case 'lift': return stub('lift', params);
        case 'magnetism_advanced': return stub('magnetism_advanced', params);
        case 'spring': return stub('spring', params);
        case 'pulley': return stub('pulley', params);
        case 'gravitation': return stub('gravitation', params);
        case 'elasticity': return stub('elasticity', params);
        case 'projectile_incline': return stub('projectile_incline', params);
        case 'spring_friction': return stub('spring_friction', params);
        case 'pulley_spring': return stub('pulley_spring', params);
        case 'multi_pulley': return stub('multi_pulley', params);
        default:
            console.error(`[router] Unknown topic: "${topic}"`);
            return { success: false, error: `Unknown topic: "${topic}"`, params };
    }
}

/**
 * Built-in stub — logs the route and returns a ready-status object.
 * Replace with registerSimulation() in production.
 */
function stub(name, params) {
    console.log(`[router] → simulate_${name}()`, params.sub_topic || '');
    return { simulation: name, status: 'ready', params };
}
