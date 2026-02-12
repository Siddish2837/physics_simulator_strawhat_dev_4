// ============================================================
// pulley-spring-sim.js — Spring-coupled Atwood machine
// ============================================================
// Composite simulation: pulley + spring = oscillating masses

import { drawDot, drawArrow, drawLine, drawHUD, formatLength } from './simulation-core.js';

export function simulatePulleySpring(params, sim) {
    const m1 = params.pulley?.mass1 || 10;
    const m2 = params.pulley?.mass2 || 5;
    const k = params.pulley?.spring_constant || 20;
    const g = params.gravity || 9.8;

    // Spring natural length (when system is at equilibrium)
    const L0 = 10;

    let y1 = 0;   // Position of mass 1 (heavier, goes down)
    let y2 = 0;   // Position of mass 2 (lighter, goes up)
    let v1 = 0;   // Velocity of mass 1
    let v2 = 0;   // Velocity of mass 2
    let t = 0;

    const pulley_x = 50, pulley_y = 40;
    const history = [];

    const pulleyObj = {
        update(dt) {
            t += dt;

            // Current rope length (spring extension)
            const rope_length = Math.abs(y1 - y2) + L0;
            this.extension = rope_length - L0;

            // Spring force (opposes extension)
            this.F_spring = -k * this.extension;

            // Tension in rope (includes spring force)
            this.T = ((m1 - m2) * g + this.F_spring) / 2;

            const a1 = (m1 * g - this.T) / m1;
            const a2 = (this.T - m2 * g) / m2;

            // Update velocities and positions
            v1 += a1 * dt;
            v2 += a2 * dt;
            y1 += v1 * dt;
            y2 += v2 * dt;

            // Record history
            history.push({ t, y1, y2, extension: this.extension });
            if (history.length > 600) history.shift();

            // Stop if too much extension or time
            if (Math.abs(this.extension) > 30 || t > 20) {
                sim.stop();
            }
        },

        render(ctx, canvas) {
            const w = canvas.width;
            const h = canvas.height;

            // Drawing
            ctx.clearRect(0, 0, w, h);

            // Draw pulley
            const pulley_r = 3;
            drawDot(ctx, pulley_x, pulley_y, pulley_r, '#666', sim);

            // Draw rope/spring on left side (mass 1)
            const m1_x = pulley_x - 15;
            const m1_y = pulley_y - y1;

            ctx.strokeStyle = '#4ecdc4';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            drawLine(ctx, m1_x, pulley_y, m1_x, m1_y, '#4ecdc4', 2, sim);
            ctx.setLineDash([]);

            // Draw rope/spring on right side (mass 2)
            const m2_x = pulley_x + 15;
            const m2_y = pulley_y - y2;

            ctx.strokeStyle = '#4ecdc4';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            drawLine(ctx, m2_x, pulley_y, m2_x, m2_y, '#4ecdc4', 2, sim);
            ctx.setLineDash([]);

            // Draw masses
            drawDot(ctx, m1_x, m1_y, 2, '#ff6b6b', sim);
            drawDot(ctx, m2_x, m2_y, 2, '#ff9f43', sim);

            // Draw forces
            drawArrow(ctx, m1_x, m1_y, m1_x, m1_y - m1 * g * 0.3, '#ff6b6b', 2, sim);
            drawArrow(ctx, m2_x, m2_y, m2_x, m2_y - m2 * g * 0.3, '#ff9f43', 2, sim);

            // Labels
            ctx.fillStyle = '#ff6b6b';
            ctx.font = '11px monospace';
            const [mx1, my1] = sim.worldToScreen(m1_x, m1_y);
            ctx.fillText(`m₁=${m1}kg`, mx1 - 50, my1);

            ctx.fillStyle = '#ff9f43';
            const [mx2, my2] = sim.worldToScreen(m2_x, m2_y);
            ctx.fillText(`m₂=${m2}kg`, mx2 + 15, my2);

            // Draw extension graph
            const graph_x = 20, graph_y = h - 100;
            const graph_w = 200, graph_h = 60;
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.strokeRect(graph_x, graph_y, graph_w, graph_h);

            ctx.strokeStyle = '#4ecdc4';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let i = 0; i < history.length; i++) {
                const h_point = history[i];
                const gx = graph_x + (i / history.length) * graph_w;
                const gy = graph_y + graph_h / 2 - (h_point.extension / 10) * (graph_h / 2);
                if (i === 0) ctx.moveTo(gx, gy);
                else ctx.lineTo(gx, gy);
            }
            ctx.stroke();

            ctx.fillStyle = '#888';
            ctx.font = '10px monospace';
            ctx.fillText('Spring Extension vs Time', graph_x + 5, graph_y - 5);

            // HUD
            drawHUD(ctx, [
                `Pulley + Spring — Oscillating Atwood`,
                `m₁ = ${m1} kg, m₂ = ${m2} kg, k = ${k} N/m`,
                `Extension: Δx = ${formatLength(this.extension || 0)}`,
                `Tension: T = ${(this.T || 0).toFixed(2)} N`,
                `Spring force: F_s = ${(this.F_spring || 0).toFixed(2)} N`,
                `v₁ = ${formatLength(v1)}/s, v₂ = ${formatLength(v2)}/s`,
                `t = ${t.toFixed(2)} s`
            ]);

            // Hover tooltips
            sim.registerObject({
                x: m1_x, y: m1_y, r: 2,
                label: 'Mass 1',
                data: { mass: m1, velocity: v1.toFixed(2) }
            });
            sim.registerObject({
                x: m2_x, y: m2_y, r: 2,
                label: 'Mass 2',
                data: { mass: m2, velocity: v2.toFixed(2) }
            });
        }
    };
    sim.addObject(pulleyObj);
}
