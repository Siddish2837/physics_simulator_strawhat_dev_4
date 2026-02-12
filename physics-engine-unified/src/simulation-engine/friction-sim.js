// ============================================================
// friction-sim.js — Static & kinetic friction visualization
// ============================================================

import { drawDot, drawArrow, drawLine, drawGround, drawHUD, drawLabel, toCanvas, getCamera, drawRoundRect } from './simulation-core.js';

export function simulateFriction(params, sim) {
    const mass = params.mass || 5;
    const g = params.gravity || 9.8;
    const mu_s = params.friction?.static_coefficient || 0.5;
    const mu_k = params.friction?.kinetic_coefficient || 0.3;
    const appliedF = params.forces?.applied || mass * g * mu_s * 0.8;
    const N = mass * g;
    const f_static_max = mu_s * N;
    const f_kinetic = mu_k * N;
    const isMoving = appliedF > f_static_max;
    const netF = isMoving ? appliedF - f_kinetic : 0;
    const accel = netF / mass;

    const blockW = 80, blockH = 50;
    const groundY = 400;
    let posX = 200;
    let velX = 0;

    sim.addObject({
        name: params.object || 'Block',
        params,
        cx: 0, cy: 0,
        update(dt, t) {
            if (isMoving) {
                velX += accel * dt;
                posX += velX * dt * 30;
                if (posX > 800) { posX = 200; velX = 0; }
            }
            this.cx = posX + blockW / 2;
            this.cy = groundY - blockH / 2;
        },
        render(ctx, canvas) {
            const W = canvas.width;

            // Ground
            drawGround(ctx, groundY, W);

            // Surface texture
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.lineWidth = 1;
            for (let i = 40; i < W - 40; i += 12) {
                ctx.beginPath();
                ctx.moveTo(i, groundY + 2);
                ctx.lineTo(i - 4, groundY + 8);
                ctx.stroke();
            }
            ctx.restore();

            // Block
            const bx = posX, by = groundY - blockH;
            ctx.save();
            const grad = ctx.createLinearGradient(bx, by, bx, by + blockH);
            grad.addColorStop(0, '#4a6fa5');
            grad.addColorStop(1, '#2d4a7a');
            ctx.fillStyle = grad;
            ctx.shadowColor = '#4a6fa5';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            drawRoundRect(ctx, bx, by, blockW, blockH, 6);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Mass label on block
            ctx.font = 'bold 13px "JetBrains Mono", monospace';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText(`${mass} kg`, bx + blockW / 2, by + blockH / 2 + 5);
            ctx.textAlign = 'left';
            ctx.restore();

            const cx = bx + blockW / 2;
            const cy = by + blockH / 2;

            // Applied force (right)
            const fScale = 1.5;
            drawArrow(ctx, cx + blockW / 2, cy, cx + blockW / 2 + appliedF * fScale, cy, '#ff6b6b', `F = ${appliedF.toFixed(1)} N`);

            // Friction force (left)
            const frictionVal = isMoving ? f_kinetic : Math.min(appliedF, f_static_max);
            drawArrow(ctx, cx - blockW / 2, cy, cx - blockW / 2 - frictionVal * fScale, cy, '#ffd93d', `f = ${frictionVal.toFixed(1)} N`);

            // Normal force (up)
            drawArrow(ctx, cx, by, cx, by - N * 0.5, '#4ecdc4', `N = ${N.toFixed(1)} N`);

            // Weight (down)
            drawArrow(ctx, cx, groundY, cx, groundY + mass * g * 0.5, '#e056fd', `W = ${(mass * g).toFixed(1)} N`);

            // Status indicator
            ctx.save();
            ctx.font = 'bold 14px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            if (isMoving) {
                ctx.fillStyle = '#4ecdc4';
                ctx.fillText('✓ Object is MOVING (kinetic friction)', W / 2, 80);
                ctx.font = '11px "JetBrains Mono", monospace';
                ctx.fillStyle = '#888';
                ctx.fillText(`a = ${accel.toFixed(2)} m/s²`, W / 2, 105);
            } else {
                ctx.fillStyle = '#ffd93d';
                ctx.fillText('✗ Object is STATIONARY (static friction)', W / 2, 80);
                ctx.font = '11px "JetBrains Mono", monospace';
                ctx.fillStyle = '#888';
                ctx.fillText(`F_applied (${appliedF.toFixed(1)} N) ≤ f_s_max (${f_static_max.toFixed(1)} N)`, W / 2, 105);
            }
            ctx.textAlign = 'left';
            ctx.restore();

            // HUD
            drawHUD(ctx, [
                `Friction — μs=${mu_s}  μk=${mu_k}`,
                `m = ${mass} kg   g = ${g} m/s²`,
                `N = ${N.toFixed(1)} N`,
                `f_s_max = ${f_static_max.toFixed(1)} N`,
                `f_k = ${f_kinetic.toFixed(1)} N`,
                `F_applied = ${appliedF.toFixed(1)} N`,
                isMoving ? `a = ${accel.toFixed(2)} m/s²` : 'Static: no motion',
            ]);
        }
    });
}
