// ============================================================
// optics-sim.js — Premium ray/lens diagrams with auto-scaling
// ============================================================

import { drawLine, drawArrow, drawDot, drawHUD, getCamera } from './simulation-core.js';

export function simulateOptics(params, sim) {
    const type = (params.optics?.type || params.sub_topic || 'refraction').toLowerCase();
    if (type.includes('lens') || type.includes('mirror')) lensSimulation(params, sim);
    else raySimulation(params, sim);
}

function raySimulation(params, sim) {
    const n1 = params.optics?.indices?.n1 || 1;
    const n2 = params.optics?.indices?.n2 || 1.5;
    const ai = params.optics?.angles?.incidence || 30;
    const ar = params.optics?.angles?.refraction || Math.asin((n1 * Math.sin(ai * Math.PI / 180)) / n2) * 180 / Math.PI;
    const cx = 450, cy = 300;

    sim.addObject({
        name: 'Ray Diagram',
        params,
        update() { },
        render(ctx, canvas) {
            const medGrad = ctx.createLinearGradient(0, cy, 0, cy + 180);
            medGrad.addColorStop(0, 'rgba(30,50,80,0.5)');
            medGrad.addColorStop(1, 'rgba(20,30,50,0.1)');
            ctx.fillStyle = medGrad;
            ctx.fillRect(150, cy, 600, 180);

            ctx.save();
            ctx.shadowColor = 'rgba(100,150,255,0.3)';
            ctx.shadowBlur = 8;
            drawLine(ctx, 150, cy, 750, cy, 'rgba(100,150,255,0.4)', 2);
            ctx.shadowBlur = 0;
            ctx.restore();

            ctx.save();
            ctx.setLineDash([5, 5]);
            drawLine(ctx, cx, cy - 200, cx, cy + 200, 'rgba(255,255,255,0.15)', 1);
            ctx.setLineDash([]);
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillText('Normal', cx + 6, cy - 185);
            ctx.restore();

            ctx.save();
            ctx.font = '13px "JetBrains Mono", monospace';
            ctx.fillStyle = '#6ca0ff';
            ctx.fillText(`n₁ = ${n1} (${n1 <= 1.01 ? 'air' : 'medium'})`, 170, cy - 20);
            ctx.fillStyle = '#ffaa77';
            ctx.fillText(`n₂ = ${n2} (${n2 > 1.4 ? 'glass' : 'medium'})`, 170, cy + 35);
            ctx.restore();

            const rayLen = 180;
            const incRad = ai * Math.PI / 180;

            const ix = cx - rayLen * Math.sin(incRad);
            const iy = cy - rayLen * Math.cos(incRad);
            ctx.save();
            ctx.shadowColor = '#ffdd57';
            ctx.shadowBlur = 10;
            drawArrow(ctx, ix, iy, cx, cy, '#ffdd57', `θ₁ = ${ai.toFixed(1)}°`);
            ctx.shadowBlur = 0;
            ctx.restore();

            const rx = cx + rayLen * Math.sin(incRad);
            const ry = cy - rayLen * Math.cos(incRad);
            drawArrow(ctx, cx, cy, rx, ry, '#ff6b6b', `θᵣ = ${ai.toFixed(1)}°`);

            if (!isNaN(ar) && isFinite(ar)) {
                const refRad = ar * Math.PI / 180;
                const tx = cx + rayLen * Math.sin(refRad);
                const ty = cy + rayLen * Math.cos(refRad);
                ctx.save();
                ctx.shadowColor = '#4ecdc4';
                ctx.shadowBlur = 8;
                drawArrow(ctx, cx, cy, tx, ty, '#4ecdc4', `θ₂ = ${ar.toFixed(1)}°`);
                ctx.shadowBlur = 0;
                ctx.restore();
            } else {
                ctx.save();
                ctx.font = 'bold 13px "JetBrains Mono", monospace';
                ctx.shadowColor = '#ff6b6b';
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#ff6b6b';
                ctx.fillText('⚡ Total Internal Reflection', cx + 30, cy + 50);
                ctx.shadowBlur = 0;
                ctx.restore();
            }

            drawAngleArc(ctx, cx, cy, 45, -Math.PI / 2, -Math.PI / 2 + incRad, '#ffdd57');
            drawAngleArc(ctx, cx, cy, 38, -Math.PI / 2, -Math.PI / 2 - incRad, '#ff6b6b');
            drawDot(ctx, cx, cy, 5, '#fff');

            drawHUD(ctx, [
                `Snell's Law — Refraction`,
                `n₁·sin(θ₁) = n₂·sin(θ₂)`,
                `${n1}·sin(${ai.toFixed(1)}°) = ${n2}·sin(${(ar || 0).toFixed(1)}°)`,
                `n₁ = ${n1}   n₂ = ${n2}`,
            ]);
        }
    });
}

function lensSimulation(params, sim) {
    const f = params.optics?.focal_length || 50;
    const dO = params.optics?.object_distance || 100;
    const dI = params.optics?.image_distance || (1 / (1 / f - 1 / dO) || 100);
    const cx = 450, cy = 300;

    // Auto-calculate scale to fit all elements on canvas
    const maxDist = Math.max(Math.abs(dO), Math.abs(dI), Math.abs(f)) * 1.3;
    const s = Math.min(2.5, 300 / Math.max(maxDist, 1));

    sim.addObject({
        name: 'Lens Diagram',
        params,
        update() { },
        render(ctx, canvas) {
            drawLine(ctx, 40, cy, canvas.width - 40, cy, 'rgba(255,255,255,0.08)', 1.5);

            // Lens
            ctx.save();
            ctx.shadowColor = '#6ca0ff';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.ellipse(cx, cy, 6, 130, 0, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(108,160,255,0.6)';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.restore();

            // Lens label
            ctx.save();
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillStyle = 'rgba(108,160,255,0.5)';
            ctx.textAlign = 'center';
            ctx.fillText('Lens', cx, cy - 140);
            ctx.textAlign = 'left';
            ctx.restore();

            // Focal points
            drawDot(ctx, cx - f * s, cy, 5, '#ff9f43');
            drawDot(ctx, cx + f * s, cy, 5, '#ff9f43');
            ctx.save();
            ctx.font = 'bold 11px "JetBrains Mono", monospace';
            ctx.fillStyle = '#ff9f43';
            ctx.fillText('F', cx - f * s - 4, cy + 20);
            ctx.fillText("F'", cx + f * s - 4, cy + 20);
            ctx.restore();

            // 2F points
            drawDot(ctx, cx - 2 * f * s, cy, 3, '#ff9f4388');
            drawDot(ctx, cx + 2 * f * s, cy, 3, '#ff9f4388');
            ctx.save();
            ctx.font = '9px "JetBrains Mono", monospace';
            ctx.fillStyle = '#ff9f4366';
            ctx.fillText('2F', cx - 2 * f * s - 6, cy + 16);
            ctx.fillText("2F'", cx + 2 * f * s - 6, cy + 16);
            ctx.restore();

            // Distance labels on axis
            ctx.save();
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillStyle = 'rgba(78,205,196,0.4)';
            const objMarkX = cx - dO * s;
            const imgMarkX = cx + dI * s;
            // dO bracket
            ctx.setLineDash([2, 3]);
            drawLine(ctx, objMarkX, cy + 40, cx, cy + 40, 'rgba(78,205,196,0.2)', 1);
            ctx.setLineDash([]);
            ctx.fillText(`dₒ = ${dO}`, (objMarkX + cx) / 2 - 15, cy + 55);
            // dI bracket
            ctx.setLineDash([2, 3]);
            drawLine(ctx, cx, cy + 40, imgMarkX, cy + 40, 'rgba(224,86,253,0.2)', 1);
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(224,86,253,0.4)';
            ctx.fillText(`dᵢ = ${dI.toFixed(1)}`, (cx + imgMarkX) / 2 - 15, cy + 55);
            ctx.restore();

            // Object
            const objX = cx - dO * s;
            const objH = Math.min(80, 70);
            ctx.save();
            ctx.shadowColor = '#4ecdc4';
            ctx.shadowBlur = 6;
            drawLine(ctx, objX, cy, objX, cy - objH, '#4ecdc4', 3);
            ctx.shadowBlur = 0;
            ctx.restore();
            drawDot(ctx, objX, cy - objH, 6, '#4ecdc4');
            ctx.save();
            ctx.font = '11px "JetBrains Mono", monospace';
            ctx.fillStyle = '#4ecdc4';
            ctx.fillText('Object', objX - 15, cy - objH - 12);
            ctx.restore();

            // Image
            const imgX = cx + dI * s;
            const mag = -dI / dO;
            const imgH = objH * mag;
            ctx.save();
            ctx.shadowColor = '#e056fd';
            ctx.shadowBlur = 6;
            drawLine(ctx, imgX, cy, imgX, cy - imgH, '#e056fd', 3);
            ctx.shadowBlur = 0;
            ctx.restore();
            drawDot(ctx, imgX, cy - imgH, 6, '#e056fd');
            ctx.save();
            ctx.font = '11px "JetBrains Mono", monospace';
            ctx.fillStyle = '#e056fd';
            ctx.fillText(`Image (M=${mag.toFixed(2)})`, imgX - 20, cy - imgH + (imgH > 0 ? -12 : 20));
            ctx.restore();

            // Ray 1 & 2
            ctx.save();
            ctx.setLineDash([6, 4]);
            drawLine(ctx, objX, cy - objH, cx, cy - objH, 'rgba(255,221,87,0.4)', 1.5);
            drawLine(ctx, cx, cy - objH, imgX, cy - imgH, 'rgba(255,221,87,0.4)', 1.5);
            ctx.setLineDash([4, 6]);
            drawLine(ctx, objX, cy - objH, imgX, cy - imgH, 'rgba(255,100,100,0.3)', 1.5);
            ctx.setLineDash([]);
            ctx.restore();

            drawHUD(ctx, [
                `Thin Lens — 1/f = 1/dₒ + 1/dᵢ`,
                `f = ${f}   dₒ = ${dO}   dᵢ = ${dI.toFixed(1)}`,
                `M = −dᵢ/dₒ = ${mag.toFixed(2)}`,
                mag < 0 ? `Image: real, inverted` : `Image: virtual, upright`,
            ]);
        }
    });
}

function drawAngleArc(ctx, cx, cy, r, start, end, color) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, end, end < start);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}
