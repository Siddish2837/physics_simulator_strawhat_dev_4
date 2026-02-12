// ============================================================
// motion-sim.js — Premium linear motion visualization
// ============================================================

import { drawDot, drawArrow, drawTrail, drawGround, drawHUD, toCanvas, getCamera } from './simulation-core.js';

export function simulateLinearMotion(params, sim) {
    const x0 = params.initial_position?.x0 || 0;
    const v0 = params.initial_velocity?.magnitude || 5;
    const a = params.acceleration?.value || 0;
    const trail = [];

    sim.addObject({
        name: params.object || 'Object',
        params,
        cx: 0, cy: 0,
        update(dt, t) {
            this.t = t;
            this.x = x0 + v0 * t + 0.5 * a * t * t;
            this.v = v0 + a * t;
            const pos = toCanvas(this.x, 0);
            this.cx = pos.x;
            this.cy = pos.y;
            trail.push({ x: this.cx, y: this.cy });
            if (trail.length > 400) trail.shift();
        },
        render(ctx, canvas) {
            drawGround(ctx, 500, canvas.width);

            // Position markers on ground
            ctx.save();
            ctx.font = '9px "JetBrains Mono", monospace';
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            const cam = getCamera();
            const step = Math.max(5, Math.round(20 / (cam.autoScale || 1)) * 5);
            for (let m = 0; m <= 500; m += step) {
                const px = toCanvas(m, 0).x;
                if (px > 30 && px < canvas.width - 30) {
                    ctx.fillText(`${m}m`, px - 8, 516);
                    ctx.beginPath();
                    ctx.moveTo(px, 498);
                    ctx.lineTo(px, 504);
                    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
            ctx.restore();

            drawTrail(ctx, trail, '#00f5ff', 2.5);
            drawDot(ctx, this.cx, this.cy, 12, '#00f5ff');

            const vScale = 2.5;
            drawArrow(ctx, this.cx, this.cy - 25, this.cx + this.v * vScale, this.cy - 25, '#4ecdc4', `v = ${this.v.toFixed(1)} m/s`);
            if (Math.abs(a) > 0.01) {
                drawArrow(ctx, this.cx, this.cy + 25, this.cx + a * vScale * 4, this.cy + 25, '#ff6b6b', `a = ${a.toFixed(1)} m/s²`);
            }

            const startX = toCanvas(x0, 0).x;
            ctx.save();
            ctx.strokeStyle = 'rgba(255,159,67,0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(startX, 470);
            ctx.lineTo(this.cx, 470);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillStyle = 'rgba(255,159,67,0.6)';
            ctx.fillText(`Δx = ${this.x.toFixed(1)} m`, (startX + this.cx) / 2 - 25, 466);
            ctx.restore();

            drawHUD(ctx, [
                `${params.object || 'Object'} — Linear Motion`,
                `t = ${this.t.toFixed(2)} s`,
                `x = ${this.x.toFixed(2)} m   v = ${this.v.toFixed(2)} m/s`,
                `x = x₀ + v₀t + ½at²`,
                a !== 0 ? `a = ${a} m/s²` : `Uniform velocity`,
            ]);
        }
    });
}
