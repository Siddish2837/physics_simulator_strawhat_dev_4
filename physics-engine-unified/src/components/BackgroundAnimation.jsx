import React, { useEffect, useRef } from 'react';

const BackgroundAnimation = ({ topic, theme }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let mouseX = -200;
        let mouseY = -200;
        let targetX = -200;
        let targetY = -200;

        const isDark = theme !== 'light';

        // --- Static stars ---
        const stars = [];
        const STAR_COUNT = 120;

        // --- Cursor trail particles ---
        const trail = [];
        const MAX_TRAIL = 25;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const initStars = () => {
            stars.length = 0;
            const w = canvas.width;
            const h = canvas.height;
            for (let i = 0; i < STAR_COUNT; i++) {
                stars.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    size: Math.random() * 2 + 0.5,
                    brightness: Math.random() * 0.5 + 0.2,
                    color: Math.random() > 0.9
                        ? ['#a78bfa', '#f472b6', '#22d3ee', '#fbbf24', '#34d399'][Math.floor(Math.random() * 5)]
                        : null
                });
            }
        };

        resize();
        initStars();

        const handleResize = () => { resize(); initStars(); };
        window.addEventListener('resize', handleResize);

        // Track mouse position
        const handleMouseMove = (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        const draw = () => {
            if (!canvas) return;
            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            // Smooth cursor follow (lerp)
            mouseX += (targetX - mouseX) * 0.08;
            mouseY += (targetY - mouseY) * 0.08;

            // ---- Draw static stars (subtle twinkle via slight alpha variation) ----
            const now = Date.now() * 0.001;
            stars.forEach(star => {
                const twinkle = Math.sin(now * 1.5 + star.x * 0.01 + star.y * 0.01) * 0.15 + 0.85;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);

                if (star.color) {
                    ctx.fillStyle = star.color;
                    ctx.globalAlpha = isDark ? star.brightness * twinkle : star.brightness * twinkle * 0.5;
                } else {
                    ctx.fillStyle = isDark ? '#cbd5e1' : '#6b7280';
                    ctx.globalAlpha = isDark ? star.brightness * twinkle : star.brightness * twinkle * 0.4;
                }
                ctx.fill();
                ctx.globalAlpha = 1;
            });

            // ---- Soft gradient mesh blobs (static, decorative) ----
            const drawBlob = (x, y, radius, color) => {
                const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
                grad.addColorStop(0, color);
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
            };

            if (isDark) {
                drawBlob(w * 0.2, h * 0.3, 250, 'rgba(139, 92, 246, 0.04)');
                drawBlob(w * 0.8, h * 0.2, 200, 'rgba(236, 72, 153, 0.03)');
                drawBlob(w * 0.5, h * 0.8, 300, 'rgba(59, 130, 246, 0.03)');
            } else {
                drawBlob(w * 0.2, h * 0.3, 250, 'rgba(139, 92, 246, 0.06)');
                drawBlob(w * 0.8, h * 0.2, 200, 'rgba(236, 72, 153, 0.05)');
                drawBlob(w * 0.5, h * 0.8, 300, 'rgba(59, 130, 246, 0.04)');
            }

            // ---- Cursor glow orb ----
            if (targetX > 0 && targetY > 0) {
                // Main glow
                const glowRadius = 120;
                const glow = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, glowRadius);
                if (isDark) {
                    glow.addColorStop(0, 'rgba(139, 92, 246, 0.15)');
                    glow.addColorStop(0.5, 'rgba(139, 92, 246, 0.05)');
                    glow.addColorStop(1, 'rgba(0,0,0,0)');
                } else {
                    glow.addColorStop(0, 'rgba(124, 58, 237, 0.12)');
                    glow.addColorStop(0.5, 'rgba(124, 58, 237, 0.04)');
                    glow.addColorStop(1, 'rgba(0,0,0,0)');
                }
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(mouseX, mouseY, glowRadius, 0, Math.PI * 2);
                ctx.fill();

                // Inner bright dot
                ctx.beginPath();
                ctx.arc(mouseX, mouseY, 4, 0, Math.PI * 2);
                ctx.fillStyle = isDark ? 'rgba(167, 139, 250, 0.6)' : 'rgba(124, 58, 237, 0.5)';
                ctx.fill();

                // ---- Cursor trail particles ----
                // Add a new particle every frame at mouse pos
                trail.push({
                    x: mouseX + (Math.random() - 0.5) * 10,
                    y: mouseY + (Math.random() - 0.5) * 10,
                    size: Math.random() * 3 + 1.5,
                    life: 1.0,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: (Math.random() - 0.5) * 1.5,
                    color: ['#a78bfa', '#c4b5fd', '#8b5cf6', '#ddd6fe', '#7c3aed'][Math.floor(Math.random() * 5)]
                });

                // Limit trail length
                while (trail.length > MAX_TRAIL) trail.shift();

                // Draw trail particles
                for (let i = trail.length - 1; i >= 0; i--) {
                    const p = trail[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life -= 0.03;
                    p.size *= 0.97;

                    if (p.life <= 0) {
                        trail.splice(i, 1);
                        continue;
                    }

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = p.life * (isDark ? 0.6 : 0.4);
                    ctx.fill();

                    // Soft glow around each particle
                    if (p.size > 1.5 && isDark) {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                        ctx.fillStyle = p.color;
                        ctx.globalAlpha = p.life * 0.08;
                        ctx.fill();
                    }

                    ctx.globalAlpha = 1;
                }

                // ---- Nearby stars react to cursor ----
                stars.forEach(star => {
                    const dx = star.x - mouseX;
                    const dy = star.y - mouseY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        const intensity = 1 - dist / 150;
                        ctx.beginPath();
                        ctx.arc(star.x, star.y, star.size + intensity * 3, 0, Math.PI * 2);
                        ctx.fillStyle = isDark ? 'rgba(167, 139, 250, 0.4)' : 'rgba(124, 58, 237, 0.3)';
                        ctx.globalAlpha = intensity * 0.5;
                        ctx.fill();

                        // Connection line to cursor
                        if (intensity > 0.3) {
                            ctx.beginPath();
                            ctx.moveTo(star.x, star.y);
                            ctx.lineTo(mouseX, mouseY);
                            ctx.strokeStyle = isDark ? 'rgba(167, 139, 250, 0.15)' : 'rgba(124, 58, 237, 0.1)';
                            ctx.globalAlpha = intensity * 0.3;
                            ctx.lineWidth = 0.5;
                            ctx.stroke();
                        }
                        ctx.globalAlpha = 1;
                    }
                });
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [topic, theme]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                pointerEvents: 'none',
                background: 'transparent'
            }}
        />
    );
};

export default BackgroundAnimation;
