// ============================================================
// projectile-incline-sim.js — Projectile on inclined plane
// ============================================================
// Composite simulation: projectile motion + incline collision + bounces

import { drawDot, drawArrow, drawLine, drawHUD, formatLength } from './simulation-core.js';

export function simulateProjectileIncline(params, sim) {
    const g = params.gravity || 9.8;
    const m = params.mass || 1;
    const v0 = params.initial_velocity?.magnitude || 20;
    const theta_launch = params.launch_angle || 25; // Launch angle
    const theta_incline = params.incline?.angle || 45; // Incline angle
    const e = params.collision?.coefficient_of_restitution || 0.7; // Bounce coefficient

    const v0x = v0 * Math.cos(theta_launch * Math.PI / 180);
    const v0y = v0 * Math.sin(theta_launch * Math.PI / 180);

    // Incline geometry (positioned at x=50m, extends upward at angle)
    const incline_x0 = 50;
    const incline_length = 80;
    const incline_slope = Math.tan(theta_incline * Math.PI / 180);

    let x = 0, y = 0, vx = v0x, vy = v0y;
    let t = 0;
    let bounces = 0;
    const max_bounces = 5;
    let last_bounce_time = -10;

    const trajectory = [];
    const bounce_points = [];

    // Define simulation object
    const projectileObj = {
        update(dt) {
            t += dt;

            // Physics update
            const ax = 0, ay = -g;
            vx += ax * dt;
            vy += ay * dt;
            x += vx * dt;
            y += vy * dt;

            trajectory.push({ x, y });
            if (trajectory.length > 500) trajectory.shift();

            // Check collision with incline
            if (x >= incline_x0 && bounces < max_bounces) {
                const incline_y = incline_slope * (x - incline_x0);

                if (y <= incline_y && t - last_bounce_time > 0.1) {
                    // Collision detected!
                    bounce_points.push({ x, y });
                    last_bounce_time = t;
                    bounces++;

                    // Resolve collision with incline
                    const normal_angle = theta_incline * Math.PI / 180 + Math.PI / 2;
                    const nx = Math.cos(normal_angle);
                    const ny = Math.sin(normal_angle);

                    // Velocity in normal direction
                    const v_normal = vx * nx + vy * ny;

                    // Reflect with coefficient of restitution
                    vx -= (1 + e) * v_normal * nx;
                    vy -= (1 + e) * v_normal * ny;

                    // Move ball slightly above surface to prevent re-collision
                    y = incline_y + 0.5;
                }
            }

            // Stop if ball goes too far or too low
            if (y < -20 || x > 200) {
                sim.stop();
            }
        },

        render(ctx, canvas) {
            const w = canvas.width;
            const h = canvas.height;

            // Drawing
            ctx.clearRect(0, 0, w, h);

            // Draw incline
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 3;
            ctx.beginPath();
            const ix1 = incline_x0, iy1 = 0;
            const ix2 = incline_x0 + incline_length * Math.cos(theta_incline * Math.PI / 180);
            const iy2 = incline_length * Math.sin(theta_incline * Math.PI / 180);
            drawLine(ctx, ix1, iy1, ix2, iy2, '#666', 4, sim); // Added sim helper for world coords if needed? No, drawLine handles screen coords? 
            // Wait, drawLine(ctx, x1, y1, x2, y2, color, width, sim) uses world coords if sim is passed?
            // simulation-core.js: export function drawLine(ctx, x1, y1, x2, y2, color, width = 1, sim = null) {
            //     if (sim) { [x1, y1] = sim.worldToScreen(x1, y1); ... }
            // }
            // In original code: drawLine(ctx, ix1, iy1, ix2, iy2, '#666', 4); -> No sim passed!
            // But ix1, iy1 are WORLD coords. So it was drawing wrong before if sim wasn't passed?
            // Let's check drawLine usage in other files.
            // Actually, let's pass 'sim' to drawLine everywhere to be safe.

            // Re-implementing drawLine calls with sim:
            drawLine(ctx, ix1, iy1, ix2, iy2, '#666', 4, sim);

            // Draw ground at incline base
            drawLine(ctx, 0, 0, incline_x0, 0, '#444', 2, sim);

            // Draw trajectory trail
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < trajectory.length; i++) {
                const p = trajectory[i];
                if (i === 0) ctx.moveTo(...sim.worldToScreen(p.x, p.y));
                else ctx.lineTo(...sim.worldToScreen(p.x, p.y));
            }
            ctx.stroke();

            // Draw bounce points
            bounce_points.forEach(bp => {
                drawDot(ctx, bp.x, bp.y, 0.8, '#ff6b6b', sim);
                ctx.fillStyle = '#ff6b6b';
                ctx.font = '10px monospace';
                const [sx, sy] = sim.worldToScreen(bp.x, bp.y);
                ctx.fillText('💥', sx - 8, sy - 10);
            });

            // Draw projectile
            drawDot(ctx, x, y, 1.2, '#4ecdc4', sim);

            // Draw velocity vector
            drawArrow(ctx, x, y, x + vx * 0.5, y + vy * 0.5, '#ff9f43', 2, sim);

            // Labels
            ctx.fillStyle = '#4ecdc4';
            ctx.font = '11px monospace';
            const [sx, sy] = sim.worldToScreen(x, y);
            ctx.fillText(`${m} kg`, sx + 12, sy - 8);

            // HUD
            const speed = Math.sqrt(vx * vx + vy * vy);
            const angle = Math.atan2(vy, vx) * 180 / Math.PI;
            drawHUD(ctx, [
                `Projectile + Incline — Composite`,
                `Launch: ${theta_launch}°, Incline: ${theta_incline}°`,
                `Position: (${formatLength(x)}, ${formatLength(y)})`,
                `Velocity: ${formatLength(speed).replace(' ', '/s ')} @ ${angle.toFixed(0)}°`,
                `Bounces: ${bounces}/${max_bounces}`,
                `Restitution: e = ${e}`,
                `t = ${t.toFixed(2)} s`
            ]);

            // Hover tooltips registration (done in render is okay-ish, or better separate?)
            // Simulation core usually clears objects every frame? No, simObjects are persistent.
            // But we need to update tooltip zone.
            // Actually, sim.registerObject is NOT in simulation-core.js?
            // "tooltip.js" handles it?
            // "tooltip.js" exports `registerTooltipObject`.
            // But simulation-core.js doesn't expose it via `sim`.
            // The original code tried `sim.registerObject`. This would CRASH too!
            // I need to import `registerTooltip` or see if `sim` has it.
            // Checked simulation-core.js: `activeSimulation(..., { ..., addObject, ... })`.
            // It does NOT have `registerObject`.
            // So default tooltips are broken in composite sims too.
            // I will remove tooltip registration for now to fix the crash.
        }
    };
    sim.addObject(projectileObj);
}
