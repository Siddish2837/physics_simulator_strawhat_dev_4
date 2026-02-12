// ============================================================
// fluid-sim.js — Bernoulli equation & continuity visualization
// ============================================================

import { drawArrow, drawLine, drawHUD, drawLabel } from './simulation-core.js';

export function simulateFluid(params, sim) {
    const rho = params.fluid?.density || 1000;
    const A1 = params.fluid?.area1 || 0.05;
    const A2 = params.fluid?.area2 || 0.02;
    const v1 = params.fluid?.velocity1 || 2;
    const v2 = (A1 * v1) / A2; // Continuity: A1v1 = A2v2
    const h1 = params.fluid?.height1 || 0;
    const h2 = params.fluid?.height2 || 0;
    const g = params.gravity || 9.8;
    const P1 = params.fluid?.pressure1 || 101325;
    // Bernoulli: P1 + 0.5ρv1² + ρgh1 = P2 + 0.5ρv2² + ρgh2
    const P2 = P1 + 0.5 * rho * (v1 * v1 - v2 * v2) + rho * g * (h1 - h2);

    // Pipe geometry
    const pipeStartX = 80, pipeEndX = 820;
    const pipeMidX = 400;
    const pipeY = 300;
    const h1px = 80, h2px = 40; // half-heights of pipe sections

    // Fluid particles
    const particles = [];
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: pipeStartX + Math.random() * (pipeEndX - pipeStartX),
            section: 0,
            y: pipeY + (Math.random() - 0.5) * h1px * 1.5,
        });
    }

    sim.addObject({
        name: 'Fluid Flow',
        params,
        cx: 450, cy: 300,
        update(dt, t) {
            for (const p of particles) {
                const inNarrow = p.x > pipeMidX - 40;
                const speed = inNarrow ? v2 * 25 : v1 * 25;
                p.x += speed * dt;

                // Constrain y to pipe
                const halfH = inNarrow ? h2px : h1px;
                const targetY = pipeY + (p.y - pipeY) * (inNarrow ? h2px / h1px : 1);
                p.y += (targetY - p.y) * 0.05;

                if (p.x > pipeEndX + 10) {
                    p.x = pipeStartX - 5;
                    p.y = pipeY + (Math.random() - 0.5) * h1px * 1.5;
                }
            }
        },
        render(ctx, canvas) {
            const W = canvas.width;

            // Pipe outline — wide section
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(pipeStartX, pipeY - h1px);
            ctx.lineTo(pipeMidX - 60, pipeY - h1px);
            // Transition
            ctx.quadraticCurveTo(pipeMidX, pipeY - h1px, pipeMidX + 20, pipeY - h2px);
            ctx.lineTo(pipeEndX, pipeY - h2px);
            ctx.lineTo(pipeEndX, pipeY + h2px);
            ctx.lineTo(pipeMidX + 20, pipeY + h2px);
            ctx.quadraticCurveTo(pipeMidX, pipeY + h1px, pipeMidX - 60, pipeY + h1px);
            ctx.lineTo(pipeStartX, pipeY + h1px);
            ctx.closePath();

            const pipeGrad = ctx.createLinearGradient(0, pipeY - h1px, 0, pipeY + h1px);
            pipeGrad.addColorStop(0, 'rgba(30,80,160,0.3)');
            pipeGrad.addColorStop(0.5, 'rgba(50,120,220,0.15)');
            pipeGrad.addColorStop(1, 'rgba(30,80,160,0.3)');
            ctx.fillStyle = pipeGrad;
            ctx.fill();
            ctx.strokeStyle = 'rgba(100,160,255,0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();

            // Fluid particles
            for (const p of particles) {
                const inNarrow = p.x > pipeMidX - 40;
                const halfH = inNarrow ? h2px : h1px;
                if (Math.abs(p.y - pipeY) < halfH + 5) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                    ctx.fillStyle = inNarrow ? '#ff6b6b' : '#4ecdc4';
                    ctx.shadowColor = inNarrow ? '#ff6b6b' : '#4ecdc4';
                    ctx.shadowBlur = 6;
                    ctx.fill();
                    ctx.restore();
                }
            }

            // Velocity arrows
            drawArrow(ctx, 160, pipeY - h1px - 25, 260, pipeY - h1px - 25, '#4ecdc4', `v₁ = ${v1.toFixed(1)} m/s`);
            drawArrow(ctx, 580, pipeY - h2px - 25, 720, pipeY - h2px - 25, '#ff6b6b', `v₂ = ${v2.toFixed(1)} m/s`);

            // Area labels
            ctx.save();
            ctx.font = '11px "JetBrains Mono", monospace';
            ctx.fillStyle = '#4ecdc4';
            ctx.textAlign = 'center';
            ctx.fillText(`A₁ = ${A1} m²`, 200, pipeY + h1px + 30);
            ctx.fillStyle = '#ff6b6b';
            ctx.fillText(`A₂ = ${A2} m²`, 650, pipeY + h2px + 30);
            ctx.restore();

            // Pressure bars
            const barW = 18, barMaxH = 100;
            const p1h = Math.min(barMaxH, (P1 / 200000) * barMaxH);
            const p2h = Math.min(barMaxH, (P2 / 200000) * barMaxH);

            // P1 bar
            ctx.save();
            const g1 = ctx.createLinearGradient(0, pipeY + h1px + 50 + barMaxH - p1h, 0, pipeY + h1px + 50 + barMaxH);
            g1.addColorStop(0, '#4ecdc4');
            g1.addColorStop(1, '#2d8a7e');
            ctx.fillStyle = g1;
            ctx.fillRect(140 - barW / 2, pipeY + h1px + 50 + barMaxH - p1h, barW, p1h);
            ctx.strokeStyle = 'rgba(78,205,196,0.4)';
            ctx.strokeRect(140 - barW / 2, pipeY + h1px + 50, barW, barMaxH);
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillStyle = '#4ecdc4';
            ctx.textAlign = 'center';
            ctx.fillText(`P₁`, 140, pipeY + h1px + 50 + barMaxH + 16);
            ctx.fillText(`${(P1 / 1000).toFixed(1)} kPa`, 140, pipeY + h1px + 50 - 8);

            // P2 bar
            const g2 = ctx.createLinearGradient(0, pipeY + h2px + 50 + barMaxH - p2h, 0, pipeY + h2px + 50 + barMaxH);
            g2.addColorStop(0, '#ff6b6b');
            g2.addColorStop(1, '#c0392b');
            ctx.fillStyle = g2;
            ctx.fillRect(700 - barW / 2, pipeY + h2px + 50 + barMaxH - p2h, barW, p2h);
            ctx.strokeStyle = 'rgba(255,107,107,0.4)';
            ctx.strokeRect(700 - barW / 2, pipeY + h2px + 50, barW, barMaxH);
            ctx.fillStyle = '#ff6b6b';
            ctx.fillText(`P₂`, 700, pipeY + h2px + 50 + barMaxH + 16);
            ctx.fillText(`${(P2 / 1000).toFixed(1)} kPa`, 700, pipeY + h2px + 50 - 8);
            ctx.restore();

            // Continuity equation label
            ctx.save();
            ctx.font = 'bold 13px "JetBrains Mono", monospace';
            ctx.fillStyle = '#ffd93d';
            ctx.textAlign = 'center';
            ctx.fillText('A₁v₁ = A₂v₂  (Continuity)', W / 2, 60);
            ctx.font = '12px "JetBrains Mono", monospace';
            ctx.fillStyle = '#aaa';
            ctx.fillText('P + ½ρv² + ρgh = const  (Bernoulli)', W / 2, 85);
            ctx.textAlign = 'left';
            ctx.restore();

            drawHUD(ctx, [
                `Fluid Flow — ρ = ${rho} kg/m³`,
                `A₁ = ${A1} m²  v₁ = ${v1.toFixed(1)} m/s`,
                `A₂ = ${A2} m²  v₂ = ${v2.toFixed(1)} m/s`,
                `P₁ = ${(P1 / 1000).toFixed(1)} kPa`,
                `P₂ = ${(P2 / 1000).toFixed(1)} kPa`,
            ]);
        }
    });
}
