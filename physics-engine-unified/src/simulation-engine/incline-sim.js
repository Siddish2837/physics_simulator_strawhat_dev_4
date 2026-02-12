// ============================================================
// incline-sim.js — Inclined plane motion visualization
// ============================================================

import { drawDot, drawArrow, drawLine, drawHUD, drawLabel } from './simulation-core.js';

export function simulateIncline(params, sim) {
    const mass = params.mass || 5;
    const g = params.gravity || 9.8;
    const angle = params.incline?.angle || params.launch_angle || 30;
    const mu = params.friction?.kinetic_coefficient || 0;
    const rad = (angle * Math.PI) / 180;
    const W = mass * g;
    const N = W * Math.cos(rad);
    const Fpar = W * Math.sin(rad);
    const Ffric = mu * N;
    const netF = Fpar - Ffric;
    const accel = netF / mass;
    const isSliding = netF > 0;

    // Incline geometry
    const ix = 120, iy = 450;
    const inclineLen = 500;
    const topX = ix + inclineLen * Math.cos(rad);
    const topY = iy - inclineLen * Math.sin(rad);
    const blockSize = 36;

    let t_pos = 0.85; // position along incline (0 = bottom, 1 = top)

    sim.addObject({
        name: params.object || 'Block',
        params,
        cx: 0, cy: 0,
        update(dt, t) {
            if (isSliding) {
                t_pos -= accel * dt * 0.003;
                if (t_pos < 0.05) t_pos = 0.85;
            }
            this.cx = ix + t_pos * (topX - ix);
            this.cy = iy + t_pos * (topY - iy);
        },
        render(ctx, canvas) {
            const CW = canvas.width;

            // Incline surface
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(ix, iy);
            ctx.lineTo(topX, topY);
            ctx.lineTo(ix, iy);
            ctx.closePath();

            // Filled triangle
            ctx.beginPath();
            ctx.moveTo(ix, iy);
            ctx.lineTo(topX, topY);
            ctx.lineTo(topX, iy);
            ctx.closePath();
            const grd = ctx.createLinearGradient(ix, iy, topX, topY);
            grd.addColorStop(0, 'rgba(50,60,90,0.6)');
            grd.addColorStop(1, 'rgba(30,40,70,0.4)');
            ctx.fillStyle = grd;
            ctx.fill();

            // Incline line
            ctx.beginPath();
            ctx.moveTo(ix, iy);
            ctx.lineTo(topX, topY);
            ctx.strokeStyle = 'rgba(100,140,200,0.6)';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Base & height lines
            ctx.strokeStyle = 'rgba(100,140,200,0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(ix, iy);
            ctx.lineTo(topX, iy);
            ctx.lineTo(topX, topY);
            ctx.stroke();

            // Angle arc
            ctx.beginPath();
            ctx.arc(ix, iy, 50, -rad, 0);
            ctx.strokeStyle = '#ffd93d';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.font = 'bold 12px "JetBrains Mono", monospace';
            ctx.fillStyle = '#ffd93d';
            ctx.fillText(`θ = ${angle}°`, ix + 55, iy - 8);
            ctx.restore();

            // Block on incline
            const bx = this.cx, by = this.cy;
            ctx.save();
            ctx.translate(bx, by);
            ctx.rotate(-rad);
            const bg = ctx.createLinearGradient(-blockSize / 2, -blockSize, blockSize / 2, 0);
            bg.addColorStop(0, '#e056fd');
            bg.addColorStop(1, '#9b59b6');
            ctx.fillStyle = bg;
            ctx.shadowColor = '#e056fd';
            ctx.shadowBlur = 12;
            ctx.fillRect(-blockSize / 2, -blockSize, blockSize, blockSize);
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.strokeRect(-blockSize / 2, -blockSize, blockSize, blockSize);
            ctx.restore();

            // Force arrows (in world space, emanating from block center)
            const bcx = bx, bcy = by - blockSize / 2;

            // Weight (straight down)
            const wLen = 60;
            drawArrow(ctx, bcx, bcy, bcx, bcy + wLen, '#e056fd', `W = ${W.toFixed(1)} N`);

            // Normal force (perpendicular to surface, outward)
            const nLen = N * 0.8;
            const nx = -Math.sin(rad);
            const ny = -Math.cos(rad);
            drawArrow(ctx, bcx, bcy, bcx + nx * nLen, bcy + ny * nLen, '#4ecdc4', `N = ${N.toFixed(1)} N`);

            // Parallel component (down the slope)
            const pLen = Fpar * 0.8;
            const px = Math.cos(rad);
            const py = -Math.sin(rad);
            drawArrow(ctx, bcx, bcy, bcx - px * pLen, bcy + py * pLen, '#ff6b6b', `F∥ = ${Fpar.toFixed(1)} N`);

            // Friction (up the slope, if present)
            if (mu > 0) {
                const frLen = Ffric * 0.8;
                drawArrow(ctx, bcx, bcy, bcx + px * frLen, bcy - py * frLen, '#ffd93d', `f = ${Ffric.toFixed(1)} N`);
            }

            // Status
            ctx.save();
            ctx.font = 'bold 13px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = isSliding ? '#4ecdc4' : '#ffd93d';
            ctx.fillText(
                isSliding ? `Sliding ↓  a = ${accel.toFixed(2)} m/s²` : 'Stationary — friction balances gravity',
                CW / 2, 50
            );
            ctx.textAlign = 'left';
            ctx.restore();

            // HUD
            drawHUD(ctx, [
                `Inclined Plane — θ=${angle}°  ${mu > 0 ? 'μ=' + mu : 'frictionless'}`,
                `m = ${mass} kg   g = ${g} m/s²`,
                `W = ${W.toFixed(1)} N`,
                `N = W·cos(θ) = ${N.toFixed(1)} N`,
                `F∥ = W·sin(θ) = ${Fpar.toFixed(1)} N`,
                mu > 0 ? `f = μN = ${Ffric.toFixed(1)} N` : '',
                `a = ${accel.toFixed(2)} m/s²`,
            ].filter(Boolean));
        }
    });
}
