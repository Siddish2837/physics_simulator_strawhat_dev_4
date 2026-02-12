// ============================================================
// multi-pulley-sim.js — Complex pulley systems & Mech Advantage
// ============================================================

import { drawDot, drawArrow, drawLine, drawHUD, drawLabel, drawRoundRect } from './simulation-core.js';

/**
 * Multi-pulley simulation. Supports Block and Tackle or movable pulley configurations.
 */
export function simulateMultiPulley(params, sim) {
    const config = params.multi_pulley?.config || 'block_and_tackle';
    const nPulleys = params.multi_pulley?.num_pulleys || 4;
    const loadMass = params.multi_pulley?.load_mass || 100;
    const effortMass = params.multi_pulley?.effort_mass || (loadMass / nPulleys) + 2; // Default to slight imbalance
    const g = params.gravity || 9.8;

    // Mechanical advantage for block and tackle is typically the number of rope segments
    // supporting the movable block, which is usually = total number of pulleys in simple setups.
    const MA = nPulleys;

    // Physics State
    let loadY = 150;     // Y-pos of the movable block (meters/scaled)
    let loadV = 0;
    let t = 0;

    const topBlockY = 80;
    const spacing = 15; // horizontal spacing between rope segments

    sim.addObject({
        name: 'Multi-Pulley System',
        params,
        update(dt, time) {
            t = time;

            // Forces
            const F_load = loadMass * g;
            const F_effort = effortMass * g;

            // Effective effort is multiplied by MA
            // Net acceleration: (Effort * MA - Load) / Total Mass Equivalent
            // Note: In real systems, total mass equivalent is Effort + Load/MA^2 ... simplified here
            const totalMass = loadMass + effortMass * MA;
            const accel = (F_effort * MA - F_load) / totalMass;

            loadV += accel * dt;
            loadY -= loadV * dt * 0.1; // scale down for visual fit

            // Constraints
            if (loadY < topBlockY + 40) { loadY = topBlockY + 40; loadV = 0; }
            if (loadY > 400) { loadY = 400; loadV = 0; }
        },
        render(ctx, canvas) {
            const W = canvas.width, H = canvas.height;
            const midX = W / 2;

            // Draw Support Beam
            ctx.save();
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(midX - 100, topBlockY - 20, 200, 10);
            ctx.restore();

            // Pulleys
            const pulleyR = 12;
            const nUpper = Math.ceil(nPulleys / 2);
            const nLower = Math.floor(nPulleys / 2);

            // Draw Upper Pulleys (Fixed)
            for (let i = 0; i < nUpper; i++) {
                const px = midX - (nUpper - 1) * spacing / 2 + i * spacing;
                drawDot(ctx, px, topBlockY, pulleyR, '#bdc3c7');
                // Connection to beam
                drawLine(ctx, px, topBlockY - 10, px, topBlockY - 20, '#7f8c8d', 3);
            }

            // Draw Lower Pulleys (Movable)
            for (let i = 0; i < nLower; i++) {
                const px = midX - (nLower - 1) * spacing / 2 + i * spacing;
                drawDot(ctx, px, loadY, pulleyR, '#bdc3c7');
            }

            // Draw Ropes
            ctx.strokeStyle = '#ecf0f1';
            ctx.lineWidth = 2;
            ctx.beginPath();

            // Starting point (fixed at top usually)
            let startX = midX - (nUpper - 1) * spacing / 2;
            ctx.moveTo(startX, topBlockY);

            // Zig-zag rope between pulleys
            for (let i = 0; i < nLower; i++) {
                const ux = midX - (nUpper - 1) * spacing / 2 + i * spacing;
                const lx = midX - (nLower - 1) * spacing / 2 + i * spacing;
                ctx.lineTo(lx, loadY);
                if (i + 1 < nUpper) {
                    ctx.lineTo(midX - (nUpper - 1) * spacing / 2 + (i + 1) * spacing, topBlockY);
                }
            }

            // Effort rope segment
            const lastUpperX = midX - (nUpper - 1) * spacing / 2 + (nUpper - 1) * spacing;
            ctx.moveTo(lastUpperX + pulleyR, topBlockY);
            const effortY = topBlockY + (400 - loadY) * MA + 20; // effort moves more
            ctx.lineTo(lastUpperX + pulleyR + 30, effortY);
            ctx.stroke();

            // Draw Load (Box)
            const boxW = 50, boxH = 40;
            ctx.save();
            const boxG = ctx.createLinearGradient(midX - boxW / 2, loadY, midX + boxW / 2, loadY + boxH);
            boxG.addColorStop(0, '#f1c40f');
            boxG.addColorStop(1, '#f39c12');
            ctx.fillStyle = boxG;
            drawRoundRect(ctx, midX - boxW / 2, loadY + 20, boxW, boxH, 4);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(`${loadMass}kg`, midX, loadY + 45);
            ctx.restore();

            // Draw Effort (Handle/Weight)
            const effortX = lastUpperX + pulleyR + 30;
            drawDot(ctx, effortX, effortY, 8, '#e74c3c');
            drawLabel(ctx, effortX + 10, effortY, `Effort: ${effortMass}kg`, '#e74c3c');

            // Force Arrows
            drawArrow(ctx, midX, loadY + 20 + boxH / 2, midX, loadY + 20 + boxH / 2 + 50, '#e74c3c', `F_g = ${(loadMass * g).toFixed(0)}N`);
            drawArrow(ctx, effortX, effortY, effortX, effortY + 40, '#f1c40f', `F_e = ${(effortMass * g).toFixed(0)}N`);

            // HUD
            drawHUD(ctx, [
                `Multi-Pulley System: ${config.replace('_', ' ')}`,
                `Number of Pulleys: ${nPulleys}`,
                `Mechanical Advantage: ${MA}`,
                `Load: ${loadMass} kg (${(loadMass * g).toFixed(0)} N)`,
                `Effort: ${effortMass} kg (${(effortMass * g).toFixed(0)} N)`,
                `Ideal Effort needed: ${(loadMass * g / MA).toFixed(1)} N`,
                `t = ${t.toFixed(2)} s`
            ], 24, 24);
        }
    });
}
