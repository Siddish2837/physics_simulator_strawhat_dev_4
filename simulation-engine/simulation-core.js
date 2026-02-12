// ============================================================
// simulation-core.js — Canvas setup, camera system, animation loop, drawing toolkit
// ============================================================

let canvas, ctx;
let animationId = null;
let running = false;
let activeSimulation = null;
let currentParams = null;
let simObjects = [];
let simTime = 0;
let lastTimestamp = 0;

// ---- Camera / Viewport ----

const camera = {
    x: 0,          // pan offset (canvas pixels)
    y: 0,
    zoom: 1,       // zoom multiplier
    unitScale: 1,  // pixels per physics unit (adjusted by unit selector)
    unitLabel: 'm',
};

export function getCamera() { return camera; }

export function setZoom(z) { camera.zoom = Math.max(0.1, Math.min(10, z)); }
export function setPan(x, y) { camera.x = x; camera.y = y; }
export function resetView() { camera.x = 0; camera.y = 0; camera.zoom = 1; }

/**
 * Set the unit scale. This controls how many pixels per physics unit.
 * @param {'mm'|'cm'|'m'|'km'} unit
 */
export function setUnit(unit) {
    switch (unit) {
        case 'mm': camera.unitScale = 0.1; camera.unitLabel = 'mm'; break;
        case 'cm': camera.unitScale = 10; camera.unitLabel = 'cm'; break;
        case 'm': camera.unitScale = 1; camera.unitLabel = 'm'; break;
        case 'km': camera.unitScale = 0.001; camera.unitLabel = 'km'; break;
        default: camera.unitScale = 1; camera.unitLabel = 'm';
    }
}

// ---- Init ----

export function initSimulation(canvasId = 'simCanvas') {
    canvas = document.getElementById(canvasId);
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = canvasId;
        document.body.appendChild(canvas);
    }
    canvas.width = 900;
    canvas.height = 600;
    ctx = canvas.getContext('2d');

    // Mouse wheel zoom
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        camera.zoom = Math.max(0.1, Math.min(10, camera.zoom * delta));
    }, { passive: false });

    // Drag to pan
    let dragging = false, dragStart = { x: 0, y: 0 }, panStart = { x: 0, y: 0 };
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) { dragging = true; dragStart = { x: e.clientX, y: e.clientY }; panStart = { x: camera.x, y: camera.y }; canvas.style.cursor = 'grabbing'; }
    });
    window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        camera.x = panStart.x + (e.clientX - dragStart.x);
        camera.y = panStart.y + (e.clientY - dragStart.y);
    });
    window.addEventListener('mouseup', () => { dragging = false; canvas.style.cursor = 'default'; });

    return { canvas, ctx };
}

export function load(simFunction, params) {
    stop();
    simObjects = [];
    simTime = 0;
    currentParams = params;
    activeSimulation = simFunction;

    // Auto-detect unit scale from params
    autoScale(params);

    if (activeSimulation) {
        activeSimulation(params, { canvas, ctx, objects: simObjects, addObject, getTime: () => simTime, camera });
    }
    start();
}

/**
 * Auto-scale: pick a good pixel scale based on the magnitude of values
 */
function autoScale(params) {
    let maxVal = 10;
    const v = params.initial_velocity?.magnitude || 0;
    const r = params.radius || 0;
    const h = params.launch_height || params.initial_position?.y0 || 0;
    const d = params.optics?.object_distance || params.optics?.focal_length || 0;

    // Compute expected range of the simulation
    if (params.topic === 'projectile') {
        const angle = (params.launch_angle || 45) * Math.PI / 180;
        const g = params.gravity || 9.8;
        maxVal = Math.max(v * v / g, h + v * v * Math.sin(angle) * Math.sin(angle) / (2 * g), 10);
    } else if (params.topic === 'linear_motion') {
        maxVal = Math.max(v * 5 + 0.5 * (params.acceleration?.value || 0) * 25, 20);
    } else if (params.topic === 'circular_motion') {
        maxVal = Math.max(r, 20);
    } else if (params.topic === 'optics') {
        maxVal = Math.max(d * 2.5, 50);
    } else if (params.topic === 'energy') {
        maxVal = Math.max(h, 20);
    } else {
        maxVal = 100;
    }

    // Target: fit max value into ~350 canvas pixels
    const targetPx = 350;
    const rawScale = targetPx / Math.max(maxVal, 1);

    // Store autoScale on the camera for sims to use
    camera.autoScale = Math.max(0.01, Math.min(50, rawScale));
}

export function updateParams(params) {
    currentParams = params;
    simObjects = [];
    simTime = 0;
    autoScale(params);
    if (activeSimulation) {
        activeSimulation(params, { canvas, ctx, objects: simObjects, addObject, getTime: () => simTime, camera });
    }
}

export function start() { if (running) return; running = true; lastTimestamp = performance.now(); animationId = requestAnimationFrame(tick); }
export function stop() { running = false; if (animationId) cancelAnimationFrame(animationId); animationId = null; }
export function pause() { stop(); }
export function play() { start(); }
export function reset() {
    stop(); simTime = 0; simObjects = [];
    if (activeSimulation && currentParams) {
        autoScale(currentParams);
        activeSimulation(currentParams, { canvas, ctx, objects: simObjects, addObject, getTime: () => simTime, camera });
    }
    renderFrame();
}
export function getCanvas() { return canvas; }
export function getCtx() { return ctx; }
export function getObjects() { return simObjects; }

// ---- Animation Loop ----

function tick(timestamp) {
    if (!running) return;
    const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
    lastTimestamp = timestamp;
    simTime += dt;
    for (const obj of simObjects) { if (obj.update) obj.update(dt, simTime); }
    renderFrame();
    animationId = requestAnimationFrame(tick);
}

function renderFrame() {
    if (!ctx || !canvas) return;
    // Clear with background (no transform)
    drawBackground();

    // Apply camera transform
    ctx.save();
    ctx.translate(canvas.width / 2 + camera.x, canvas.height / 2 + camera.y);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    for (const obj of simObjects) { if (obj.render) obj.render(ctx, canvas); }

    ctx.restore();

    // Draw zoom/unit info overlay (not affected by camera)
    drawViewInfo();
}

function addObject(obj) { simObjects.push(obj); return obj; }

// ---- Background ----

function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, '#080818');
    g.addColorStop(1, '#0d0d2b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid (scales with zoom)
    ctx.save();
    ctx.translate(canvas.width / 2 + camera.x, canvas.height / 2 + camera.y);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    const gridSize = 50;
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1 / camera.zoom;
    const startX = -canvas.width;
    const endX = canvas.width * 2;
    const startY = -canvas.height;
    const endY = canvas.height * 2;
    for (let x = Math.floor(startX / gridSize) * gridSize; x < endX; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke();
    }
    for (let y = Math.floor(startY / gridSize) * gridSize; y < endY; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
    }
    ctx.restore();
}

function drawViewInfo() {
    ctx.save();
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.textAlign = 'right';
    ctx.fillText(`Zoom: ${(camera.zoom * 100).toFixed(0)}%  |  Scroll to zoom  |  Drag to pan`, canvas.width - 16, canvas.height - 10);
    ctx.textAlign = 'left';
    ctx.restore();
}

// ================================================================
//  DRAWING TOOLKIT — high-quality primitives for all sim modules
// ================================================================

/**
 * Glowing dot with inner highlight
 */
export function drawDot(ctx, x, y, radius = 8, color = '#00f5ff') {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = radius * 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowBlur = 0;

    const inner = ctx.createRadialGradient(x - radius * 0.2, y - radius * 0.2, 0, x, y, radius);
    inner.addColorStop(0, '#fff');
    inner.addColorStop(0.4, color);
    inner.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = inner;
    ctx.fill();
    ctx.restore();
}

/**
 * Smooth vector arrow with gradient shaft and filled head
 */
export function drawArrow(ctx, x1, y1, x2, y2, color = '#ff6b6b', label = '') {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 3) return;
    const angle = Math.atan2(dy, dx);
    const headLen = Math.min(14, len * 0.35);

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - headLen * 0.7 * Math.cos(angle), y2 - headLen * 0.7 * Math.sin(angle));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - 0.35), y2 - headLen * Math.sin(angle - 0.35));
    ctx.lineTo(x2 - headLen * 0.5 * Math.cos(angle), y2 - headLen * 0.5 * Math.sin(angle));
    ctx.lineTo(x2 - headLen * Math.cos(angle + 0.35), y2 - headLen * Math.sin(angle + 0.35));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowBlur = 0;

    if (label) {
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillStyle = color;
        const lx = (x1 + x2) / 2 + 8 * Math.cos(angle + Math.PI / 2);
        const ly = (y1 + y2) / 2 + 8 * Math.sin(angle + Math.PI / 2);
        ctx.fillText(label, lx, ly);
    }
    ctx.restore();
}

/**
 * Label with subtle background pill
 */
export function drawLabel(ctx, x, y, text, color = '#ffffff') {
    ctx.save();
    ctx.font = '11px "JetBrains Mono", monospace';
    const w = ctx.measureText(text).width + 8;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    roundRect(ctx, x + 6, y - 16, w, 18, 4);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillText(text, x + 10, y - 3);
    ctx.restore();
}

/**
 * Glowing trail with fade-out
 */
export function drawTrail(ctx, points, color = '#00f5ff', width = 2) {
    if (points.length < 2) return;
    ctx.save();
    const len = points.length;
    for (let i = 1; i < len; i++) {
        const alpha = (i / len) * 0.8;
        ctx.beginPath();
        ctx.moveTo(points[i - 1].x, points[i - 1].y);
        ctx.lineTo(points[i].x, points[i].y);
        ctx.strokeStyle = hexToRGBA(color, alpha);
        ctx.lineWidth = width * (i / len);
        ctx.stroke();
    }
    if (len > 2) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(points[len - 2].x, points[len - 2].y);
        ctx.lineTo(points[len - 1].x, points[len - 1].y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    ctx.restore();
}

/**
 * Clean line
 */
export function drawLine(ctx, x1, y1, x2, y2, color = '#333', lineWidth = 1) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
}

/**
 * Stats HUD panel — top-left info box
 * Draws in screen space (unaffected by camera)
 */
export function drawHUD(ctx, lines, x = 24, y = 24) {
    ctx.save();
    // Reset transform to draw absolute UI
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const lineH = 18;
    const maxW = Math.max(...lines.map(l => l.length)) * 7.5 + 20;
    const h = lines.length * lineH + 16;

    ctx.fillStyle = 'rgba(8,8,30,0.75)';
    ctx.beginPath();
    roundRect(ctx, x, y, maxW, h, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,245,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    roundRect(ctx, x, y, maxW, h, 8);
    ctx.stroke();

    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#aabbcc';
    lines.forEach((line, i) => {
        ctx.fillText(line, x + 10, y + 18 + i * lineH);
    });
    ctx.restore();
}

/**
 * Ground line with gradient
 */
export function drawGround(ctx, y, w) {
    const g = ctx.createLinearGradient(0, y, 0, y + 20);
    g.addColorStop(0, 'rgba(50,60,80,0.6)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(30, y, w - 60, 20);
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(w - 30, y);
    ctx.strokeStyle = 'rgba(100,120,160,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
}

/**
 * Coordinate conversion: physics (y-up) → canvas (y-down)
 * Uses camera.autoScale for automatic fitting
 */
export function toCanvas(x, y, scaleOverride = null, originX = 100, originY = 500) {
    const s = scaleOverride || camera.autoScale || 1;
    return { x: originX + x * s, y: originY - y * s };
}

// ---- Utility ----

function hexToRGBA(hex, alpha) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) { r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16); }
    else if (hex.length === 7) { r = parseInt(hex.slice(1, 3), 16); g = parseInt(hex.slice(3, 5), 16); b = parseInt(hex.slice(5, 7), 16); }
    else return hex;
    return `rgba(${r},${g},${b},${alpha})`;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
}
