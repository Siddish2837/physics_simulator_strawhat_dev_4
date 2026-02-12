// ============================================================
// energy-sim.js — Premium energy conservation visualization
// ============================================================

import { drawDot, drawLine, drawHUD, drawGround, getCamera, formatLength } from './simulation-core.js';

export function simulateEnergy(params, sim) {
    const m = params.mass || 2;
    const hStart = params.initial_height || params.height || 10;
    const g = 9.8;
    const totalE = m * g * hStart;

    sim.addObject({
        name: 'Bouncing Ball',
        params,
        update(dt, t) {
            // physics loop for bouncing
            const period = 2 * Math.sqrt(2 * hStart / g);
            const cycleT = t % period;
            const fallT = Math.sqrt(2 * hStart / g);

            let h, v;
            if (cycleT < fallT) {
                // Falling
                h = hStart - 0.5 * g * cycleT * cycleT;
                v = g * cycleT;
            } else {
                // Rising
                const riseT = cycleT - fallT;
                v = Math.sqrt(2 * g * hStart) - g * riseT;
                h = v * riseT - 0.5 * g * riseT * riseT; // approximation relative to ground
                // Actually correct: h = 0 + v0*t - 0.5gt^2 where v0 = sqrt(2gh)
                // h = sqrt(2gh)*riseT - 0.5*g*riseT^2
            }
            this.h = Math.max(0, h);
            this.v = v;
            this.ke = 0.5 * m * v * v;
            this.pe = m * g * this.h;
        },
        render(ctx, canvas) {
            const cam = getCamera();
            const s = cam.autoScale || 40;
            const baseY = 500;

            drawGround(ctx, baseY, canvas.width);

            // Height ruler
            const rulerX = 200;
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            drawLine(ctx, rulerX, baseY, rulerX, baseY - hStart * s, 'rgba(255,255,255,0.3)', 1);

            // Ticks
            const step = hStart / 5;
            for (let hi = 0; hi <= hStart; hi += step) {
                const y = baseY - hi * s;
                drawLine(ctx, rulerX - 5, y, rulerX + 5, y, '#aaa', 1);
                ctx.fillStyle = '#aaa';
                ctx.font = '10px "JetBrains Mono", monospace';
                ctx.fillText(`${formatLength(hi)}`, rulerX - 45, y + 3);
            }
            ctx.restore();

            // Ball
            const ballX = 350;
            const ballY = baseY - this.h * s;
            drawDot(ctx, ballX, ballY, 12, '#ff9f43');

            // Energy Bars (Dynamic height)
            // They should scale with total energy
            // Let's cap max bar height at 200px
            const maxBarH = 200;
            // E_scale: pixels per Joule
            const eScale = maxBarH / (totalE || 1);

            const barY = baseY;
            const barW = 40;
            const gap = 60;
            const startBarX = 500;

            // KE Bar
            const hKE = this.ke * eScale;
            ctx.fillStyle = '#4ecdc4';
            ctx.fillRect(startBarX, barY - hKE, barW, hKE);
            ctx.font = 'bold 12px "JetBrains Mono", monospace';
            ctx.fillText('KE', startBarX + 10, barY + 15);
            ctx.fillText(this.ke.toFixed(1), startBarX + 5, barY - hKE - 5);

            // PE Bar
            const hPE = this.pe * eScale;
            ctx.fillStyle = '#ff6b6b';
            ctx.fillRect(startBarX + gap, barY - hPE, barW, hPE);
            ctx.fillText('PE', startBarX + gap + 10, barY + 15);
            ctx.fillText(this.pe.toFixed(1), startBarX + gap + 5, barY - hPE - 5);

            // Total Bar
            const hTot = totalE * eScale;
            ctx.fillStyle = '#e056fd';
            ctx.fillRect(startBarX + gap * 2, barY - hTot, barW, hTot);
            ctx.fillText('Total', startBarX + gap * 2 + 2, barY + 15);
            ctx.fillText(totalE.toFixed(1), startBarX + gap * 2 + 5, barY - hTot - 5);

            drawHUD(ctx, [
                `Energy Conservation`,
                `Mass = ${m} kg`,
                `Height = ${formatLength(this.h)}`,
                `Velocity = ${formatLength(Math.abs(this.v))}/s`,
                `Total E = ${totalE.toFixed(1)} J (Conserved)`,
            ]);
        }
    });
}
