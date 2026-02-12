// ============================================================
// collisions-sim.js — Premium collision visualization
// ============================================================

import { drawDot, drawArrow, drawLine, drawGround, drawHUD, getCamera, formatLength } from './simulation-core.js';

export function simulateCollisions(params, sim) {
    const type = params.collision?.type || 'elastic';
    const masses = params.collision?.masses || [2, 1];
    const vBef = params.collision?.velocities_before || [4, -2];

    // Calculate after velocities
    const m1 = masses[0], m2 = masses[1];
    const u1 = vBef[0], u2 = vBef[1];
    let v1, v2;

    if (type === 'elastic') {
        v1 = ((m1 - m2) * u1 + 2 * m2 * u2) / (m1 + m2);
        v2 = ((m2 - m1) * u2 + 2 * m1 * u1) / (m1 + m2);
    } else {
        const vf = (m1 * u1 + m2 * u2) / (m1 + m2);
        v1 = vf; v2 = vf;
    }

    const collisionTime = 3.0; // seconds until collision
    // We want the collision to happen at x=0 (relative to center)
    // So start positions: x1 = -u1 * collisionTime
    // But if u1 is negative? We need them to approach.
    // Let's assume standard scenario: left object moves right, right object moves left.
    // If user gives weird velocities (both moving right), we just sim it.
    // Let's set collision point at cx = 450.
    // Initial pos = 450 - v * time.

    const startX1 = 0 - u1 * collisionTime;
    const startX2 = 0 - u2 * collisionTime;

    sim.addObject({
        name: 'Collision',
        params,
        update(dt, t) {
            this.t = t;
            this.phase = t < collisionTime ? 'before' : 'after';
            const ct = t - collisionTime;

            if (this.phase === 'before') {
                this.x1 = startX1 + u1 * t;
                this.x2 = startX2 + u2 * t;
            } else {
                this.x1 = 0 + v1 * ct;
                this.x2 = 0 + v2 * ct;
            }
        },
        render(ctx, canvas) {
            const cam = getCamera();
            const s = cam.autoScale || 20;
            const baseY = 380;

            drawGround(ctx, baseY + 30, canvas.width);

            // Objects (size ∝ mass)
            const r1 = (10 + m1 * 4);
            const r2 = (10 + m2 * 4);

            // Map physics x to canvas x
            // Physics x=0 is at canvas x=450
            const cx1 = 450 + this.x1 * s;
            const cx2 = 450 + this.x2 * s;
            const cy = baseY;

            // Trails
            // We can't easily draw trails without history. 
            // Let's simplify and just skip trail or assume straight line

            drawDot(ctx, cx1, cy, r1, '#00f5ff');
            drawDot(ctx, cx2, cy, r2, '#e056fd');

            // Labels
            ctx.fillStyle = '#fff';
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillText(`${m1}kg`, cx1 - 10, cy - r1 - 8);
            ctx.fillText(`${m2}kg`, cx2 - 10, cy - r2 - 8);

            // Velocity arrows
            const currentV1 = this.phase === 'before' ? u1 : v1;
            const currentV2 = this.phase === 'before' ? u2 : v2;

            // Fixed length arrow scaling
            const aScale = 30 / (Math.max(Math.abs(u1), Math.abs(u2), 1));

            drawArrow(ctx, cx1, cy + r1 + 10, cx1 + currentV1 * aScale, cy + r1 + 10, '#4ecdc4', `${formatLength(currentV1)}/s`);
            drawArrow(ctx, cx2, cy + r2 + 10, cx2 + currentV2 * aScale, cy + r2 + 10, '#ff9f43', `${formatLength(currentV2)}/s`);

            // Flash
            if (Math.abs(this.t - collisionTime) < 0.1) {
                const flashR = 60;
                const g = ctx.createRadialGradient(450, cy, 0, 450, cy, flashR);
                g.addColorStop(0, 'white');
                g.addColorStop(1, 'transparent');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(450, cy, flashR, 0, Math.PI * 2);
                ctx.fill();
            }

            drawHUD(ctx, [
                `${type.charAt(0).toUpperCase() + type.slice(1)} Collision`,
                `m₁=${m1}kg  v₁=${formatLength(currentV1)}/s`,
                `m₂=${m2}kg  v₂=${formatLength(currentV2)}/s`,
                this.phase === 'before' ? `Approaching...` : `Separating...`,
            ]);
        }
    });
}
