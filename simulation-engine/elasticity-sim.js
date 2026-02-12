// ============================================================
// elasticity-sim.js — Stress/strain & Young's modulus
// ============================================================

import { drawDot, drawArrow, drawLine, drawHUD, drawRoundRect } from './simulation-core.js';

export function simulateElasticity(params, sim) {
    const F = params.forces?.applied || 5000;
    const A = params.elasticity?.area || 0.01;
    const L0 = params.elasticity?.original_length || 2;
    const E = params.elasticity?.youngs_modulus || 2e11; // steel
    const stress = F / A;
    const strain = stress / E;
    const deltaL = strain * L0;
    const Lf = L0 + deltaL;

    const barX = 200, barY = 250;
    const barW0 = 400; // pixels for original length
    const barH = 60;
    const pixPerM = barW0 / L0;
    const extension = deltaL * pixPerM * 200; // exaggerated for visibility

    let animProg = 0;

    sim.addObject({
        name: params.object || 'Elastic Bar',
        params,
        cx: 400, cy: 280,
        update(dt, t) {
            animProg = Math.min(1, animProg + dt * 0.4);
            this.currentExt = extension * animProg;
            this.t = t;
        },
        render(ctx, canvas) {
            const W = canvas.width, H = canvas.height;
            const ext = this.currentExt || 0;

            // Wall (fixed end)
            ctx.save();
            ctx.fillStyle = 'rgba(80,100,140,0.4)';
            ctx.fillRect(barX - 20, barY - barH, 20, barH * 2 + 20);
            for (let i = 0; i < 7; i++) {
                ctx.beginPath();
                ctx.moveTo(barX - 20, barY - barH + 5 + i * 20);
                ctx.lineTo(barX - 30, barY - barH + 15 + i * 20);
                ctx.strokeStyle = 'rgba(80,100,140,0.5)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            ctx.restore();

            // Original bar (ghost)
            ctx.save();
            ctx.setLineDash([4, 6]);
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY - barH / 2, barW0, barH);
            ctx.setLineDash([]);
            ctx.restore();

            // Stretched bar
            const barWCurrent = barW0 + ext;
            ctx.save();
            const bg = ctx.createLinearGradient(barX, barY - barH / 2, barX + barWCurrent, barY + barH / 2);
            // Color shifts from blue to red as strain increases
            const strainRatio = Math.min(1, ext / (extension + 1));
            const r = Math.floor(60 + strainRatio * 195);
            const b = Math.floor(180 - strainRatio * 130);
            bg.addColorStop(0, `rgb(${r - 20}, 60, ${b})`);
            bg.addColorStop(1, `rgb(${r}, 40, ${b - 30})`);
            ctx.fillStyle = bg;
            ctx.shadowColor = `rgb(${r}, 60, ${b})`;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            drawRoundRect(ctx, barX, barY - barH / 2, barWCurrent, barH, 4);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Cross-hatching for material visualization
            ctx.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx.lineWidth = 0.5;
            for (let x = barX + 10; x < barX + barWCurrent - 5; x += 15) {
                ctx.beginPath();
                ctx.moveTo(x, barY - barH / 2 + 3);
                ctx.lineTo(x + 10, barY + barH / 2 - 3);
                ctx.stroke();
            }
            ctx.restore();

            // Applied force arrow
            drawArrow(ctx, barX + barWCurrent + 5, barY, barX + barWCurrent + 60, barY, '#ff6b6b', `F = ${F} N`);

            // Dimension lines
            // Original length
            ctx.save();
            ctx.strokeStyle = 'rgba(78,205,196,0.3)';
            ctx.lineWidth = 1;
            const dimY = barY + barH / 2 + 40;
            drawLine(ctx, barX, dimY - 5, barX, dimY + 5, 'rgba(78,205,196,0.3)', 1);
            drawLine(ctx, barX + barW0, dimY - 5, barX + barW0, dimY + 5, 'rgba(78,205,196,0.3)', 1);
            drawLine(ctx, barX, dimY, barX + barW0, dimY, 'rgba(78,205,196,0.3)', 1);
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillStyle = '#4ecdc4';
            ctx.textAlign = 'center';
            ctx.fillText(`L₀ = ${L0} m`, barX + barW0 / 2, dimY + 16);

            // Extension
            if (ext > 5) {
                const extDimY = dimY + 30;
                drawLine(ctx, barX + barW0, extDimY - 5, barX + barW0, extDimY + 5, 'rgba(255,107,107,0.3)', 1);
                drawLine(ctx, barX + barWCurrent, extDimY - 5, barX + barWCurrent, extDimY + 5, 'rgba(255,107,107,0.3)', 1);
                drawLine(ctx, barX + barW0, extDimY, barX + barWCurrent, extDimY, 'rgba(255,107,107,0.3)', 1);
                ctx.fillStyle = '#ff6b6b';
                ctx.fillText(`ΔL = ${deltaL.toExponential(2)} m`, barX + barW0 + ext / 2, extDimY + 16);
            }
            ctx.textAlign = 'left';
            ctx.restore();

            // Stress/Strain diagram (mini)
            const graphX = 100, graphY = 440, graphW = 150, graphH = 80;
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            drawLine(ctx, graphX, graphY, graphX, graphY - graphH, 'rgba(255,255,255,0.2)', 1);
            drawLine(ctx, graphX, graphY, graphX + graphW, graphY, 'rgba(255,255,255,0.2)', 1);
            ctx.font = '9px "JetBrains Mono", monospace';
            ctx.fillStyle = '#888';
            ctx.fillText('σ (stress)', graphX + 2, graphY - graphH - 5);
            ctx.fillText('ε (strain)', graphX + graphW + 5, graphY + 4);

            // Linear stress-strain line
            ctx.beginPath();
            ctx.moveTo(graphX, graphY);
            const maxPt = Math.min(graphW, graphH);
            ctx.lineTo(graphX + maxPt * animProg, graphY - maxPt * animProg);
            ctx.strokeStyle = '#ffd93d';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Point
            drawDot(ctx, graphX + maxPt * animProg, graphY - maxPt * animProg, 4, '#ffd93d');
            ctx.restore();

            // Title
            ctx.save();
            ctx.font = 'bold 14px "JetBrains Mono", monospace';
            ctx.fillStyle = '#ffd93d';
            ctx.textAlign = 'center';
            ctx.fillText('Elasticity — Young\'s Modulus (E = σ/ε)', W / 2, 50);
            ctx.textAlign = 'left';
            ctx.restore();

            drawHUD(ctx, [
                `Elasticity — E = ${E.toExponential(1)} Pa`,
                `F = ${F} N   A = ${A} m²`,
                `σ = F/A = ${stress.toExponential(2)} Pa`,
                `ε = σ/E = ${strain.toExponential(4)}`,
                `L₀ = ${L0} m   ΔL = ${deltaL.toExponential(2)} m`,
            ], 550, 24);
        }
    });
}
