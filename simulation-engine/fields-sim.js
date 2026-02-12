// ============================================================
// fields-sim.js — Premium electric/magnetic field visualizer
// ============================================================

import { drawDot, drawArrow, drawLine, drawHUD, getCamera } from './simulation-core.js';

export function simulateFields(params, sim) {
    const topic = params.topic || 'electricity';
    if (topic === 'magnetism') magneticField(params, sim);
    else electricField(params, sim);
}

function electricField(params, sim) {
    const charge = params.electricity?.charge || 5;
    const E = params.electricity?.electric_field || 100;
    const cx = 450, cy = 300;
    const sign = charge >= 0 ? '+' : '−';
    const chargeColor = charge >= 0 ? '#ff6b6b' : '#4ecdc4';

    // Pre-compute field lines
    const lineCount = 12;
    const fieldLines = [];
    for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * 2 * Math.PI;
        const pts = [];
        for (let r = 30; r < 200; r += 5) {
            pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
        }
        fieldLines.push(pts);
    }

    sim.addObject({
        name: 'Electric Field',
        params,
        update(dt, t) { this.t = t; },
        render(ctx, canvas) {
            const cam = getCamera();

            // Animated field lines with flowing dots
            fieldLines.forEach((pts, li) => {
                // Line
                ctx.beginPath();
                pts.forEach((p, j) => j === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                const grad = ctx.createLinearGradient(cx, cy, pts[pts.length - 1].x, pts[pts.length - 1].y);
                grad.addColorStop(0, chargeColor);
                grad.addColorStop(1, 'rgba(50,50,80,0.1)');
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Arrowhead at midpoint
                const mi = Math.floor(pts.length * 0.5);
                if (mi > 0 && mi < pts.length - 1) {
                    const dir = charge >= 0 ? 1 : -1;
                    const dx = pts[mi].x - pts[mi - 1].x;
                    const dy = pts[mi].y - pts[mi - 1].y;
                    const a = Math.atan2(dy * dir, dx * dir);
                    const hx = pts[mi].x, hy = pts[mi].y;
                    ctx.beginPath();
                    ctx.moveTo(hx + 8 * Math.cos(a), hy + 8 * Math.sin(a));
                    ctx.lineTo(hx + 8 * Math.cos(a + 2.5), hy + 8 * Math.sin(a + 2.5));
                    ctx.lineTo(hx + 8 * Math.cos(a - 2.5), hy + 8 * Math.sin(a - 2.5));
                    ctx.closePath();
                    ctx.fillStyle = chargeColor;
                    ctx.fill();
                }

                // Flowing dot particles
                const flowPos = ((this.t * 40 + li * 15) % 170);
                const fi = Math.min(pts.length - 1, Math.floor(flowPos / 170 * pts.length));
                if (pts[fi]) {
                    ctx.beginPath();
                    ctx.arc(pts[fi].x, pts[fi].y, 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = chargeColor;
                    ctx.fill();
                }
            });

            // Equipotential circles
            ctx.save();
            ctx.setLineDash([3, 6]);
            [70, 120, 170].forEach(r => {
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255,255,255,0.06)';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
            ctx.setLineDash([]);
            ctx.restore();

            // Charge
            ctx.save();
            ctx.shadowColor = chargeColor;
            ctx.shadowBlur = 25;
            drawDot(ctx, cx, cy, 20, chargeColor);
            ctx.shadowBlur = 0;
            ctx.font = 'bold 22px "JetBrains Mono", monospace';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText(sign, cx, cy + 8);
            ctx.textAlign = 'left';
            ctx.restore();

            // HUD
            drawHUD(ctx, [
                `Electric Field — Point Charge`,
                `Q = ${charge} μC (${charge >= 0 ? 'positive' : 'negative'})`,
                `E = kQ/r²   k = 8.99×10⁹`,
                `E(at 1${cam.unitLabel}) ≈ ${E} N/C`,
                `Field lines: ${charge >= 0 ? 'outward ↗' : 'inward ↙'}`,
            ]);
        }
    });
}

function magneticField(params, sim) {
    const B = params.magnetism?.magnetic_field || 0.5;
    const cx = 450, cy = 300;

    sim.addObject({
        name: 'Magnetic Field',
        params,
        update(dt, t) { this.t = t; },
        render(ctx, canvas) {
            const cam = getCamera();
            const W = canvas.width;

            // Magnet bar
            const mW = 200, mH = 60;
            const mX = cx - mW / 2, mY = cy - mH / 2;

            // N pole (red)
            const nGrad = ctx.createLinearGradient(mX, mY, mX + mW / 2, mY);
            nGrad.addColorStop(0, '#cc3344');
            nGrad.addColorStop(1, '#ff6b6b');
            ctx.save();
            ctx.shadowColor = '#ff6b6b';
            ctx.shadowBlur = 10;
            ctx.fillStyle = nGrad;
            ctx.fillRect(mX, mY, mW / 2, mH);
            ctx.shadowBlur = 0;
            ctx.restore();

            // S pole (blue)
            const sGrad = ctx.createLinearGradient(cx, mY, cx + mW / 2, mY);
            sGrad.addColorStop(0, '#4488cc');
            sGrad.addColorStop(1, '#2266aa');
            ctx.save();
            ctx.shadowColor = '#4488cc';
            ctx.shadowBlur = 10;
            ctx.fillStyle = sGrad;
            ctx.fillRect(cx, mY, mW / 2, mH);
            ctx.shadowBlur = 0;
            ctx.restore();

            // Pole labels
            ctx.save();
            ctx.font = 'bold 22px "JetBrains Mono", monospace';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('N', mX + mW * 0.25, cy + 8);
            ctx.fillText('S', mX + mW * 0.75, cy + 8);
            ctx.textAlign = 'left';
            ctx.restore();

            // Field lines (curved arcs from N to S)
            const lineOffsets = [30, 60, 100, 150];
            lineOffsets.forEach((off, idx) => {
                // Top arc
                ctx.save();
                ctx.beginPath();
                const cpOff = off * 1.8;
                ctx.moveTo(mX + 20, mY);
                ctx.bezierCurveTo(mX + 20 - off * 0.5, mY - cpOff, mX + mW - 20 + off * 0.5, mY - cpOff, mX + mW - 20, mY);
                const alpha = 0.5 - idx * 0.1;
                ctx.strokeStyle = `rgba(200,200,255,${alpha})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Bottom arc
                ctx.beginPath();
                ctx.moveTo(mX + 20, mY + mH);
                ctx.bezierCurveTo(mX + 20 - off * 0.5, mY + mH + cpOff, mX + mW - 20 + off * 0.5, mY + mH + cpOff, mX + mW - 20, mY + mH);
                ctx.stroke();
                ctx.restore();

                // Arrowheads
                const arrowY_top = mY - cpOff * 0.45;
                const arrowY_bot = mY + mH + cpOff * 0.45;
                ctx.beginPath();
                ctx.moveTo(cx - 5, arrowY_top - 5);
                ctx.lineTo(cx + 5, arrowY_top);
                ctx.lineTo(cx - 5, arrowY_top + 5);
                ctx.fillStyle = `rgba(200,200,255,${alpha})`;
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(cx + 5, arrowY_bot - 5);
                ctx.lineTo(cx - 5, arrowY_bot);
                ctx.lineTo(cx + 5, arrowY_bot + 5);
                ctx.fill();

                // Flowing dot
                const t = this.t;
                const prog = ((t * 0.5 + idx * 0.25) % 1);
                const dotX_top = mX + 20 + (mW - 40) * prog;
                const dotY_top = mY - cpOff * Math.sin(prog * Math.PI) * 0.7;
                ctx.beginPath();
                ctx.arc(dotX_top, dotY_top, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = '#ffdd57';
                ctx.fill();
            });

            // HUD
            drawHUD(ctx, [
                `Bar Magnet — Magnetic Field`,
                `B = ${B} T`,
                `B = μ₀I/(2πr)   F = qvB`,
                `Field: N → S (external)`,
            ]);
        }
    });
}
