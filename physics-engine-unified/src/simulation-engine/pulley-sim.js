// ============================================================
// pulley-sim.js — Ideal pulley system visualization
// ============================================================

import { drawDot, drawArrow, drawLine, drawHUD, drawRoundRect } from './simulation-core.js';

export function simulatePulley(params, sim) {
    // Support either single mass1/mass2 or arrays masses_left/masses_right
    let massesL = params.pulley?.masses_left || [];
    let massesR = params.pulley?.masses_right || [];

    // Fallback to mass1/mass2 if arrays are empty
    if (massesL.length === 0) massesL = [params.pulley?.mass1 || 10];
    if (massesR.length === 0) massesR = [params.pulley?.mass2 || 5];

    const m1 = massesL.reduce((a, b) => a + b, 0);
    const m2 = massesR.reduce((a, b) => a + b, 0);
    const g = params.gravity || 9.8;
    const hasSpring = params.pulley?.spring_coupled || false;
    const springK = params.pulley?.spring_constant || 100;

    // Atwood machine physics
    const accel = ((m1 - m2) * g) / (m1 + m2);
    const tension = (2 * m1 * m2 * g) / (m1 + m2);

    const pulleyX = 450, pulleyY = 100, pulleyR = 30;
    const ropeLen = 220;
    let offset = 0;

    sim.addObject({
        name: 'Pulley System',
        params,
        cx: pulleyX, cy: pulleyY,
        update(dt, t) {
            offset += accel * dt * 8;
            if (Math.abs(offset) > 120) offset = 0;
            this.t = t;
        },
        render(ctx, canvas) {
            const W = canvas.width;
            const leftX = pulleyX - 80;
            const rightX = pulleyX + 80;
            const leftBaseY = pulleyY + ropeLen + offset;
            const rightBaseY = pulleyY + ropeLen - offset;

            // Ceiling / support
            ctx.save();
            ctx.fillStyle = 'rgba(80,100,140,0.4)';
            ctx.fillRect(pulleyX - 100, 40, 200, 12);
            for (let i = 0; i < 8; i++) {
                ctx.beginPath();
                ctx.moveTo(pulleyX - 90 + i * 25, 40);
                ctx.lineTo(pulleyX - 100 + i * 25, 30);
                ctx.strokeStyle = 'rgba(80,100,140,0.5)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            ctx.restore();

            // Support rod
            drawLine(ctx, pulleyX, 52, pulleyX, pulleyY - pulleyR, 'rgba(160,180,220,0.5)', 3);

            // Pulley wheel
            ctx.save();
            ctx.beginPath();
            ctx.arc(pulleyX, pulleyY, pulleyR, 0, Math.PI * 2);
            const pg = ctx.createRadialGradient(pulleyX - 5, pulleyY - 5, 2, pulleyX, pulleyY, pulleyR);
            pg.addColorStop(0, '#6a7fbf');
            pg.addColorStop(1, '#3d4f80');
            ctx.fillStyle = pg;
            ctx.shadowColor = '#6a7fbf';
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(pulleyX, pulleyY, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#aaa';
            ctx.fill();
            ctx.restore();

            // Ropes
            ctx.save();
            ctx.strokeStyle = 'rgba(200,210,230,0.6)';
            ctx.lineWidth = 2;

            // Draw rope to highest block on each side
            ctx.beginPath();
            ctx.moveTo(leftX, leftBaseY - 25);
            ctx.lineTo(leftX, pulleyY);
            ctx.arc(pulleyX, pulleyY, pulleyR, Math.PI, Math.PI * 0.5, true);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(rightX, rightBaseY - 25);
            ctx.lineTo(rightX, pulleyY);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(pulleyX, pulleyY, pulleyR, Math.PI, 0, false);
            ctx.stroke();
            ctx.restore();

            // Render Mass Blocks Stacked
            const blockW = 60, blockH = 40;
            const renderStack = (x, y, masses, color1, color2, labelPrefix) => {
                let currentY = y;
                masses.forEach((m, i) => {
                    ctx.save();
                    const g = ctx.createLinearGradient(x - blockW / 2, currentY - blockH, x + blockW / 2, currentY);
                    g.addColorStop(0, color1);
                    g.addColorStop(1, color2);
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    drawRoundRect(ctx, x - blockW / 2, currentY - blockH / 2, blockW, blockH, 4);
                    ctx.fill();

                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'center';
                    ctx.font = 'bold 11px monospace';
                    ctx.fillText(`${labelPrefix}${i + 1}`, x, currentY - 5);
                    ctx.fillText(`${m}kg`, x, currentY + 10);

                    // Draw rope between blocks
                    if (i < masses.length - 1) {
                        drawLine(ctx, x, currentY + blockH / 2, x, currentY + blockH / 2 + 20, 'rgba(200,210,230,0.6)', 2);
                    }
                    ctx.restore();
                    currentY += blockH + 20; // Stack vertically
                });
            };

            renderStack(leftX, leftBaseY, massesL, '#ff6b6b', '#c0392b', 'L');
            renderStack(rightX, rightBaseY, massesR, '#4ecdc4', '#2d8a7e', 'R');

            // Tension arrows (at the top)
            const tScale = 0.35;
            drawArrow(ctx, leftX, leftBaseY - blockH / 2 - 5, leftX, leftBaseY - blockH / 2 - 5 - tension * tScale, '#ffd93d', `T=${tension.toFixed(1)}N`);
            drawArrow(ctx, rightX, rightBaseY - blockH / 2 - 5, rightX, rightBaseY - blockH / 2 - 5 - tension * tScale, '#ffd93d', `T=${tension.toFixed(1)}N`);

            // Total Weight arrows
            drawArrow(ctx, leftX, leftBaseY + (blockH + 20) * massesL.length - 10, leftX, leftBaseY + (blockH + 20) * massesL.length + 40, '#ff6b6b', `ΣW₁=${(m1 * g).toFixed(0)}N`);
            drawArrow(ctx, rightX, rightBaseY + (blockH + 20) * massesR.length - 10, rightX, rightBaseY + (blockH + 20) * massesR.length + 40, '#4ecdc4', `ΣW₂=${(m2 * g).toFixed(0)}N`);

            drawHUD(ctx, [
                `Atwood Machine (Multi-Mass)`,
                `Left: ${massesL.join(' + ')} = ${m1} kg`,
                `Right: ${massesR.join(' + ')} = ${m2} kg`,
                `a = ${accel.toFixed(2)} m/s²`,
                `T = ${tension.toFixed(1)} N`,
            ]);
        }
    });
}
