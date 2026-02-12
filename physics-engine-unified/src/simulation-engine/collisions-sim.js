// ============================================================
// collisions-sim.js — Premium Physics Engineering Module
// ============================================================

import { drawDot, drawArrow, drawLine, drawGround, drawHUD, getCamera } from './simulation-core.js';

/**
 * Realistic 2D Collision Module
 * Supports Elastic and Inelastic collisions using impulse-based resolution.
 */
export function simulateCollisions(params, sim) {
    const collision = params.collision || {};

    // 1. Parameters & State Initialization
    const mode = collision.type || 'elastic';
    const e = mode === 'inelastic' ? 0 : (collision.coefficient_of_restitution ?? 1.0);

    const masses = (collision.masses && collision.masses.length >= 2) ? collision.masses : [2, 3];
    const vBef = (collision.velocities_before && collision.velocities_before.length >= 2) ? collision.velocities_before : [5, -2];

    const m1 = Number(masses[0]) || 2;
    const m2 = Number(masses[1]) || 3;

    const getVec = (v) => {
        if (typeof v === 'number') return { x: v, y: 0 };
        if (Array.isArray(v)) return { x: Number(v[0]) || 0, y: Number(v[1]) || 0 };
        return { x: 0, y: 0 };
    };

    const v1 = getVec(vBef[0]);
    const v2 = getVec(vBef[1]);

    const r1 = 15 + m1 * 2; // Visual radius
    const r2 = 15 + m2 * 2;

    // Initial positions (staggered for 2D impact if velocities are pure 1D)
    const p1 = { x: -6, y: (v1.y === 0 && v2.y === 0) ? -0.5 : 0 };
    const p2 = { x: 6, y: (v1.y === 0 && v2.y === 0) ? 0.5 : 0 };

    sim.addObject({
        name: 'Quantum Collision Engine',
        p1, p2, v1, v2, m1, m2, e, r1, r2, mode,
        trails: { p1: [], p2: [] },
        energyBefore: 0,
        momentumBefore: 0,
        collided: false,

        init() {
            this.energyBefore = this.calcKE();
            this.momentumBefore = this.calcMomentum().mag;
        },

        calcKE() {
            const ke1 = 0.5 * this.m1 * (this.v1.x ** 2 + this.v1.y ** 2);
            const ke2 = 0.5 * this.m2 * (this.v2.x ** 2 + this.v2.y ** 2);
            return ke1 + ke2;
        },

        calcMomentum() {
            const px = this.m1 * this.v1.x + this.m2 * this.v2.x;
            const py = this.m1 * this.v1.y + this.m2 * this.v2.y;
            return { x: px, y: py, mag: Math.sqrt(px * px + py * py) };
        },

        update(dt) {
            // 1. Motion - Frictionless Euler
            this.p1.x += this.v1.x * dt;
            this.p1.y += this.v1.y * dt;
            this.p2.x += this.v2.x * dt;
            this.p2.y += this.v2.y * dt;

            // 2. Trail Management
            this.updateTrails();

            // 3. Collision Detection (Distance based)
            const dx = this.p2.x - this.p1.x;
            const dy = this.p2.y - this.p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Correct minDist calculation using the camera scale
            const cam = getCamera();
            const s = cam.unitScale || 40;
            const minDist = (this.r1 + this.r2) / s;

            if (dist <= minDist) {
                this.resolveCollision(dx, dy, dist, minDist);
            }
        },

        resolveCollision(dx, dy, dist, minDist) {
            const nx = dx / dist; // Collision Normal
            const ny = dy / dist;

            // Relative velocity
            const rvx = this.v1.x - this.v2.x;
            const rvy = this.v1.y - this.v2.y;

            // Velocity along normal
            const vNormal = rvx * nx + rvy * ny;

            // Only resolve if approaching
            if (vNormal < 0) {
                // Impulse Scaler (Conservation of p and E)
                // j = -(1+e) * v_rel_normal / (1/m1 + 1/m2)
                const j = -(1 + this.e) * vNormal / (1 / this.m1 + 1 / this.m2);

                const impulseX = j * nx;
                const impulseY = j * ny;

                this.v1.x += impulseX / this.m1;
                this.v1.y += impulseY / this.m1;
                this.v2.x -= impulseX / this.m2;
                this.v2.y -= impulseY / this.m2;

                // Overlap Correction (Positional correction to prevent sticking)
                const percent = 0.8;
                const slop = 0.01;
                const penetration = minDist - dist;
                const correction = Math.max(penetration - slop, 0) / (1 / this.m1 + 1 / this.m2) * percent;

                this.p1.x -= (1 / this.m1) * correction * nx;
                this.p1.y -= (1 / this.m1) * correction * ny;
                this.p2.x += (1 / this.m2) * correction * nx;
                this.p2.y += (1 / this.m2) * correction * ny;

                this.collided = true;
            }
        },

        updateTrails() {
            this.trails.p1.push({ ...this.p1 });
            this.trails.p2.push({ ...this.p2 });
            if (this.trails.p1.length > 50) {
                this.trails.p1.shift();
                this.trails.p2.shift();
            }
        },

        render(ctx, canvas) {
            const cam = getCamera();
            const s = cam.unitScale || 40;
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            // Draw Trails
            this.drawTrail(ctx, this.trails.p1, cx, cy, s, 'rgba(0, 245, 255, 0.3)');
            this.drawTrail(ctx, this.trails.p2, cx, cy, s, 'rgba(224, 86, 253, 0.3)');

            // Particles
            const s1 = { x: cx + this.p1.x * s, y: cy - this.p1.y * s };
            const s2 = { x: cx + this.p2.x * s, y: cy - this.p2.y * s };

            drawDot(ctx, s1.x, s1.y, this.r1, '#00f5ff'); // Neon Blue
            drawDot(ctx, s2.x, s2.y, this.r2, '#e056fd'); // Purple

            // Velocity Vectors
            const vScale = 10;
            drawArrow(ctx, s1.x, s1.y, s1.x + this.v1.x * vScale, s1.y - this.v1.y * vScale, '#00f5ff');
            drawArrow(ctx, s2.x, s2.y, s2.x + this.v2.x * vScale, s2.y - this.v2.y * vScale, '#e056fd');

            // Analytics HUD
            const ke = this.calcKE();
            const p = this.calcMomentum();

            drawHUD(ctx, [
                `Mode: ${this.mode.toUpperCase()} (e=${this.e})`,
                `Kinetic Energy: ${ke.toFixed(2)} J (Initial: ${this.energyBefore.toFixed(2)} J)`,
                `Momentum: ${p.mag.toFixed(2)} kg·m/s (Initial: ${this.momentumBefore.toFixed(2)})`,
                `Velocity 1: (${this.v1.x.toFixed(1)}, ${this.v1.y.toFixed(1)}) m/s`,
                `Velocity 2: (${this.v2.x.toFixed(1)}, ${this.v2.y.toFixed(1)}) m/s`,
                this.collided ? '✨ Impact Detected' : 'Approaching...'
            ]);
        },

        drawTrail(ctx, trail, cx, cy, s, color) {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            trail.forEach((p, i) => {
                const tx = cx + p.x * s;
                const ty = cy - p.y * s;
                if (i === 0) ctx.moveTo(tx, ty);
                else ctx.lineTo(tx, ty);
            });
            ctx.stroke();
        }
    }).init();
}
