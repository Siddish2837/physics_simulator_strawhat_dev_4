// ============================================================
// gravity-sim.js — Gravitational orbits / solar system
// ============================================================

import { drawDot, drawTrail, drawArrow, drawLine, drawHUD } from './simulation-core.js';

export function simulateGravity(params, sim) {
    const G = 6.674e-11;
    const M = params.gravitation?.central_mass || 1.989e30; // Sun
    const m = params.mass || 5.972e24; // Earth
    const orbitalR = params.gravitation?.orbital_radius || 1.496e11; // 1 AU
    const displayR = 180;
    const orbitalV = Math.sqrt(G * M / orbitalR);
    const period = (2 * Math.PI * orbitalR) / orbitalV;
    const F_grav = (G * M * m) / (orbitalR * orbitalR);

    const cx = 450, cy = 300;
    const trail = [];

    // Moons / additional bodies
    const moonR = 60;
    const moonTrail = [];

    sim.addObject({
        name: params.object || 'Orbital System',
        params,
        cx, cy,
        update(dt, t) {
            const w = (2 * Math.PI) / 8; // visual period ~8s
            this.angle = w * t;
            this.px = cx + displayR * Math.cos(this.angle);
            this.py = cy + displayR * Math.sin(this.angle);
            trail.push({ x: this.px, y: this.py });
            if (trail.length > 500) trail.shift();

            // Moon
            const moonW = w * 4;
            this.moonX = this.px + moonR * Math.cos(moonW * t);
            this.moonY = this.py + moonR * Math.sin(moonW * t);
            moonTrail.push({ x: this.moonX, y: this.moonY });
            if (moonTrail.length > 200) moonTrail.shift();

            this.t = t;
        },
        render(ctx, canvas) {
            const W = canvas.width, H = canvas.height;

            // Orbital path (ghost circle)
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, displayR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.setLineDash([6, 8]);
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Star field (subtle)
            ctx.save();
            const starSeed = 42;
            for (let i = 0; i < 50; i++) {
                const sx = ((i * 137 + starSeed) * 7) % W;
                const sy = ((i * 193 + starSeed) * 11) % H;
                const alpha = 0.1 + (i % 5) * 0.05;
                ctx.beginPath();
                ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${alpha})`;
                ctx.fill();
            }
            ctx.restore();

            // Central body (Sun) with glow
            ctx.save();
            const sunGlow = ctx.createRadialGradient(cx, cy, 5, cx, cy, 50);
            sunGlow.addColorStop(0, 'rgba(255,220,50,0.8)');
            sunGlow.addColorStop(0.3, 'rgba(255,180,30,0.3)');
            sunGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = sunGlow;
            ctx.fillRect(cx - 50, cy - 50, 100, 100);
            ctx.restore();
            drawDot(ctx, cx, cy, 18, '#ffcc00');

            // Gravitational force lines (subtle radial)
            ctx.save();
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
                const r1 = 30, r2 = displayR - 20;
                ctx.beginPath();
                ctx.moveTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a));
                ctx.lineTo(cx + r2 * Math.cos(a), cy + r2 * Math.sin(a));
                ctx.strokeStyle = 'rgba(255,220,50,0.04)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            ctx.restore();

            // Trails
            drawTrail(ctx, trail, '#4ecdc4', 2);
            drawTrail(ctx, moonTrail, '#999', 1);

            // Orbiting body (planet)
            drawDot(ctx, this.px, this.py, 12, '#4ecdc4');

            // Moon
            drawDot(ctx, this.moonX, this.moonY, 5, '#aaa');

            // Gravity force arrow (toward center)
            const dx = cx - this.px;
            const dy = cy - this.py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                const fx = (dx / dist) * 45;
                const fy = (dy / dist) * 45;
                drawArrow(ctx, this.px, this.py, this.px + fx, this.py + fy, '#ff6b6b', 'F_g');
            }

            // Velocity arrow (tangent)
            const vx = -Math.sin(this.angle);
            const vy = Math.cos(this.angle);
            drawArrow(ctx, this.px, this.py, this.px + vx * 40, this.py + vy * 40, '#ffd93d', 'v');

            // Labels
            ctx.save();
            ctx.font = '11px "JetBrains Mono", monospace';
            ctx.fillStyle = '#ffcc00';
            ctx.textAlign = 'center';
            ctx.fillText('M (Star)', cx, cy + 30);
            ctx.fillStyle = '#4ecdc4';
            ctx.fillText('m (Planet)', this.px, this.py + 22);
            ctx.textAlign = 'left';
            ctx.restore();

            // Title
            ctx.save();
            ctx.font = 'bold 14px "JetBrains Mono", monospace';
            ctx.fillStyle = '#ffd93d';
            ctx.textAlign = 'center';
            ctx.fillText('F = G·M·m / r²  — Gravitational Orbit', W / 2, 40);
            ctx.textAlign = 'left';
            ctx.restore();

            drawHUD(ctx, [
                `Gravitation — G = 6.674×10⁻¹¹`,
                `M = ${M.toExponential(2)} kg`,
                `m = ${m.toExponential(2)} kg`,
                `r = ${orbitalR.toExponential(2)} m`,
                `v = ${orbitalV.toExponential(2)} m/s`,
                `F = ${F_grav.toExponential(2)} N`,
                `T = ${(period / 86400).toFixed(1)} days`,
            ]);
        }
    });
}
