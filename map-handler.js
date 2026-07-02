// map-handler.js
(function() {
    const mapSurface = document.querySelector('.map-surface');
    const mapWorld = document.querySelector('.map-world');
    const axisOverlay = document.querySelector('.axis-overlay');
    const coordinateOutput = document.querySelector('[data-coordinate]');
    const zoomLabel = document.querySelector('[data-zoom-label]');

    const studSize = 1;
    const worldRadius = 10000;
    const worldSize = worldRadius * 2 * studSize;

    function getMinZoom() {
        return Math.min(window.innerWidth, window.innerHeight) / worldSize;
    }

    let dragging = false;
    let startX = 0, startY = 0;
    let offsetX = 0, offsetY = 0;
    let startOffsetX = 0, startOffsetY = 0;
    let zoom = getMinZoom();
    
    const maxZoom = 5.0; 

    function applyTransform() {
        const roundedX = Math.round(offsetX);
        const roundedY = Math.round(offsetY);

        mapWorld.style.transform = `translate(-50%, -50%) translate(${roundedX}px, ${roundedY}px) scale(${zoom})`;

        const inverseZoom = 1 / zoom;
        document.documentElement.style.setProperty('--inverse-zoom', inverseZoom.toString());

        if (zoomLabel) {
            zoomLabel.textContent = `${(zoom * 100).toFixed(0)}%`;
        }

        updateDynamicGrid();
    }

    function updateDynamicGrid() {
        const oldElements = axisOverlay.querySelectorAll('.dynamic-grid-line, .axis-label');
        oldElements.forEach(el => el.remove());

        const rect = mapSurface.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const targetPixelStep = 220;
        const rawStep = targetPixelStep / zoom;

        const log = Math.log10(rawStep);
        const basePower = Math.pow(10, Math.floor(log));
        const ratio = rawStep / basePower;

        let majorStep = basePower;
        if (ratio >= 5) majorStep = basePower * 5;
        else if (ratio >= 2) majorStep = basePower * 2;

        const minorStep = majorStep / 5;
        const halfWorld = worldSize / 2;

        const minWorldZ = (-centerX - offsetX) / zoom;
        const maxWorldZ = (rect.width - centerX - offsetX) / zoom;
        const minWorldX = (-centerY - offsetY) / zoom;
        const maxWorldX = (rect.height - centerY - offsetY) / zoom;

        const startZ = Math.floor(Math.max(-worldRadius, -maxWorldZ) / minorStep) * minorStep;
        const endZ = Math.ceil(Math.min(worldRadius, -minWorldZ) / minorStep) * minorStep;
        const startX = Math.floor(Math.max(-worldRadius, minWorldX) / minorStep) * minorStep;
        const endX = Math.ceil(Math.min(worldRadius, maxWorldX) / minorStep) * minorStep;

        if (((endZ - startZ) / minorStep > 300) || ((endX - startX) / minorStep > 300)) return;

        for (let z = startZ; z <= endZ; z += minorStep) {
            if (Math.abs(z) > worldRadius) continue;
            const isMajor = Math.abs(z % majorStep) < (minorStep / 2);
            if (Math.abs(z) < 0.1) continue;

            const line = document.createElement('div');
            line.className = `dynamic-grid-line dynamic-grid-line--vertical ${isMajor ? 'major' : 'minor'}`;
            line.style.left = `${halfWorld - (z * studSize)}px`;
            axisOverlay.appendChild(line);

            if (isMajor) {
                const label = document.createElement('span');
                label.className = 'axis-label axis-label--horizontal';
                label.textContent = `Z ${Math.round(z).toLocaleString('en-US')}`;
                label.style.left = `${halfWorld - (z * studSize)}px`;
                label.style.top = `${halfWorld}px`;
                axisOverlay.appendChild(label);
            }
        }

        // Render Horizontal lines (X Axis)
        for (let x = startX; x <= endX; x += minorStep) {
            if (Math.abs(x) > worldRadius) continue;
            const isMajor = Math.abs(x % majorStep) < (minorStep / 2);
            if (Math.abs(x) < 0.1) continue;

            const line = document.createElement('div');
            line.className = `dynamic-grid-line dynamic-grid-line--horizontal ${isMajor ? 'major' : 'minor'}`;
            line.style.top = `${halfWorld + (x * studSize)}px`;
            axisOverlay.appendChild(line);

            if (isMajor) {
                const label = document.createElement('span');
                label.className = 'axis-label axis-label--vertical';
                label.textContent = `X ${Math.round(x).toLocaleString('en-US')}`;
                label.style.left = `${halfWorld}px`;
                label.style.top = `${halfWorld + (x * studSize)}px`;
                axisOverlay.appendChild(label);
            }
        }
    }

    function getStudCoordinates(clientX, clientY) {
        const rect = mapSurface.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const localX = (clientX - rect.left - centerX - offsetX) / zoom;
        const localY = (clientY - rect.top - centerY - offsetY) / zoom;

        const x = Math.round(Math.max(-worldRadius, Math.min(worldRadius, localY / studSize)));
        const z = Math.round(Math.max(-worldRadius, Math.min(worldRadius, -localX / studSize)));

        return { x, z };
    }

    function updateCoordinateDisplay(clientX, clientY) {
        const { x, z } = getStudCoordinates(clientX, clientY);
        if (coordinateOutput) {
            coordinateOutput.textContent = `X ${x}, Z ${z}`;
        }
    }

    function adjustZoom(factor) {
        zoom = Math.max(getMinZoom(), Math.min(maxZoom, zoom * factor));
        applyTransform();
    }

    function handleWheel(event) {
        event.preventDefault();

        const rect = mapSurface.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const cursorX = event.clientX - rect.left;
        const cursorY = event.clientY - rect.top;

        const worldXBefore = (cursorX - centerX - offsetX) / zoom;
        const worldYBefore = (cursorY - centerY - offsetY) / zoom;

        const direction = event.deltaY < 0 ? 1.2 : 1 / 1.2;
        const nextZoom = Math.max(getMinZoom(), Math.min(maxZoom, zoom * direction));

        offsetX = cursorX - centerX - worldXBefore * nextZoom;
        offsetY = cursorY - centerY - worldYBefore * nextZoom;
        zoom = nextZoom;

        applyTransform();
    }

    function beginDrag(event) {
        if (event.button !== 0) return;

        dragging = true;
        startX = event.clientX;
        startY = event.clientY;
        startOffsetX = offsetX;
        startOffsetY = offsetY;

        mapSurface.classList.add('dragging');
        mapSurface.setPointerCapture(event.pointerId);
    }

    function handleDrag(event) {
        if (!dragging) {
            updateCoordinateDisplay(event.clientX, event.clientY);
            return;
        }

        offsetX = startOffsetX + (event.clientX - startX);
        offsetY = startOffsetY + (event.clientY - startY);

        applyTransform();
        updateCoordinateDisplay(event.clientX, event.clientY);
    }

    function endDrag() {
        if (!dragging) return;
        dragging = false;
        mapSurface.classList.remove('dragging');
    }

    mapWorld.style.width = `${worldSize}px`;
    mapWorld.style.height = `${worldSize}px`;

    window.addEventListener('resize', () => {
        zoom = Math.max(getMinZoom(), zoom);
        applyTransform();
    });

    mapSurface.addEventListener('wheel', handleWheel, { passive: false });
    mapSurface.addEventListener('pointerdown', beginDrag);
    mapSurface.addEventListener('pointermove', handleDrag);
    mapSurface.addEventListener('pointerup', endDrag);
    mapSurface.addEventListener('pointercancel', endDrag);

    mapSurface.addEventListener('pointerleave', (event) => {
        if (!dragging) {
            updateCoordinateDisplay(event.clientX, event.clientY);
        }
    });

window.MapEngine = {
        worldSize: worldSize,
        studSize: studSize,
        applyTransform: applyTransform,
        adjustZoom: adjustZoom,
        get zoom() { return zoom; } 
    };
})();