// ============================================================
// thermo-sim.js — Thermodynamics: gas laws & heat transfer
// ============================================================

import { drawDot, drawArrow, drawLine, drawHUD, drawRoundRect } from './simulation-core.js';

export function simulateThermo(params, sim) {
    const n = params.thermodynamics?.moles || 1;
    const R = 8.314;
    const Ti = params.thermodynamics?.temperature_initial || 300;
    const Tf = params.thermodynamics?.temperature_final || 500;
    const P = params.thermodynamics?.pressure || 101325;
    const Vi = (n * R * Ti) / P;
    const Vf = (n * R * Tf) / P;
    const c = params.thermodynamics?.specific_heat || 1000;
    const mass = params.mass || 1;
    const Q = mass * c * (Tf - Ti);

    // Gas particles
    const numParticles = 50;
    const particles = [];
    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: 300 + Math.random() * 200,
            y: 150 + Math.random() * 250,
            vx: (Math.random() - 0.5) * 60,
            vy: (Math.random() - 0.5) * 60,
        });
    }

    sim.addObject({
        name: 'Gas System',
        params,
        cx: 400, cy: 300,
        update(dt, t) {
            // Temperature oscillates between Ti and Tf
            const cycle = (Math.sin(t * 0.5) + 1) / 2;
            this.currentT = Ti + (Tf - Ti) * cycle;
            const speedFactor = Math.sqrt(this.currentT / Ti);

            // Container width varies with temperature (ideal gas)
            this.containerW = 200 + (this.currentT - Ti) / (Tf - Ti) * 100;

            const cLeft = 400 - this.containerW / 2;
            const cRight = 400 + this.containerW / 2;
            const cTop = 150, cBot = 420;

            for (const p of particles) {
                p.x += p.vx * speedFactor * dt;
                p.y += p.vy * speedFactor * dt;
                if (p.x < cLeft + 5) { p.x = cLeft + 5; p.vx = Math.abs(p.vx); }
                if (p.x > cRight - 5) { p.x = cRight - 5; p.vx = -Math.abs(p.vx); }
                if (p.y < cTop + 5) { p.y = cTop + 5; p.vy = Math.abs(p.vy); }
                if (p.y > cBot - 5) { p.y = cBot - 5; p.vy = -Math.abs(p.vy); }
            }
            this.t = t;
        },
        render(ctx, canvas) {
            const W = canvas.width, H = canvas.height;
            const T = this.currentT || Ti;
            const containerW = this.containerW || 200;
            const cLeft = 400 - containerW / 2;
            const cRight = 400 + containerW / 2;
            const cTop = 150, cBot = 420;

            // Container
            ctx.save();
            ctx.strokeStyle = 'rgba(160,180,220,0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            drawRoundRect(ctx, cLeft, cTop, containerW, cBot - cTop, 10);
            ctx.stroke();

            // Container fill (color shifts with temperature)
            const tempRatio = (T - Ti) / (Tf - Ti);
            const r = Math.floor(50 + tempRatio * 150);
            const b = Math.floor(150 - tempRatio * 100);
            ctx.fillStyle = `rgba(${r}, 30, ${b}, 0.15)`;
            ctx.fill();
            ctx.restore();

            // Gas particles
            for (const p of particles) {
                const pr = Math.floor(100 + tempRatio * 155);
                const pb = Math.floor(200 - tempRatio * 150);
                ctx.save();
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgb(${pr}, ${Math.floor(80 + tempRatio * 80)}, ${pb})`;
                ctx.shadowColor = `rgb(${pr}, 80, ${pb})`;
                ctx.shadowBlur = 4;
                ctx.fill();
                ctx.restore();
            }

            // Piston (right wall moves)
            ctx.save();
            ctx.fillStyle = 'rgba(160,180,220,0.3)';
            ctx.fillRect(cRight - 8, cTop, 8, cBot - cTop);
            ctx.strokeStyle = 'rgba(200,210,230,0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cRight, cTop); ctx.lineTo(cRight, cBot);
            ctx.stroke();
            // Piston handle
            ctx.beginPath();
            ctx.moveTo(cRight, (cTop + cBot) / 2 - 20);
            ctx.lineTo(cRight + 40, (cTop + cBot) / 2 - 20);
            ctx.lineTo(cRight + 40, (cTop + cBot) / 2 + 20);
            ctx.lineTo(cRight, (cTop + cBot) / 2 + 20);
            ctx.fillStyle = 'rgba(120,140,180,0.3)';
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Temperature bar (thermometer)
            const thermoX = 180, thermoY = 160, thermoH = 250, thermoW = 20;
            const fillH = tempRatio * thermoH;
            ctx.save();
            ctx.strokeStyle = 'rgba(200,200,200,0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(thermoX, thermoY, thermoW, thermoH);

            const tg = ctx.createLinearGradient(0, thermoY + thermoH - fillH, 0, thermoY + thermoH);
            tg.addColorStop(0, '#ff6b6b');
            tg.addColorStop(1, '#c0392b');
            ctx.fillStyle = tg;
            ctx.fillRect(thermoX + 2, thermoY + thermoH - fillH, thermoW - 4, fillH);

            // Bulb
            ctx.beginPath();
            ctx.arc(thermoX + thermoW / 2, thermoY + thermoH + 15, 15, 0, Math.PI * 2);
            ctx.fillStyle = '#ff6b6b';
            ctx.fill();

            ctx.font = '11px "JetBrains Mono", monospace';
            ctx.fillStyle = '#ff6b6b';
            ctx.textAlign = 'center';
            ctx.fillText(`${T.toFixed(0)} K`, thermoX + thermoW / 2, thermoY - 10);
            ctx.fillText(`${(T - 273.15).toFixed(0)}°C`, thermoX + thermoW / 2, thermoY - 25);

            // Scale marks
            ctx.fillStyle = '#666';
            ctx.textAlign = 'right';
            ctx.fillText(`${Ti}K`, thermoX - 5, thermoY + thermoH + 4);
            ctx.fillText(`${Tf}K`, thermoX - 5, thermoY + 8);
            ctx.textAlign = 'left';
            ctx.restore();

            // Heat transfer arrow
            if (T < Tf) {
                drawArrow(ctx, 120, (cTop + cBot) / 2, cLeft - 10, (cTop + cBot) / 2, '#ff6b6b', `Q = ${(Q / 1000).toFixed(1)} kJ`);
            }

            // Labels
            ctx.save();
            ctx.font = 'bold 13px "JetBrains Mono", monospace';
            ctx.fillStyle = '#ffd93d';
            ctx.textAlign = 'center';
            ctx.fillText('PV = nRT  (Ideal Gas Law)', W / 2, 55);
            ctx.font = '11px "JetBrains Mono", monospace';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Q = mcΔT  (Heat Transfer)', W / 2, 78);
            ctx.textAlign = 'left';
            ctx.restore();

            drawHUD(ctx, [
                `Thermodynamics`,
                `T = ${T.toFixed(0)} K  (${(T - 273.15).toFixed(0)}°C)`,
                `P = ${(P / 1000).toFixed(1)} kPa`,
                `n = ${n} mol`,
                `Q = mc∆T = ${(Q / 1000).toFixed(1)} kJ`,
            ], 580, 24);
        }
    });
}
