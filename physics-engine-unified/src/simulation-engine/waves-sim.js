// ============================================================
// waves-sim.js — Premium transverse wave visualization
// ============================================================

import { drawDot, drawLine, drawHUD, getCamera, drawArrow, formatLength } from './simulation-core.js';

export function simulateWave(params, sim) {
    const A = (params.waves?.amplitude || 1);
    const f = params.waves?.frequency || 2;
    const lambda = params.waves?.wavelength || 2;
    const phase = params.waves?.phase || 0;
    const speed = params.waves?.speed || f * lambda;
    const k = (2 * Math.PI) / lambda;
    const omega = 2 * Math.PI * f;
    const baseY = 300;

    sim.addObject({
        name: 'wave',
        params,
        update(dt, t) { this.t = t; },
        render(ctx, canvas) {
            const cam = getCamera();
            const s = cam.autoScale || 50;
            const W = canvas.width;

            // Baseline
            drawLine(ctx, -W * 4, baseY, W * 4, baseY, 'rgba(255,255,255,0.06)', 1);

            // Waveform
            ctx.save();
            ctx.shadowColor = '#00f5ff';
            ctx.shadowBlur = 14;
            ctx.beginPath();

            // Draw specifically across the visible range + margin
            // We use a large range to catch pan/zoom
            const startX = -2000;
            const endX = 4000;
            const step = Math.max(2, 1 / cam.zoom); // adaptive step size for performance

            for (let px = startX; px < endX; px += step) {
                // px is screen-space x (before camera transform? No, inside transform)
                // We want x in physics units relative to the "center" (450)
                const physX = (px - 450) / s;
                const physY = A * Math.sin(omega * this.t - k * physX + phase);
                const cy = baseY - physY * s;

                px === startX ? ctx.moveTo(px, cy) : ctx.lineTo(px, cy);
            }

            ctx.strokeStyle = '#00f5ff';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.fillStyle = 'rgba(0, 245, 255, 0.05)';
            ctx.lineTo(endX, baseY);
            ctx.lineTo(startX, baseY);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();

            // Indicators (wavelength, amplitude)
            // Draw at center (x=450 in canvas space)
            const mx = 450;
            const physY_mid = A * Math.sin(omega * this.t + phase); // x=0

            // Amplitude line at x=0
            const peakY = baseY - A * s;
            drawLine(ctx, mx, baseY, mx, peakY, '#e056fd', 2);
            drawDot(ctx, mx, peakY, 4, '#e056fd');

            ctx.save();
            ctx.fillStyle = '#e056fd';
            ctx.font = '11px "JetBrains Mono", monospace';
            // Ensure text isn't flipped if we had negative scale (unlikely)
            ctx.fillText(`A=${formatLength(A)}`, mx + 8, (baseY + peakY) / 2);
            ctx.restore();

            // Wavelength (show one full cycle starting from a zero-crossing or peak)
            // Let's just draw fixed wavelength marker below
            const yMark = baseY + A * s + 30;
            const xStart = mx;
            const xEnd = mx + lambda * s;

            if (xEnd - xStart > 20) { // Only draw if visible enough
                drawLine(ctx, xStart, yMark, xEnd, yMark, '#ff9f43', 2);
                drawLine(ctx, xStart, yMark - 5, xStart, yMark + 5, '#ff9f43', 2);
                drawLine(ctx, xEnd, yMark - 5, xEnd, yMark + 5, '#ff9f43', 2);

                ctx.save();
                ctx.fillStyle = '#ff9f43';
                ctx.textAlign = 'center';
                ctx.font = '11px "JetBrains Mono", monospace';
                ctx.fillText(`λ=${formatLength(lambda)}`, (xStart + xEnd) / 2, yMark + 15);
                ctx.restore();
            }

            // Particle motion indicator (a red dot generated at x=550 moving up/down)
            const pxPart = 550;
            const physXPart = (pxPart - 450) / s;
            const partY = baseY - A * Math.sin(omega * this.t - k * physXPart + phase) * s;
            drawDot(ctx, pxPart, partY, 6, '#ff6b6b');
            drawArrow(ctx, pxPart, partY, pxPart, partY + (Math.cos(omega * this.t - k * physXPart + phase) > 0 ? -30 : 30), '#ff6b6b', 'v_p');

            drawHUD(ctx, [
                `Wave — ${params.waves?.type || 'transverse'}`,
                `y = A·sin(2πft − kx)`,
                `A = ${formatLength(A)}   f = ${f} Hz   λ = ${formatLength(lambda)}`,
                `v = ${formatLength(speed)}/s   T = ${(1 / f).toFixed(3)} s`,
            ]);
        }
    });
}
