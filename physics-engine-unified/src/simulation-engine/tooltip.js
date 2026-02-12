// ============================================================
// tooltip.js — Hover tooltip for formulas and computed values
// ============================================================

let tooltipEl = null;
let getObjectsFn = null;
let boundMoveHandler = null;
let boundLeaveHandler = null;

export function initTooltip(canvas, getObjects) {
    if (!canvas || !getObjects) return;
    getObjectsFn = getObjects;

    // Create tooltip element
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'sim-tooltip';
    tooltipEl.style.display = 'none';
    document.body.appendChild(tooltipEl);

    boundMoveHandler = (e) => handleMove(e, canvas);
    boundLeaveHandler = () => { tooltipEl.style.display = 'none'; };

    canvas.addEventListener('mousemove', boundMoveHandler);
    canvas.addEventListener('mouseleave', boundLeaveHandler);
}

export function destroyTooltip(canvas) {
    if (tooltipEl) { tooltipEl.remove(); tooltipEl = null; }
    if (canvas && boundMoveHandler) canvas.removeEventListener('mousemove', boundMoveHandler);
    if (canvas && boundLeaveHandler) canvas.removeEventListener('mouseleave', boundLeaveHandler);
}

function handleMove(e, canvas) {
    if (!getObjectsFn || !tooltipEl) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const objects = getObjectsFn();
    let hit = null;
    for (const obj of objects) {
        if (obj.cx !== undefined && obj.cy !== undefined) {
            const dx = mx - obj.cx;
            const dy = my - obj.cy;
            if (Math.sqrt(dx * dx + dy * dy) < 50) { hit = obj; break; }
        }
    }

    if (!hit || !hit.params) { tooltipEl.style.display = 'none'; return; }

    const p = hit.params;
    const lines = [];

    // Object name
    lines.push(`<span class="tooltip-title">${p.object || hit.name || 'Object'}</span>`);
    lines.push(`<span class="tooltip-topic">${p.topic || '—'} / ${p.sub_topic || '—'}</span>`);

    // Formulas
    if (p.formulas?.equations?.length) {
        lines.push('<span class="tooltip-section">Formulas</span>');
        p.formulas.equations.forEach(eq => {
            lines.push(`<span class="tooltip-formula">${eq}</span>`);
        });
    }

    // Computed values
    if (p.formulas?.calculations) {
        lines.push('<span class="tooltip-section">Values</span>');
        Object.entries(p.formulas.calculations).forEach(([k, v]) => {
            if (v !== null && v !== undefined) {
                const label = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                lines.push(`<span class="tooltip-value">${label}: <b>${typeof v === 'number' ? v.toFixed(2) : v}</b></span>`);
            }
        });
    }

    tooltipEl.innerHTML = lines.join('');
    tooltipEl.style.display = 'block';
    tooltipEl.style.left = (e.clientX + 16) + 'px';
    tooltipEl.style.top = (e.clientY + 16) + 'px';

    // Keep within viewport
    const tr = tooltipEl.getBoundingClientRect();
    if (tr.right > window.innerWidth) tooltipEl.style.left = (e.clientX - tr.width - 10) + 'px';
    if (tr.bottom > window.innerHeight) tooltipEl.style.top = (e.clientY - tr.height - 10) + 'px';
}
