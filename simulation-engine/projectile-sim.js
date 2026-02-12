// ============================================================
// projectile-sim.js — Premium projectile motion visualization
// ============================================================

import { drawDot, drawArrow, drawTrail, drawLine, drawGround, drawHUD, toCanvas, getCamera } from './simulation-core.js';

export function simulateProjectile(params, sim) {
    const v0 = params.initial_velocity?.magnitude || 20;
    const angle = params.launch_angle || 45;
    const h0 = params.launch_height || 0;
    const g = params.gravity || 9.8;
    const rad = (angle * Math.PI) / 180;
    const vx = v0 * Math.cos(rad);
    const vy = v0 * Math.sin(rad);
    const trail = [];
    let landed = false;

    const maxH = h0 + (vy * vy) / (2 * g);
    const tFlight = (vy + Math.sqrt(vy * vy + 2 * g * h0)) / g;
    const range = vx * tFlight;

    // Pre-compute ghost trajectory
    const ghostRaw = [];
    for (let gt = 0; gt < tFlight + 0.1; gt += tFlight / 100) {
        const gx = vx * gt;
        const gy = h0 + vy * gt - 0.5 * g * gt * gt;
        if (gy < 0 && gt > 0.1) break;
        ghostRaw.push({ px: gx, py: Math.max(0, gy) });
    }

    sim.addObject({
        name: params.object || 'Projectile',
        params,
        cx: 0, cy: 0,
        update(dt, t) {
            if (landed) return;
            this.t = t;
            this.x = vx * t;
            this.y = h0 + vy * t - 0.5 * g * t * t;
            this.currentVx = vx;
            this.currentVy = vy - g * t;

            if (this.y < 0 && t > 0.1) { this.y = 0; landed = true; }

            const pos = toCanvas(this.x, this.y);
            this.cx = pos.x;
            this.cy = pos.y;
            trail.push({ x: this.cx, y: this.cy });
        },
        render(ctx, canvas) {
            const W = canvas.width, H = canvas.height;
            drawGround(ctx, 500, W);

            // Ghost trajectory
            ctx.save();
            ctx.setLineDash([4, 6]);
            ctx.beginPath();
            ghostRaw.forEach((p, i) => {
                const cp = toCanvas(p.px, p.py);
                i === 0 ? ctx.moveTo(cp.x, cp.y) : ctx.lineTo(cp.x, cp.y);
            });
            ctx.strokeStyle = 'rgba(255,159,67,0.12)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Glowing live trail
            drawTrail(ctx, trail, '#ff9f43', 3);

            // Launch marker
            const lp = toCanvas(0, h0);
            drawDot(ctx, lp.x, lp.y, 4, '#555');

            // Max height dashed line
            const mhp = toCanvas(vx * (vy / g), maxH);
            ctx.save();
            ctx.setLineDash([3, 5]);
            drawLine(ctx, mhp.x, mhp.y, mhp.x, 500, 'rgba(255,159,67,0.15)', 1);
            ctx.setLineDash([]);
            ctx.restore();

            // Max height label
            ctx.save();
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillStyle = 'rgba(255,159,67,0.6)';
            ctx.fillText(`↕ H = ${maxH.toFixed(1)} m`, mhp.x + 6, mhp.y - 4);
            ctx.restore();

            // Range marker
            const rp = toCanvas(range, 0);
            ctx.save();
            ctx.setLineDash([3, 5]);
            drawLine(ctx, lp.x, 504, rp.x, 504, 'rgba(78,205,196,0.3)', 1);
            ctx.setLineDash([]);
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillStyle = 'rgba(78,205,196,0.6)';
            ctx.fillText(`↔ R = ${range.toFixed(1)} m`, (lp.x + rp.x) / 2 - 30, 520);
            ctx.restore();

            // Projectile dot
            drawDot(ctx, this.cx, this.cy, 10, '#ff9f43');

            // Velocity components
            const vs = 1.8;
            drawArrow(ctx, this.cx, this.cy, this.cx + this.currentVx * vs, this.cy, '#4ecdc4', `vx ${this.currentVx.toFixed(1)}`);
            drawArrow(ctx, this.cx, this.cy, this.cx, this.cy - this.currentVy * vs, '#e056fd', `vy ${this.currentVy.toFixed(1)}`);

            // Resultant velocity
            const speed = Math.sqrt(this.currentVx ** 2 + this.currentVy ** 2);
            drawArrow(ctx, this.cx, this.cy, this.cx + this.currentVx * vs, this.cy - this.currentVy * vs, '#ffffff', `v ${speed.toFixed(1)}`);

            if (landed) {
                ctx.save();
                ctx.font = 'bold 15px "JetBrains Mono", monospace';
                ctx.shadowColor = '#4ecdc4';
                ctx.shadowBlur = 12;
                ctx.fillStyle = '#4ecdc4';
                ctx.fillText('🎯 Landed', this.cx + 14, this.cy - 12);
                ctx.shadowBlur = 0;
                ctx.restore();
            }

            // HUD
            drawHUD(ctx, [
                `${params.object || 'Projectile'} — v₀=${v0} m/s  θ=${angle}°`,
                `t = ${(this.t || 0).toFixed(2)} s`,
                `x = ${(this.x || 0).toFixed(1)} m   y = ${(this.y || 0).toFixed(1)} m`,
                `Range = ${range.toFixed(1)} m   H_max = ${maxH.toFixed(1)} m`,
                `T = ${tFlight.toFixed(2)} s   g = ${g} m/s²`,
            ]);
        }
    });
}
