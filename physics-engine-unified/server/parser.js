// ============================================================
// parser.js — Normalize & validate extracted physics JSON
// ============================================================

const SCHEMA_TEMPLATE = Object.freeze({
    topic: '', sub_topic: '', object: '',
    initial_position: { x0: null, y0: null, z0: null },
    initial_velocity: { magnitude: null, direction: null },
    final_velocity: { magnitude: null, direction: null },
    acceleration: { value: null, direction: null, type: '' },
    mass: null, time: null, duration: null, distance: null, displacement: null,
    launch_angle: null, launch_height: null, gravity: 9.8, air_resistance: null,
    radius: null, angular_velocity: null, centripetal_acc: null, period: null, frequency: null,
    forces: { applied: null, friction_static: null, friction_kinetic: null, normal_force: null, tension: null, net_force: null },
    energy: { kinetic: null, potential_gravitational: null, potential_elastic: null, work_done: null, power: null, spring_constant: null },
    collision: { type: null, masses: [], velocities_before: [], velocities_after: [], impulse: null, coefficient_of_restitution: null },
    optics: { type: null, focal_length: null, object_distance: null, image_distance: null, angles: { incidence: null, reflection: null, refraction: null }, indices: { n1: null, n2: null } },
    waves: { wavelength: null, frequency: null, amplitude: null, period: null, speed: null, phase: null, type: null, phenomena: null, doppler: { source_velocity: null, observer_velocity: null } },
    electricity: { voltage: null, current: null, resistance: null, capacitance: null, charge: null, electric_field: null, potential: null },
    magnetism: { magnetic_field: null, force_on_charge: null, induced_emf: null },
    thermodynamics: { temperature_initial: null, temperature_final: null, heat_transfer: null, specific_heat: null, pressure: null, volume: null },
    friction: { static_coefficient: null, kinetic_coefficient: null },
    incline: { angle: null },
    fluid: { density: null, area1: null, area2: null, velocity1: null, pressure1: null, height1: null, height2: null },
    lift: { velocity_top: null, velocity_bottom: null, wing_area: null },
    spring: { constant: null, displacement: null, damping: null },
    elasticity: { area: null, original_length: null, youngs_modulus: null },
    pulley: { mass1: null, mass2: null, masses_left: [], masses_right: [], spring_coupled: false, spring_constant: null },
    multi_pulley: { config: null, num_pulleys: null, load_mass: null, effort_mass: null },
    composite_topics: [],
    formulas: { equations: [], calculations: {} }
});

const VALID_TOPICS = new Set([
    'linear_motion', 'projectile', 'circular_motion', 'forces',
    'energy', 'collision', 'waves', 'optics', 'electricity',
    'magnetism', 'thermodynamics',
    'friction', 'inclined_plane', 'fluid_dynamics', 'lift',
    'magnetism_advanced', 'spring', 'pulley', 'gravitation',
    'elasticity',
    'projectile_incline', 'spring_friction', 'pulley_spring',
    'multi_pulley'
]);

/**
 * Normalize and validate LLM-extracted physics parameters.
 * - Deep-merges with schema template so every key exists
 * - Fills defaults: gravity=9.8, mass=1, position=(0,0,0)
 * - Coerces numeric strings to numbers
 * - Replaces undefined/NaN with null
 * - Validates topic against allowlist
 * - Ensures arrays remain arrays
 *
 * @param {object} json — Raw LLM output
 * @returns {object}    — Clean, schema-conformant object
 */
export function normalizeParams(json) {
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
        console.warn('[parser] Invalid input. Returning schema defaults.');
        return deepClone(SCHEMA_TEMPLATE);
    }

    const merged = deepMerge(deepClone(SCHEMA_TEMPLATE), json);
    sanitize(merged);
    applyDefaults(merged);
    validateTopic(merged);
    ensureArrays(merged);

    if (!merged.formulas.calculations || typeof merged.formulas.calculations !== 'object' || Array.isArray(merged.formulas.calculations)) {
        merged.formulas.calculations = {};
    }

    return merged;
}

// --------------- Internals ---------------

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
        const s = source[key], t = target[key];
        if (s === undefined) continue;
        if (s && typeof s === 'object' && !Array.isArray(s) && t && typeof t === 'object' && !Array.isArray(t)) {
            target[key] = deepMerge(t, s);
        } else {
            target[key] = s;
        }
    }
    return target;
}

const STRING_FIELDS = new Set(['topic', 'sub_topic', 'object', 'type', 'direction', 'phenomena']);

function sanitize(obj) {
    for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (val === undefined || (typeof val === 'number' && isNaN(val))) { obj[key] = null; continue; }
        if (typeof val === 'string' && val !== '' && !STRING_FIELDS.has(key)) {
            const n = Number(val);
            if (!isNaN(n)) { obj[key] = n; continue; }
        }
        if (val && typeof val === 'object' && !Array.isArray(val)) sanitize(val);
        if (Array.isArray(val)) {
            for (let i = 0; i < val.length; i++) {
                if (val[i] === undefined || (typeof val[i] === 'number' && isNaN(val[i]))) val[i] = null;
                else if (typeof val[i] === 'string' && val[i] !== '') { const n = Number(val[i]); if (!isNaN(n)) val[i] = n; }
                else if (val[i] && typeof val[i] === 'object') sanitize(val[i]);
            }
        }
    }
}

function applyDefaults(p) {
    if (p.gravity == null) p.gravity = 9.8;
    if (p.mass == null) p.mass = 1;
    const pos = p.initial_position;
    if (pos && pos.x0 === null && pos.y0 === null && pos.z0 === null) {
        pos.x0 = 0; pos.y0 = 0; pos.z0 = 0;
    }
}

function validateTopic(p) {
    if (!p.topic || typeof p.topic !== 'string') { p.topic = 'linear_motion'; return; }
    const norm = p.topic.toLowerCase().trim().replace(/[\s-]+/g, '_');
    if (VALID_TOPICS.has(norm)) { p.topic = norm; return; }
    for (const v of VALID_TOPICS) { if (norm.includes(v) || v.includes(norm)) { p.topic = v; return; } }
    console.warn(`[parser] Unknown topic "${p.topic}". Defaulting to "linear_motion".`);
    p.topic = 'linear_motion';
}

function ensureArrays(p) {
    const paths = [['collision', 'masses'], ['collision', 'velocities_before'], ['collision', 'velocities_after'], ['formulas', 'equations'], ['pulley', 'masses_left'], ['pulley', 'masses_right']];
    for (const path of paths) {
        let o = p;
        for (let i = 0; i < path.length - 1; i++) { o = o[path[i]]; if (!o) break; }
        if (o) { const k = path[path.length - 1]; if (!Array.isArray(o[k])) o[k] = []; }
    }
}
