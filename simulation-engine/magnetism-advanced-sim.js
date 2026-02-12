// ============================================================
// magnetism-advanced-sim.js — Field lines & Lorentz force
// ============================================================

import { drawDot, drawArrow, drawTrail, drawHUD } from './simulation-core.js';

export function simulateMagnetismAdvanced(params, sim) {
    const B = params.magnetism?.magnetic_field || 0.5;
    const q = params.electricity?.charge || 1.6e-19;
    const m = params.mass || 9.11e-31;
    const v0 = params.initial_velocity?.magnitude || 1e6;
    const displayScale = 150;
    const omega = q * B / m;
    const radius = m * v0 / (Math.abs(q) * B);
    const F_lorentz = Math.abs(q) * v0 * B;

    const cx = 450, cy = 300;
    const trail = [];

    sim.addObject({
        name: params.object || 'Charged Particle',
        params,
        cx, cy,
        update(dt, t) {
            // Circular motion in magnetic field
            const px = cx + displayScale * Math.cos(omega * t * 1e-12);
            const py = cy + displayScale * Math.sin(omega * t * 1e-12);
            this.cx = px;
            this.cy = py;
            this.t = t;
            trail.push({ x: px, y: py });
            if (trail.length > 400) trail.shift();
        },
        render(ctx, canvas) {
            const W = canvas.width, H = canvas.height;

            // Magnetic field indicators (dots = field into screen)
            ctx.save();
            ctx.fillStyle = 'rgba(100,150,255,0.15)';
            ctx.font = '14px monospace';
            for (let gx = 60; gx < W - 40; gx += 60) {
                for (let gy = 80; gy < H - 40; gy += 60) {
                    // ⊗ symbol for B into screen
                    ctx.arc(gx, gy, 8, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(100,150,255,0.1)';
                    ctx.fill();
                    ctx.fillStyle = 'rgba(100,150,255,0.3)';
                    ctx.beginPath();
                    ctx.arc(gx, gy, 2, 0, Math.PI * 2);
                    ctx.fill();
                    // Cross
                    ctx.strokeStyle = 'rgba(100,150,255,0.15)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(gx - 5, gy - 5); ctx.lineTo(gx + 5, gy + 5);
                    ctx.moveTo(gx + 5, gy - 5); ctx.lineTo(gx - 5, gy + 5);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(100,150,255,0.15)';
                }
            }
            ctx.restore();

            // B-field label
            ctx.save();
            ctx.font = 'bold 13px "JetBrains Mono", monospace';
            ctx.fillStyle = 'rgba(100,150,255,0.5)';
            ctx.textAlign = 'center';
            ctx.fillText(`B = ${B} T  (into screen ⊗)`, W / 2, H - 30);
            ctx.textAlign = 'left';
            ctx.restore();

            // Circular orbit path (ghost)
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, displayScale, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,159,67,0.1)';
            ctx.setLineDash([4, 6]);
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Trail
            drawTrail(ctx, trail, '#ff9f43', 2.5);

            // Particle
            drawDot(ctx, this.cx, this.cy, 10, '#ff9f43');

            // Velocity arrow (tangent)
            const t = this.t || 0;
            const vxDir = -Math.sin(omega * t * 1e-12);
            const vyDir = Math.cos(omega * t * 1e-12);
            const arrowLen = 50;
            drawArrow(ctx, this.cx, this.cy, this.cx + vxDir * arrowLen, this.cy + vyDir * arrowLen, '#4ecdc4', 'v');

            // Force arrow (centripetal = toward center)
            const fxDir = cx - this.cx;
            const fyDir = cy - this.cy;
            const fLen = Math.sqrt(fxDir * fxDir + fyDir * fyDir);
            if (fLen > 0) {
                const fnx = fxDir / fLen * 40;
                const fny = fyDir / fLen * 40;
                drawArrow(ctx, this.cx, this.cy, this.cx + fnx, this.cy + fny, '#ff6b6b', 'F');
            }

            // Title
            ctx.save();
            ctx.font = 'bold 13px "JetBrains Mono", monospace';
            ctx.fillStyle = '#ff9f43';
            ctx.textAlign = 'center';
            ctx.fillText('Charged Particle in Magnetic Field — Lorentz Force', W / 2, 40);
            ctx.textAlign = 'left';
            ctx.restore();

            drawHUD(ctx, [
                `Magnetic Field — B = ${B} T`,
                `q = ${q.toExponential(2)} C`,
                `m = ${m.toExponential(2)} kg`,
                `v = ${v0.toExponential(2)} m/s`,
                `F = qvB = ${F_lorentz.toExponential(2)} N`,
                `r = mv/qB = ${radius.toExponential(2)} m`,
            ]);
        }
    });
}
