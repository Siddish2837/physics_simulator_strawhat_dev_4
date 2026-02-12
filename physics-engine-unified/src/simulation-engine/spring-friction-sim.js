// ============================================================
// spring-friction-sim.js — Damped spring oscillation
// ============================================================
// Composite simulation: spring + friction = damped harmonic motion

import { drawDot, drawArrow, drawLine, drawHUD, formatLength } from './simulation-core.js';

export function simulateSpringFriction(params, sim) {
    const m = params.mass || 2;
    const k = params.spring?.constant || 50;
    const x0 = params.spring?.displacement || 1.5;
    const mu_k = params.friction?.kinetic_coefficient || 0.15;
    const g = params.gravity || 9.8;

    // Damping coefficient from friction: b = μ_k * m * g / v (approximate)
    // For underdamped: b < 2*sqrt(k*m)
    const f_friction = mu_k * m * g;

    let x = x0; // Displacement from equilibrium
    let v = 0;  // Velocity
    let t = 0;
    const eq_x = 50; // Equilibrium position on screen

    const history = [];
    let total_energy_lost = 0;

    const springObj = {
        update(dt) {
            t += dt;

            // Spring force: F = -kx
            const F_spring = -k * x;

            // Friction force: opposes velocity
            const F_friction = v !== 0 ? -Math.sign(v) * f_friction : 0;

            // Net force
            const F_net = F_spring + F_friction;
            const a = F_net / m;

            // Update velocity and position
            v += a * dt;
            x += v * dt;

            // Energy dissipated by friction
            const energy_lost_this_frame = Math.abs(F_friction * v * dt);
            total_energy_lost += energy_lost_this_frame;

            // Stop if oscillation dies out
            if (Math.abs(x) < 0.01 && Math.abs(v) < 0.1) {
                sim.stop();
            }

            // Record history
            history.push({ t, x, v });
            if (history.length > 800) history.shift();
        },

        render(ctx, canvas) {
            const w = canvas.width;
            const h = canvas.height;

            // Drawing
            ctx.clearRect(0, 0, w, h);

            // Draw ground
            drawLine(ctx, 0, 0, 100, 0, '#444', 2, sim);

            // Draw wall at left
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 4;
            const [wx, wy] = sim.worldToScreen(10, 0);
            ctx.beginPath();
            ctx.moveTo(wx, wy - 30);
            ctx.lineTo(wx, wy + 30);
            ctx.stroke();

            // Draw spring (coil visualization)
            const spring_x_start = 10;
            const spring_x_end = eq_x + x;
            const spring_y = 5;
            const coils = 12;
            const amplitude = 2;

            ctx.strokeStyle = '#4ecdc4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const [sx1, sy1] = sim.worldToScreen(spring_x_start, spring_y);
            ctx.moveTo(sx1, sy1);

            for (let i = 0; i <= coils; i++) {
                const frac = i / coils;
                const spring_x = spring_x_start + frac * (spring_x_end - spring_x_start);
                const spring_y_offset = (i % 2 === 0 ? amplitude : -amplitude);
                const [sx, sy] = sim.worldToScreen(spring_x, spring_y + spring_y_offset);
                ctx.lineTo(sx, sy);
            }
            ctx.stroke();

            // Draw mass
            const mass_x = eq_x + x;
            const mass_y = 5;
            drawDot(ctx, mass_x, mass_y, 2, '#ff6b6b', sim);

            // Draw forces
            // Calculate current forces for display
            const F_spring_now = -k * x;
            const F_friction_now = v !== 0 ? -Math.sign(v) * f_friction : 0;

            if (Math.abs(F_spring_now) > 0.1) {
                drawArrow(ctx, mass_x, mass_y, mass_x + F_spring_now * 0.15, mass_y, '#4ecdc4', 2, sim);
            }
            if (Math.abs(F_friction_now) > 0.1) {
                drawArrow(ctx, mass_x, mass_y - 3, mass_x + F_friction_now * 0.15, mass_y - 3, '#ff9f43', 2, sim);
            }

            // Labels
            ctx.fillStyle = '#ff6b6b';
            ctx.font = '11px monospace';
            const [mx, my] = sim.worldToScreen(mass_x, mass_y);
            ctx.fillText(`${m} kg`, mx + 15, my);

            // Draw displacement graph (mini)
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
                const gy = graph_y + graph_h / 2 - (h_point.x / x0) * (graph_h / 2);
                if (i === 0) ctx.moveTo(gx, gy);
                else ctx.lineTo(gx, gy);
            }
            ctx.stroke();

            ctx.fillStyle = '#888';
            ctx.font = '10px monospace';
            ctx.fillText('Displacement vs Time', graph_x + 5, graph_y - 5);

            // HUD
            const KE = 0.5 * m * v * v;
            const PE = 0.5 * k * x * x;
            const total_E = KE + PE;

            drawHUD(ctx, [
                `Spring + Friction — Damped Oscillation`,
                `m = ${m} kg, k = ${k} N/m, μ_k = ${mu_k}`,
                `Displacement: x = ${formatLength(x)}`,
                `Velocity: v = ${formatLength(v)}/s`,
                `KE = ${KE.toFixed(2)} J, PE = ${PE.toFixed(2)} J`,
                `Total E = ${total_E.toFixed(2)} J`,
                `Energy lost to friction: ${total_energy_lost.toFixed(2)} J`,
                `t = ${t.toFixed(2)} s`
            ]);
        }
    };
    sim.addObject(springObj);
}
