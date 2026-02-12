// ============================================================
// formula-engine.js — Compute formulas + numerical results
// ============================================================
// Populates params.formulas.equations (symbolic) and
// params.formulas.calculations (numeric) for hover-tooltips.
// ============================================================

/**
 * Attach computed physics values based on topic.
 * @param {object} params — Normalized physics parameters
 * @returns {object} — Same params, mutated with computed values
 */
export function attachComputedValues(params) {
    if (!params || typeof params !== 'object') return params;

    if (!params.formulas) params.formulas = { equations: [], calculations: {} };
    if (!Array.isArray(params.formulas.equations)) params.formulas.equations = [];
    if (!params.formulas.calculations) params.formulas.calculations = {};

    const topic = (params.topic || '').toLowerCase();
    const compute = TOPIC_COMPUTERS[topic];
    if (compute) compute(params);
    else console.warn(`[formula-engine] No rules for topic "${topic}".`);

    return params;
}

// --------------- Helpers ---------------

const n = v => typeof v === 'number' && isFinite(v);
const r = (v, d = 6) => Math.round(v * 10 ** d) / 10 ** d;
const rad = deg => (deg * Math.PI) / 180;

function eq(p, s) { if (!p.formulas.equations.includes(s)) p.formulas.equations.push(s); }
function calc(p, k, v) { if (n(v)) p.formulas.calculations[k] = r(v); }

// =====================================================
// TOPIC COMPUTERS
// =====================================================

const TOPIC_COMPUTERS = {
    projectile(p) {
        const g = p.gravity || 9.8, v0 = p.initial_velocity?.magnitude, angle = p.launch_angle, h0 = p.launch_height || 0;
        eq(p, 'x = v₀·cos(θ)·t');
        eq(p, 'y = v₀·sin(θ)·t − ½gt²');
        eq(p, 'R = (v₀²·sin(2θ)) / g');
        eq(p, 'H = (v₀²·sin²(θ)) / (2g)');
        eq(p, 'T = (2·v₀·sin(θ)) / g');
        if (n(v0) && n(angle)) {
            const s = Math.sin(rad(angle)), c = Math.cos(rad(angle));
            const vx = v0 * c, vy = v0 * s;
            let T;
            if (h0 > 0) { const d = vy * vy + 2 * g * h0; T = (vy + Math.sqrt(d)) / g; }
            else T = (2 * vy) / g;
            const range = vx * T, maxH = h0 + (vy * vy) / (2 * g);
            calc(p, 'velocity_x', vx); calc(p, 'velocity_y', vy);
            calc(p, 'time_of_flight', T); calc(p, 'range', range); calc(p, 'max_height', maxH);
            if (!n(p.time)) p.time = r(T);
            if (!n(p.distance)) p.distance = r(range);
        }
    },

    linear_motion(p) {
        const u = p.initial_velocity?.magnitude, a = p.acceleration?.value, t = p.time, s = p.displacement || p.distance;
        eq(p, 'v = u + at'); eq(p, 's = ut + ½at²'); eq(p, 'v² = u² + 2as');
        if (n(u) && n(a) && n(t)) {
            calc(p, 'final_velocity', u + a * t);
            calc(p, 'displacement', u * t + 0.5 * a * t * t);
        }
        if (n(u) && n(a) && n(s)) {
            const v2 = u * u + 2 * a * s;
            if (v2 >= 0) calc(p, 'final_velocity', Math.sqrt(v2));
        }
    },

    circular_motion(p) {
        const rv = p.radius, v = p.initial_velocity?.magnitude, w = p.angular_velocity, m = p.mass || 1;
        eq(p, 'v = ωr'); eq(p, 'a_c = v²/r'); eq(p, 'F_c = mv²/r'); eq(p, 'T = 2π/ω');
        const speed = n(v) ? v : (n(w) && n(rv) ? w * rv : null);
        if (n(speed) && n(rv)) {
            calc(p, 'centripetal_acceleration', speed * speed / rv);
            calc(p, 'centripetal_force', m * speed * speed / rv);
        }
        if (n(w)) { calc(p, 'period', 2 * Math.PI / w); calc(p, 'frequency', w / (2 * Math.PI)); }
    },

    forces(p) {
        const m = p.mass || 1, g = p.gravity || 9.8, a = p.acceleration?.value;
        eq(p, 'F = ma'); eq(p, 'W = mg'); eq(p, 'f = μN');
        calc(p, 'weight', m * g);
        if (!n(p.forces?.normal_force)) { p.forces.normal_force = r(m * g); calc(p, 'normal_force', m * g); }
        if (n(a)) { calc(p, 'net_force', m * a); if (!n(p.forces?.net_force)) p.forces.net_force = r(m * a); }
    },

    energy(p) {
        const m = p.mass || 1, g = p.gravity || 9.8, v = p.initial_velocity?.magnitude, h = p.launch_height || p.initial_position?.y0;
        eq(p, 'KE = ½mv²'); eq(p, 'PE = mgh'); eq(p, 'W = Fd'); eq(p, 'P = W/t');
        if (n(v) && n(m)) { const ke = 0.5 * m * v * v; calc(p, 'kinetic_energy', ke); if (!n(p.energy?.kinetic)) p.energy.kinetic = r(ke); }
        if (n(h) && n(m)) { const pe = m * g * h; calc(p, 'potential_energy', pe); if (!n(p.energy?.potential_gravitational)) p.energy.potential_gravitational = r(pe); }
        if (n(p.energy?.kinetic) && n(p.energy?.potential_gravitational)) {
            calc(p, 'total_energy', p.energy.kinetic + p.energy.potential_gravitational);
        }
        if (n(p.energy?.spring_constant) && n(p.displacement)) {
            const el = 0.5 * p.energy.spring_constant * p.displacement * p.displacement;
            calc(p, 'elastic_pe', el); if (!n(p.energy?.potential_elastic)) p.energy.potential_elastic = r(el);
        }
        if (n(p.forces?.applied) && n(p.distance)) { const w = p.forces.applied * p.distance; calc(p, 'work_done', w); if (!n(p.energy?.work_done)) p.energy.work_done = r(w); }
        if (n(p.energy?.work_done) && n(p.time) && p.time > 0) { calc(p, 'power', p.energy.work_done / p.time); }
    },

    collision(p) {
        eq(p, 'p = mv'); eq(p, 'p₁+p₂ = p₁′+p₂′'); eq(p, 'J = Δp');
        const m = p.collision?.masses || [], vb = p.collision?.velocities_before || [], va = p.collision?.velocities_after || [];
        if (m.length >= 2 && vb.length >= 2) {
            let pb = 0; for (let i = 0; i < m.length; i++) if (n(m[i]) && n(vb[i])) pb += m[i] * vb[i];
            calc(p, 'total_momentum_before', pb);
            if ((p.collision?.type || '').includes('inelastic') && va.length === 0) {
                const tm = m.reduce((s, x) => s + (n(x) ? x : 0), 0);
                if (tm > 0) { const vf = pb / tm; calc(p, 'final_velocity', vf); p.collision.velocities_after = [r(vf)]; }
            }
        }
    },

    waves(p) {
        const f = p.waves?.frequency, lam = p.waves?.wavelength, v = p.waves?.speed;
        eq(p, 'v = fλ'); eq(p, 'T = 1/f');
        if (n(f) && n(lam)) { calc(p, 'wave_speed', f * lam); if (!n(p.waves?.speed)) p.waves.speed = r(f * lam); }
        if (n(v) && n(f) && f !== 0 && !n(lam)) { p.waves.wavelength = r(v / f); calc(p, 'wavelength', v / f); }
        if (n(v) && n(lam) && lam !== 0 && !n(f)) { p.waves.frequency = r(v / lam); calc(p, 'frequency', v / lam); }
        if (n(f) && f !== 0) { calc(p, 'period', 1 / f); if (!n(p.waves?.period)) p.waves.period = r(1 / f); }
        const dop = p.waves?.doppler;
        if (dop && (n(dop.source_velocity) || n(dop.observer_velocity))) {
            eq(p, 'f_obs = f·(v+v_obs)/(v+v_src)');
            const ws = n(p.waves?.speed) ? p.waves.speed : 343;
            if (n(p.waves?.frequency)) {
                calc(p, 'observed_frequency', p.waves.frequency * (ws + (dop.observer_velocity || 0)) / (ws + (dop.source_velocity || 0)));
            }
        }
    },

    optics(p) {
        const n1 = p.optics?.indices?.n1, n2 = p.optics?.indices?.n2, ai = p.optics?.angles?.incidence;
        const f0 = p.optics?.focal_length, dO = p.optics?.object_distance, dI = p.optics?.image_distance;
        // Snell's Law
        if (n(n1) && n(n2) && n(ai)) {
            eq(p, 'n₁·sin(θ₁) = n₂·sin(θ₂)');
            const sinR = (n1 * Math.sin(rad(ai))) / n2;
            if (Math.abs(sinR) <= 1) {
                const ar = Math.asin(sinR) * 180 / Math.PI;
                calc(p, 'angle_of_refraction', ar);
                if (!n(p.optics?.angles?.refraction)) p.optics.angles.refraction = r(ar);
            }
        }
        // Lens/Mirror formula
        eq(p, '1/f = 1/dₒ + 1/dᵢ'); eq(p, 'M = −dᵢ/dₒ');
        if (n(f0) && n(dO) && dO !== 0) {
            const di = 1 / (1 / f0 - 1 / dO);
            calc(p, 'image_distance', di); calc(p, 'magnification', -di / dO);
            if (!n(p.optics?.image_distance)) p.optics.image_distance = r(di);
        } else if (n(dO) && n(dI) && dO !== 0 && dI !== 0) {
            const fCalc = 1 / (1 / dO + 1 / dI);
            calc(p, 'focal_length', fCalc); calc(p, 'magnification', -dI / dO);
        }
    },

    electricity(p) {
        const V = p.electricity?.voltage, I = p.electricity?.current, R = p.electricity?.resistance;
        eq(p, 'V = IR'); eq(p, 'P = IV'); eq(p, 'Q = CV');
        if (n(V) && n(I) && !n(R)) { p.electricity.resistance = r(V / I); calc(p, 'resistance', V / I); }
        else if (n(V) && n(R) && !n(I)) { p.electricity.current = r(V / R); calc(p, 'current', V / R); }
        else if (n(I) && n(R) && !n(V)) { p.electricity.voltage = r(I * R); calc(p, 'voltage', I * R); }
        if (n(V) && n(I)) calc(p, 'power', V * I);
        else if (n(I) && n(R)) calc(p, 'power', I * I * R);
        else if (n(V) && n(R) && R !== 0) calc(p, 'power', V * V / R);
    },

    magnetism(p) {
        const B = p.magnetism?.magnetic_field, q = p.electricity?.charge, v = p.initial_velocity?.magnitude;
        eq(p, 'F = qvB·sin(θ)'); eq(p, 'EMF = −dΦ/dt');
        if (n(B) && n(q) && n(v)) { const F = q * v * B; calc(p, 'lorentz_force', F); if (!n(p.magnetism?.force_on_charge)) p.magnetism.force_on_charge = r(F); }
    },

    thermodynamics(p) {
        const Ti = p.thermodynamics?.temperature_initial, Tf = p.thermodynamics?.temperature_final;
        const m = p.mass || 1, c = p.thermodynamics?.specific_heat;
        eq(p, 'Q = mcΔT'); eq(p, 'PV = nRT');
        if (n(Ti) && n(Tf) && n(c)) {
            const dT = Tf - Ti, Q = m * c * dT;
            calc(p, 'heat_transfer', Q); calc(p, 'temperature_change', dT);
            if (!n(p.thermodynamics?.heat_transfer)) p.thermodynamics.heat_transfer = r(Q);
        }
        if (n(p.thermodynamics?.pressure) && n(p.thermodynamics?.volume)) calc(p, 'PV_product', p.thermodynamics.pressure * p.thermodynamics.volume);
    },


    friction(p) {
        const m = p.mass || 1, g = p.gravity || 9.8;
        const mu_s = p.friction?.static_coefficient, mu_k = p.friction?.kinetic_coefficient;
        const N_force = m * g;
        eq(p, 'f_s = μ_s·N'); eq(p, 'f_k = μ_k·N'); eq(p, 'N = mg');
        calc(p, 'normal_force', N_force);
        if (n(mu_s)) calc(p, 'max_static_friction', mu_s * N_force);
        if (n(mu_k)) calc(p, 'kinetic_friction', mu_k * N_force);
        if (n(p.forces?.applied) && n(mu_k)) {
            const net = p.forces.applied - mu_k * N_force;
            calc(p, 'net_force', net);
            calc(p, 'acceleration', net / m);
        }
    },

    inclined_plane(p) {
        const m = p.mass || 1, g = p.gravity || 9.8;
        const theta = p.incline?.angle || p.launch_angle || 30;
        const mu = p.friction?.kinetic_coefficient || 0;
        const W = m * g, rr = rad(theta);
        eq(p, 'F∥ = mg·sin(θ)'); eq(p, 'N = mg·cos(θ)'); eq(p, 'f = μN');
        const Fpar = W * Math.sin(rr), Norm = W * Math.cos(rr), Ffric = mu * Norm;
        calc(p, 'parallel_force', Fpar);
        calc(p, 'normal_force', Norm);
        calc(p, 'friction_force', Ffric);
        calc(p, 'net_force', Fpar - Ffric);
        calc(p, 'acceleration', (Fpar - Ffric) / m);
    },

    fluid_dynamics(p) {
        const rho = p.fluid?.density || 1000;
        const A1 = p.fluid?.area1, A2 = p.fluid?.area2, v1 = p.fluid?.velocity1;
        const g = p.gravity || 9.8;
        eq(p, 'A₁v₁ = A₂v₂'); eq(p, 'P + ½ρv² + ρgh = const');
        if (n(A1) && n(A2) && n(v1) && A2 !== 0) {
            const v2 = (A1 * v1) / A2;
            calc(p, 'velocity2', v2);
            const P1 = p.fluid?.pressure1 || 101325;
            const h1 = p.fluid?.height1 || 0, h2 = p.fluid?.height2 || 0;
            const P2 = P1 + 0.5 * rho * (v1 * v1 - v2 * v2) + rho * g * (h1 - h2);
            calc(p, 'pressure2', P2);
        }
    },

    lift(p) {
        const rho = p.fluid?.density || 1.225;
        const v_t = p.lift?.velocity_top, v_b = p.lift?.velocity_bottom;
        const area = p.lift?.wing_area;
        eq(p, 'F_lift = ΔP × A'); eq(p, 'ΔP = ½ρ(v_b² - v_t²)');
        if (n(v_t) && n(v_b) && n(area)) {
            const dP = 0.5 * rho * (v_b * v_b - v_t * v_t);
            calc(p, 'pressure_difference', Math.abs(dP));
            calc(p, 'lift_force', Math.abs(dP) * area);
        }
    },

    magnetism_advanced(p) {
        const B = p.magnetism?.magnetic_field, q = p.electricity?.charge, v = p.initial_velocity?.magnitude;
        const m = p.mass || 9.11e-31;
        eq(p, 'F = qvB'); eq(p, 'r = mv/(qB)'); eq(p, 'ω = qB/m');
        if (n(B) && n(q) && n(v)) {
            calc(p, 'lorentz_force', Math.abs(q) * v * B);
            if (q !== 0 && B !== 0) {
                calc(p, 'cyclotron_radius', m * v / (Math.abs(q) * B));
                calc(p, 'cyclotron_frequency', Math.abs(q) * B / m);
            }
        }
    },

    spring(p) {
        const k = p.energy?.spring_constant || p.spring?.constant;
        const m = p.mass || 1;
        const x = p.spring?.displacement || p.displacement;
        eq(p, 'F = -kx'); eq(p, 'PE = ½kx²'); eq(p, 'ω = √(k/m)'); eq(p, 'T = 2π/ω');
        if (n(k) && n(x)) {
            calc(p, 'spring_force', -k * x);
            calc(p, 'elastic_pe', 0.5 * k * x * x);
        }
        if (n(k) && n(m) && k > 0 && m > 0) {
            const omega = Math.sqrt(k / m);
            calc(p, 'angular_frequency', omega);
            calc(p, 'period', 2 * Math.PI / omega);
            calc(p, 'frequency', omega / (2 * Math.PI));
        }
    },

    pulley(p) {
        const m1 = p.pulley?.mass1, m2 = p.pulley?.mass2;
        const g = p.gravity || 9.8;
        eq(p, 'a = (m₁−m₂)g/(m₁+m₂)'); eq(p, 'T = 2m₁m₂g/(m₁+m₂)');
        if (n(m1) && n(m2) && (m1 + m2) > 0) {
            calc(p, 'acceleration', (m1 - m2) * g / (m1 + m2));
            calc(p, 'tension', 2 * m1 * m2 * g / (m1 + m2));
        }
    },

    gravitation(p) {
        const G = 6.674e-11;
        const M = p.gravitation?.central_mass, m = p.mass;
        const r_val = p.gravitation?.orbital_radius;
        eq(p, 'F = GMm/r²'); eq(p, 'v = √(GM/r)'); eq(p, 'T = 2πr/v');
        if (n(M) && n(m) && n(r_val) && r_val > 0) {
            calc(p, 'gravitational_force', G * M * m / (r_val * r_val));
            const v_orb = Math.sqrt(G * M / r_val);
            calc(p, 'orbital_velocity', v_orb);
            calc(p, 'orbital_period', 2 * Math.PI * r_val / v_orb);
        }
    },

    elasticity(p) {
        const F_val = p.forces?.applied, A_val = p.elasticity?.area;
        const L0 = p.elasticity?.original_length, E_val = p.elasticity?.youngs_modulus;
        eq(p, 'σ = F/A'); eq(p, 'ε = σ/E'); eq(p, 'ΔL = εL₀');
        if (n(F_val) && n(A_val) && A_val !== 0) {
            const stress = F_val / A_val;
            calc(p, 'stress', stress);
            if (n(E_val) && E_val !== 0) {
                const strain = stress / E_val;
                calc(p, 'strain', strain);
                if (n(L0)) calc(p, 'deformation', strain * L0);
            }
        }
    },

    // ========== COMPOSITE TOPICS ==========

    projectile_incline(p) {
        const v0 = p.initial_velocity?.magnitude || 20;
        const theta_launch = p.launch_angle || 25;
        const theta_incline = p.incline?.angle || 45;
        const g = p.gravity || 9.8;
        const e = p.collision?.coefficient_of_restitution || 0.7;

        eq(p, 'v₀ₓ = v₀·cos(θ)'); eq(p, 'v₀ᵧ = v₀·sin(θ)');
        eq(p, 'Impact angle = θ_launch - θ_incline');
        eq(p, 'Bounce: v\' = e·v');

        const v0x = v0 * Math.cos(theta_launch * Math.PI / 180);
        const v0y = v0 * Math.sin(theta_launch * Math.PI / 180);
        calc(p, 'initial_vx', v0x);
        calc(p, 'initial_vy', v0y);
        calc(p, 'impact_angle_diff', theta_launch - theta_incline);
        calc(p, 'restitution_coeff', e);
    },

    spring_friction(p) {
        const m = p.mass || 2;
        const k = p.spring?.constant || 50;
        const mu_k = p.friction?.kinetic_coefficient || 0.15;
        const g = p.gravity || 9.8;
        const x0 = p.spring?.displacement || 1.5;

        const omega_0 = Math.sqrt(k / m);
        const f_friction = mu_k * m * g;
        const b_eff = 2 * f_friction / (Math.PI * x0); // Effective damping

        eq(p, 'ω₀ = √(k/m)'); eq(p, 'f_friction = μ_k·mg');
        eq(p, 'Damping: b_eff ≈ 2f/(πx₀)');
        eq(p, 'Energy loss per cycle ≈ 4μ_k·mg·x');

        calc(p, 'natural_frequency', omega_0);
        calc(p, 'friction_force', f_friction);
        calc(p, 'effective_damping', b_eff);
        calc(p, 'energy_loss_per_cycle', 4 * mu_k * m * g * x0);
    },

    pulley_spring(p) {
        const m1 = p.pulley?.mass1 || 10;
        const m2 = p.pulley?.mass2 || 5;
        const k = p.pulley?.spring_constant || 20;
        const g = p.gravity || 9.8;

        const m_eff = (m1 * m2) / (m1 + m2);
        const omega = Math.sqrt(k / m_eff);
        const T_period = 2 * Math.PI / omega;

        eq(p, 'm_eff = (m₁·m₂)/(m₁+m₂)');
        eq(p, 'ω = √(k/m_eff)');
        eq(p, 'T = 2π/ω');
        eq(p, 'Δx_eq = (m₁-m₂)g/k');

        calc(p, 'effective_mass', m_eff);
        calc(p, 'angular_frequency', omega);
        calc(p, 'period', T_period);
        calc(p, 'equilibrium_extension', (m1 - m2) * g / k);
    }
};
