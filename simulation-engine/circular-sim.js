// ============================================================
// circular-sim.js — Premium circular motion visualization
// ============================================================

import { drawDot, drawArrow, drawLine, drawHUD, getCamera } from './simulation-core.js';

export function simulateCircularMotion(params, sim) {
    const r = params.radius || 100;
    const omega = params.angular_velocity || 2;
    const mass = params.mass || 1;
    const cx = 450, cy = 300; // center of canvas

    sim.addObject({
        name: params.object || 'Object',
        params,
        theta: 0, cx: 0, cy: 0,
        update(dt, t) {
            // Use autoScale from camera so it fits regardless of radius size (e.g. 10m vs 1000km)
            const scale = getCamera().autoScale;

            this.theta = omega * t;
            this.px = cx + r * scale * Math.cos(this.theta);
            this.py = cy - r * scale * Math.sin(this.theta);
            this.t = t;
            this.cx = this.px;
            this.cy = this.py;
            this.scale = scale;
        },
        render(ctx_r, canvas) {
            const scale = this.scale || 1;
            const speed = omega * r;
            const ac = omega * omega * r;

            // Orbit glow
            ctx_r.save();
            ctx_r.shadowColor = '#6c5ce7';
            ctx_r.shadowBlur = 15;
            ctx_r.beginPath();
            ctx_r.arc(cx, cy, r * scale, 0, Math.PI * 2);
            ctx_r.strokeStyle = 'rgba(108,92,231,0.25)';
            ctx_r.lineWidth = 2;
            ctx_r.stroke();
            ctx_r.shadowBlur = 0;
            ctx_r.restore();

            // Angle arc
            ctx_r.save();
            ctx_r.beginPath();
            ctx_r.arc(cx, cy, r * scale, 0, -this.theta, true);
            ctx_r.strokeStyle = 'rgba(224,86,253,0.15)';
            ctx_r.lineWidth = r * scale * 0.3;
            ctx_r.stroke();
            ctx_r.restore();

            // Center
            drawDot(ctx_r, cx, cy, 4, '#555');
            drawLine(ctx_r, cx, cy, this.px, this.py, 'rgba(255,255,255,0.12)', 1);

            // Object
            drawDot(ctx_r, this.px, this.py, 10, '#e056fd');

            // Velocity (tangent)
            const vx = -speed * Math.sin(this.theta);
            const vy = -speed * Math.cos(this.theta);
            // Normalize arrow length relative to view
            const arrowScale = 40 / (speed || 1);
            drawArrow(ctx_r, this.px, this.py, this.px + vx * arrowScale, this.py + vy * arrowScale, '#4ecdc4', `v=${speed.toFixed(1)}`);

            // Acceleration (centripetal)
            const dx = cx - this.px, dy = cy - this.py;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const acLen = 40;
            drawArrow(ctx_r, this.px, this.py, this.px + (dx / dist) * acLen, this.py + (dy / dist) * acLen, '#ff6b6b', `ac=${ac.toFixed(1)}`);

            // Radius label
            ctx_r.save();
            ctx_r.font = '11px "JetBrains Mono", monospace';
            ctx_r.fillStyle = 'rgba(255,255,255,0.3)';
            ctx_r.fillText(`r=${r}m`, cx + r * scale / 2, cy - 6);
            ctx_r.restore();

            // HUD
            const cam = getCamera();
            const T = (2 * Math.PI) / omega;
            const fc = omega / (2 * Math.PI);
            drawHUD(ctx_r, [
                `${params.object || 'Object'} — Circular Motion`,
                `ω = ${omega.toFixed(2)} rad/s   r = ${r} ${cam.unitLabel}`,
                `v = ${speed.toFixed(1)} ${cam.unitLabel}/s`,
                `T = ${T.toFixed(3)} s   f = ${fc.toFixed(3)} Hz`,
                `ac = ${ac.toFixed(2)} ${cam.unitLabel}/s²`,
            ]);
        }
    });
}
