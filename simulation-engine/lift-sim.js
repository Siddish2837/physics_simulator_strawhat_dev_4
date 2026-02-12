// ============================================================
// lift-sim.js — Basic aerodynamic lift visualization
// ============================================================

import { drawArrow, drawLine, drawHUD } from './simulation-core.js';

export function simulateLift(params, sim) {
    const rho = params.fluid?.density || 1.225; // air
    const v_top = params.lift?.velocity_top || 60;
    const v_bot = params.lift?.velocity_bottom || 45;
    const area = params.lift?.wing_area || 20;
    const P_top = params.lift?.pressure_top || 0.5 * rho * v_top * v_top;
    const P_bot = params.lift?.pressure_bottom || 0.5 * rho * v_bot * v_bot;
    const deltaP = P_bot - P_top;
    const liftForce = deltaP * area;

    // Airflow particles
    const topParticles = [];
    const botParticles = [];
    for (let i = 0; i < 25; i++) {
        topParticles.push({ x: Math.random() * 900, y: 250 + (Math.random() - 0.5) * 80 });
        botParticles.push({ x: Math.random() * 900, y: 370 + (Math.random() - 0.5) * 80 });
    }

    sim.addObject({
        name: 'Wing',
        params,
        cx: 450, cy: 310,
        update(dt, t) {
            const speedScale = 80;
            for (const p of topParticles) {
                p.x += v_top / speedScale * 120 * dt;
                if (p.x > 920) p.x = -20;
            }
            for (const p of botParticles) {
                p.x += v_bot / speedScale * 120 * dt;
                if (p.x > 920) p.x = -20;
            }
        },
        render(ctx, canvas) {
            const W = canvas.width, H = canvas.height;
            const wingCX = W / 2, wingCY = 310;

            // Airfoil shape
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(wingCX - 180, wingCY);
            // Top surface (curved)
            ctx.bezierCurveTo(wingCX - 100, wingCY - 65, wingCX + 60, wingCY - 55, wingCX + 180, wingCY);
            // Bottom surface (flatter)
            ctx.bezierCurveTo(wingCX + 60, wingCY + 15, wingCX - 100, wingCY + 15, wingCX - 180, wingCY);
            ctx.closePath();
            const wg = ctx.createLinearGradient(wingCX, wingCY - 60, wingCX, wingCY + 15);
            wg.addColorStop(0, '#5a7fbf');
            wg.addColorStop(1, '#3d5a80');
            ctx.fillStyle = wg;
            ctx.shadowColor = '#5a7fbf';
            ctx.shadowBlur = 20;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();

            // Top airflow particles (faster)
            for (const p of topParticles) {
                if (p.y < wingCY - 5) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = '#ff6b6b';
                    ctx.shadowColor = '#ff6b6b';
                    ctx.shadowBlur = 4;
                    ctx.fill();
                    ctx.restore();
                }
            }

            // Bottom airflow particles (slower)
            for (const p of botParticles) {
                if (p.y > wingCY + 5) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = '#4ecdc4';
                    ctx.shadowColor = '#4ecdc4';
                    ctx.shadowBlur = 4;
                    ctx.fill();
                    ctx.restore();
                }
            }

            // Labels for speeds
            ctx.save();
            ctx.font = '12px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff6b6b';
            ctx.fillText(`v_top = ${v_top} m/s  (faster → lower P)`, W / 2, 200);
            ctx.fillStyle = '#4ecdc4';
            ctx.fillText(`v_bot = ${v_bot} m/s  (slower → higher P)`, W / 2, 430);
            ctx.restore();

            // Lift force arrow (big upward arrow)
            drawArrow(ctx, wingCX, wingCY, wingCX, wingCY - 120, '#ffd93d', `Lift = ${liftForce.toFixed(0)} N`);

            // Pressure labels
            ctx.save();
            ctx.font = '11px "JetBrains Mono", monospace';
            ctx.textAlign = 'right';
            ctx.fillStyle = '#ff6b6b';
            ctx.fillText(`P_top = ${P_top.toFixed(0)} Pa`, wingCX - 200, wingCY - 30);
            ctx.fillStyle = '#4ecdc4';
            ctx.fillText(`P_bot = ${P_bot.toFixed(0)} Pa`, wingCX - 200, wingCY + 40);
            ctx.textAlign = 'left';
            ctx.restore();

            // Title
            ctx.save();
            ctx.font = 'bold 14px "JetBrains Mono", monospace';
            ctx.fillStyle = '#ffd93d';
            ctx.textAlign = 'center';
            ctx.fillText('Bernoulli Lift: ΔP × A = F_lift', W / 2, 55);
            ctx.textAlign = 'left';
            ctx.restore();

            drawHUD(ctx, [
                `Lift — ρ = ${rho} kg/m³`,
                `v_top = ${v_top} m/s  v_bot = ${v_bot} m/s`,
                `ΔP = ${deltaP.toFixed(0)} Pa`,
                `A = ${area} m²`,
                `F_lift = ${liftForce.toFixed(0)} N`,
            ]);
        }
    });
}
