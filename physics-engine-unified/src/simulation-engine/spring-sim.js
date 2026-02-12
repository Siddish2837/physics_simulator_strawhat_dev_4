// ============================================================
// spring-sim.js — Hooke's law & spring oscillation
// ============================================================

import { drawDot, drawArrow, drawLine, drawHUD, drawRoundRect } from './simulation-core.js';

export function simulateSpring(params, sim) {
    const k = params.energy?.spring_constant || params.spring?.constant || 50;
    const mass = params.mass || 2;
    const x0 = params.spring?.displacement || 1.5; // initial displacement (m)
    const damping = params.spring?.damping || 0;
    const omega = Math.sqrt(k / mass);
    const period = (2 * Math.PI) / omega;

    const anchorX = 150, anchorY = 300;
    const eqX = 450; // equilibrium position
    const scale = 80; // pixels per meter

    sim.addObject({
        name: params.object || 'Spring-Mass',
        params,
        cx: 0, cy: 300,
        update(dt, t) {
            // SHM: x(t) = x0 * cos(ωt) * e^(-γt)
            const decay = Math.exp(-damping * t);
            this.displacement = x0 * Math.cos(omega * t) * decay;
            this.velocity = -x0 * omega * Math.sin(omega * t) * decay;
            this.cx = eqX + this.displacement * scale;
            this.t = t;

            // Energy
            this.KE = 0.5 * mass * this.velocity * this.velocity;
            this.PE = 0.5 * k * this.displacement * this.displacement;
        },
        render(ctx, canvas) {
            const W = canvas.width, H = canvas.height;
            const blockW = 50, blockH = 50;
            const blockX = this.cx;

            // Wall
            ctx.save();
            ctx.fillStyle = 'rgba(80,100,140,0.4)';
            ctx.fillRect(anchorX - 15, anchorY - 60, 15, 120);
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.moveTo(anchorX - 15, anchorY - 50 + i * 20);
                ctx.lineTo(anchorX - 25, anchorY - 40 + i * 20);
                ctx.strokeStyle = 'rgba(80,100,140,0.5)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            ctx.restore();

            // Spring coils
            ctx.save();
            const springLen = blockX - anchorX;
            const coils = 12;
            const coilW = springLen / coils;
            const coilH = 18;
            ctx.beginPath();
            ctx.moveTo(anchorX, anchorY);
            for (let i = 0; i < coils; i++) {
                const sx = anchorX + i * coilW;
                if (i % 2 === 0) {
                    ctx.lineTo(sx + coilW / 2, anchorY - coilH);
                    ctx.lineTo(sx + coilW, anchorY);
                } else {
                    ctx.lineTo(sx + coilW / 2, anchorY + coilH);
                    ctx.lineTo(sx + coilW, anchorY);
                }
            }
            const compression = Math.abs(this.displacement) / x0;
            const springColor = this.displacement > 0 ? `rgba(255,107,107,${0.4 + compression * 0.6})` : `rgba(78,205,196,${0.4 + compression * 0.6})`;
            ctx.strokeStyle = springColor;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.restore();

            // Block
            ctx.save();
            const bg = ctx.createLinearGradient(blockX, anchorY - blockH / 2, blockX + blockW, anchorY + blockH / 2);
            bg.addColorStop(0, '#ff9f43');
            bg.addColorStop(1, '#e67e22');
            ctx.fillStyle = bg;
            ctx.shadowColor = '#ff9f43';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            drawRoundRect(ctx, blockX, anchorY - blockH / 2, blockW, blockH, 6);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.font = 'bold 12px "JetBrains Mono", monospace';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText(`${mass}kg`, blockX + blockW / 2, anchorY + 5);
            ctx.textAlign = 'left';
            ctx.restore();

            // Equilibrium line
            ctx.save();
            ctx.setLineDash([4, 6]);
            drawLine(ctx, eqX + blockW / 2, anchorY - 80, eqX + blockW / 2, anchorY + 80, 'rgba(255,255,255,0.15)', 1);
            ctx.setLineDash([]);
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.textAlign = 'center';
            ctx.fillText('x = 0', eqX + blockW / 2, anchorY + 95);
            ctx.textAlign = 'left';
            ctx.restore();

            // Force arrow
            const F = -k * this.displacement;
            if (Math.abs(F) > 0.1) {
                const fScale = 0.8;
                drawArrow(ctx, blockX + blockW / 2, anchorY + blockH / 2 + 30,
                    blockX + blockW / 2 + F * fScale, anchorY + blockH / 2 + 30,
                    '#ff6b6b', `F = ${F.toFixed(1)} N`);
            }

            // Energy bars
            const barY = 460, barMaxW = 200, barH = 16;
            const totalE = 0.5 * k * x0 * x0;
            const keW = (this.KE / totalE) * barMaxW;
            const peW = (this.PE / totalE) * barMaxW;

            ctx.save();
            // KE bar
            ctx.fillStyle = '#4ecdc4';
            ctx.fillRect(300, barY, keW, barH);
            ctx.strokeStyle = 'rgba(78,205,196,0.4)';
            ctx.strokeRect(300, barY, barMaxW, barH);
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillStyle = '#4ecdc4';
            ctx.fillText(`KE = ${this.KE.toFixed(2)} J`, 300, barY - 5);

            // PE bar
            ctx.fillStyle = '#e056fd';
            ctx.fillRect(300, barY + 30, peW, barH);
            ctx.strokeStyle = 'rgba(224,86,253,0.4)';
            ctx.strokeRect(300, barY + 30, barMaxW, barH);
            ctx.fillStyle = '#e056fd';
            ctx.fillText(`PE = ${this.PE.toFixed(2)} J`, 300, barY + 25);

            // Total energy
            ctx.fillStyle = '#ffd93d';
            ctx.fillText(`E_total = ${totalE.toFixed(2)} J`, 300, barY + 65);
            ctx.restore();

            drawHUD(ctx, [
                `Spring — k = ${k} N/m`,
                `m = ${mass} kg   ω = ${omega.toFixed(2)} rad/s`,
                `T = ${period.toFixed(3)} s`,
                `x = ${(this.displacement || 0).toFixed(3)} m`,
                `v = ${(this.velocity || 0).toFixed(3)} m/s`,
                `F = -kx = ${(-k * (this.displacement || 0)).toFixed(1)} N`,
            ]);
        }
    });
}
