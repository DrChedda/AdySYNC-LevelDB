// map-handler.js
(function() {
    const mapSurface = document.querySelector('.map-surface');
    const axisOverlay = document.querySelector('.axis-overlay');
    const coordOut = document.querySelector('[data-coordinate]');
    const axisV = document.querySelector('.axis-line--vertical');
    const axisH = document.querySelector('.axis-line--horizontal');
    const walls = document.querySelector('.walls-layer');

    const borders = {
        left: document.querySelector('.border-line--left'),
        right: document.querySelector('.border-line--right'),
        top: document.querySelector('.border-line--top'),
        bottom: document.querySelector('.border-line--bottom')
    };

    const gridCanvas = Object.assign(document.createElement('canvas'), { className: 'grid-canvas' });
    Object.assign(gridCanvas.style, { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' });
    axisOverlay.appendChild(gridCanvas);
    const gridCtx = gridCanvas.getContext('2d');

    let LIMIT = 1e9, centerX = 0, centerZ = 0, studsPerPixel = 10;
    let dragging = false, startX = 0, startY = 0, startCenterX = 0, startCenterZ = 0, isPending = false;

    const clamp = (val, min = -LIMIT, max = LIMIT) => Math.max(min, Math.min(max, val));

    const toScreen = (x, z, r) => ({
        x: (r.width / 2) - ((z - centerZ) / studsPerPixel),
        y: (r.height / 2) + ((x - centerX) / studsPerPixel)
    });

    const toWorld = (sX, sY, r) => ({
        z: clamp(Math.round(centerZ - ((sX - r.width / 2) * studsPerPixel))),
        x: clamp(Math.round(centerX + ((sY - r.height / 2) * studsPerPixel)))
    });

    function applyTransform() {
        if (isPending) return;
        isPending = true;
        requestAnimationFrame(() => {
            const rect = mapSurface.getBoundingClientRect();
            centerX = clamp(centerX);
            centerZ = clamp(centerZ);
            updateGrid(rect.width, rect.height);
            window.MapEngine?.onViewportChange?.();
            isPending = false;
        });
    }

    function setBorder(el, show, styles) {
        if (!el) return;
        el.style.display = show ? 'block' : 'none';
        if (show) Object.assign(el.style, styles);
    }

    function updateGrid(w, h) {
        if (gridCanvas.width !== w || gridCanvas.height !== h) {
            gridCanvas.width = w; gridCanvas.height = h;
        }
        gridCtx.clearRect(0, 0, w, h);

        const rect = { width: w, height: h };
        const bL = toScreen(0, LIMIT, rect).x, bR = toScreen(0, -LIMIT, rect).x;
        const bT = toScreen(LIMIT, 0, rect).y, bB = toScreen(-LIMIT, 0, rect).y;

        const cL = Math.max(0, bL), cR = Math.min(w, bR);
        const cT = Math.max(0, bB), cB = Math.min(h, bT);
        const bW = cR - cL, bH = cB - cT;

        const origin = toScreen(0, 0, rect);

        if (axisV) setBorder(axisV, !(origin.x < bL || origin.x > bR || cT >= cB), { left: `${origin.x}px`, top: `${cT}px`, height: `${bH}px` });
        if (axisH) setBorder(axisH, !(origin.y < bB || origin.y > bT || cL >= cR), { top: `${origin.y}px`, left: `${cL}px`, width: `${bW}px` });

        setBorder(borders.left, bH > 0 && bL >= 0 && bL <= w, { left: `${bL}px`, top: `${cT}px`, width: '3px', height: `${bH}px`, transform: 'translateX(-50%)' });
        setBorder(borders.right, bH > 0 && bR >= 0 && bR <= w, { left: `${bR}px`, top: `${cT}px`, width: '3px', height: `${bH}px`, transform: 'translateX(-50%)' });
        setBorder(borders.top, bW > 0 && bT >= 0 && bT <= h, { left: `${cL}px`, top: `${bT}px`, width: `${bW}px`, height: '3px', transform: 'translateY(-50%)' });
        setBorder(borders.bottom, bW > 0 && bB >= 0 && bB <= h, { left: `${cL}px`, top: `${bB}px`, width: `${bW}px`, height: '3px', transform: 'translateY(-50%)' });

        const visStuds = w * studsPerPixel;
        if (walls) walls.classList.toggle('hidden', visStuds > 2e7);

        let majorStep, minorStep;
        if (visStuds >= 5e5 && visStuds <= 2e7) {
            majorStep = 1e6; minorStep = 2e5;
        } else {
            const rawStep = 120 * studsPerPixel;
            const pwr = 10 ** Math.floor(Math.log10(rawStep));
            const ratio = rawStep / pwr;
            majorStep = pwr * (ratio >= 5 ? 5 : ratio >= 2 ? 2 : 1);
            minorStep = majorStep / 5;
        }

        const halfMinor = minorStep / 2, halfMajor = majorStep / 2;
        const startZ = Math.floor((centerZ - (w / 2) * studsPerPixel - halfMinor) / minorStep) * minorStep + halfMinor;
        const endZ = Math.ceil((centerZ + (w / 2) * studsPerPixel - halfMinor) / minorStep) * minorStep + halfMinor;
        const startX = Math.floor((centerX - (h / 2) * studsPerPixel - halfMinor) / minorStep) * minorStep + halfMinor;
        const endX = Math.ceil((centerX + (h / 2) * studsPerPixel - halfMinor) / minorStep) * minorStep + halfMinor;

        if ((endZ - startZ) / minorStep > 500 || bH <= 0 || bW <= 0) return;

        for (let pass = 0; pass < 2; pass++) {
            gridCtx.beginPath();
            gridCtx.strokeStyle = pass ? 'rgba(141, 129, 109, 0.25)' : 'rgba(141, 129, 109, 0.08)';
            gridCtx.lineWidth = pass ? 2 : 1;

            for (let z = startZ; z <= endZ; z += minorStep) {
                if (Math.abs(z) > LIMIT) continue;
                const sX = toScreen(0, z, rect).x;
                if (sX < bL || sX > bR) continue;

                const isMajor = Math.abs((z - halfMajor) % majorStep) < halfMinor;
                if ((pass && isMajor) || (!pass && !isMajor)) {
                    gridCtx.moveTo(sX, cT); gridCtx.lineTo(sX, cB);
                }
            }

            for (let x = startX; x <= endX; x += minorStep) {
                if (Math.abs(x) > LIMIT) continue;
                const sY = toScreen(x, 0, rect).y;
                if (sY < bB || sY > bT) continue;

                const isMajor = Math.abs((x - halfMajor) % majorStep) < halfMinor;
                if ((pass && isMajor) || (!pass && !isMajor)) {
                    gridCtx.moveTo(cL, sY); gridCtx.lineTo(cR, sY);
                }
            }
            gridCtx.stroke();
        }
    }

    function updateCoords(eX, eY) {
        if (!coordOut) return;
        const r = mapSurface.getBoundingClientRect();
        const { x, z } = toWorld(eX - r.left, eY - r.top, r);
        coordOut.textContent = `X ${Math.round(x).toLocaleString('en-US')}, Z ${Math.round(z).toLocaleString('en-US')}`;
    }

    mapSurface.addEventListener('wheel', (e) => {
        e.preventDefault();
        const r = mapSurface.getBoundingClientRect();
        const target = toWorld(e.clientX - r.left, e.clientY - r.top, r);
        const zoomLimits = [window.MapEngine?.minStudsPerPixel || 0.05, window.MapEngine?.maxStudsPerPixel || 4e6];

        studsPerPixel = clamp(studsPerPixel * (e.deltaY < 0 ? 1 / 1.2 : 1.2), ...zoomLimits);
        centerZ = clamp(target.z + ((e.clientX - r.left - r.width / 2) * studsPerPixel));
        centerX = clamp(target.x - ((e.clientY - r.top - r.height / 2) * studsPerPixel));
        applyTransform();
    }, { passive: false });

    mapSurface.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || e.target.closest('.map-point-container, .ui-info-sidebar')) return;
        dragging = true;
        startX = e.clientX; startY = e.clientY;
        startCenterX = centerX; startCenterZ = centerZ;
        mapSurface.classList.add('dragging');
        mapSurface.setPointerCapture(e.pointerId);
    });

    mapSurface.addEventListener('pointermove', (e) => {
        if (!dragging) return updateCoords(e.clientX, e.clientY);
        centerZ = clamp(startCenterZ + ((e.clientX - startX) * studsPerPixel));
        centerX = clamp(startCenterX - ((e.clientY - startY) * studsPerPixel));
        applyTransform();
        updateCoords(e.clientX, e.clientY);
    });

    const stopDrag = () => { dragging = false; mapSurface.classList.remove('dragging'); };
    ['pointerup', 'pointercancel'].forEach(evt => mapSurface.addEventListener(evt, stopDrag));
    mapSurface.addEventListener('pointerleave', () => !dragging && (coordOut.textContent = "X -----, Z -----"));

    const rect = mapSurface.getBoundingClientRect();
    studsPerPixel = 20000 / (Math.min(rect.width, rect.height) || 800);
    window.addEventListener('resize', applyTransform);
    setTimeout(applyTransform, 100);

    window.MapEngine = {
        applyTransform,
        setLimit: (l) => { LIMIT = l || 1e9; },
        get studsPerPixel() { return studsPerPixel; },
        set studsPerPixel(val) { studsPerPixel = val; },
        get centerCoords() { return { x: centerX, z: centerZ }; },
        set centerCoords({ x, z }) {
            if (x !== undefined) centerX = clamp(x);
            if (z !== undefined) centerZ = clamp(z);
        },
        get LIMIT() { return LIMIT; }
    };
})();