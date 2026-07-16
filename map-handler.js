// map-handler.js
(function() {
    const mapSurface = document.querySelector('.map-surface');
    const axisOverlay = document.querySelector('.axis-overlay');
    const coordinateOutput = document.querySelector('[data-coordinate]');
    const zoomLabel = document.querySelector('[data-zoom-label]');

    const axisLineV = document.querySelector('.axis-line--vertical');
    const axisLineH = document.querySelector('.axis-line--horizontal');
    const labelsLayer = document.querySelector('.labels-layer');
    const wallsLayer = document.querySelector('.walls-layer');

    const LIMIT = 1000000000;

    let centerXCoord = 0; 
    let centerZCoord = 0; 
    let studsPerPixel = 10; 

    let dragging = false;
    let startX = 0, startY = 0;
    let startCenterX = 0, startCenterZ = 0;

    function setInitialZoom() {
        const rect = mapSurface.getBoundingClientRect();
        const minDimension = Math.min(rect.width, rect.height) || 800;
        studsPerPixel = 20000 / minDimension; 
    }

    function clamp(val, min, max) {
        return val < min ? min : (val > max ? max : val);
    }

    function applyTransform() {
        const rect = mapSurface.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        centerXCoord = clamp(centerXCoord, -LIMIT, LIMIT);
        centerZCoord = clamp(centerZCoord, -LIMIT, LIMIT);

        if (zoomLabel) {
            zoomLabel.textContent = `${((1 / studsPerPixel) * 100).toFixed(4)}%`;
        }

        updateDynamicGrid(width, height);

        if (window.MapEngine && window.MapEngine.onViewportChange) {
            window.MapEngine.onViewportChange();
        }
    }

    function updateDynamicGrid(width, height) {
        axisOverlay.textContent = ''; 
        if (labelsLayer) labelsLayer.textContent = '';

        const screenCenterX = width / 2;
        const screenCenterY = height / 2;

        const zToScreen = (z) => screenCenterX - ((z - centerZCoord) / studsPerPixel);
        const xToScreen = (x) => screenCenterY + ((x - centerXCoord) / studsPerPixel);

        const borderLeft = zToScreen(LIMIT);
        const borderRight = zToScreen(-LIMIT);
        const borderTop = xToScreen(LIMIT);     
        const borderBottom = xToScreen(-LIMIT); 

        const clipLeft = Math.max(0, borderLeft);
        const clipRight = Math.min(width, borderRight);
        const clipTop = Math.max(0, borderBottom);
        const clipBottom = Math.min(height, borderTop);

        const originScreenX = zToScreen(0);
        const originScreenY = xToScreen(0);

        if (axisLineV) {
            axisLineV.style.left = `${originScreenX}px`;
            axisLineV.style.top = `${clipTop}px`;
            axisLineV.style.height = `${clipBottom - clipTop}px`;
            axisLineV.style.display = (originScreenX < borderLeft || originScreenX > borderRight || clipTop >= clipBottom) ? 'none' : 'block';
            axisOverlay.appendChild(axisLineV);
        }
        if (axisLineH) {
            axisLineH.style.top = `${originScreenY}px`;
            axisLineH.style.left = `${clipLeft}px`;
            axisLineH.style.width = `${clipRight - clipLeft}px`;
            axisLineH.style.display = (originScreenY < borderBottom || originScreenY > borderTop || clipLeft >= clipRight) ? 'none' : 'block';
            axisOverlay.appendChild(axisLineH);
        }

        const drawBorder = (left, top, w, h, isVertical) => {
            const border = document.createElement('div');
            border.className = 'world-border-line';
            border.style.left = `${left}px`;
            border.style.top = `${top}px`;
            border.style.width = isVertical ? '3px' : `${w}px`;
            border.style.height = isVertical ? `${h}px` : '3px';
            border.style.transform = isVertical ? 'translateX(-50%)' : 'translateY(-50%)';
            axisOverlay.appendChild(border);
        };

        const borderHeight = clipBottom - clipTop;
        const borderWidth = clipRight - clipLeft;

        if (borderHeight > 0) {
            if (borderLeft >= 0 && borderLeft <= width) drawBorder(borderLeft, clipTop, 3, borderHeight, true);
            if (borderRight >= 0 && borderRight <= width) drawBorder(borderRight, clipTop, 3, borderHeight, true);
        }
        if (borderWidth > 0) {
            if (borderTop >= 0 && borderTop <= height) drawBorder(clipLeft, borderTop, borderWidth, 3, false);
            if (borderBottom >= 0 && borderBottom <= height) drawBorder(clipLeft, borderBottom, borderWidth, 3, false);
        }

        const visibleWidthInStuds = width * studsPerPixel;

        if (wallsLayer) {
            if (visibleWidthInStuds > 20000000) {
                wallsLayer.classList.add('hidden');
            } else {
                wallsLayer.classList.remove('hidden');
            }
        }

        let majorStep, minorStep;

        if (visibleWidthInStuds >= 500000 && visibleWidthInStuds <= 20000000) {
            majorStep = 1000000;
            minorStep = 200000;
        } else {
            const rawStep = 120 * studsPerPixel; 
            const log = Math.log10(rawStep);
            const basePower = Math.pow(10, Math.floor(log));
            const ratio = rawStep / basePower;

            majorStep = basePower * (ratio >= 5 ? 5 : (ratio >= 2 ? 2 : 1));
            minorStep = majorStep / 5;
        }

        const halfMinor = minorStep / 2;
        const halfMajor = majorStep / 2;

        const minZ = centerZCoord - (screenCenterX * studsPerPixel);
        const maxZ = centerZCoord + (screenCenterX * studsPerPixel);
        const minX = centerXCoord - (screenCenterY * studsPerPixel);
        const maxX = centerXCoord + (screenCenterY * studsPerPixel);

        const startZ = Math.floor((minZ - halfMinor) / minorStep) * minorStep + halfMinor;
        const endZ = Math.ceil((maxZ - halfMinor) / minorStep) * minorStep + halfMinor;
        const startX = Math.floor((minX - halfMinor) / minorStep) * minorStep + halfMinor;
        const endX = Math.ceil((maxX - halfMinor) / minorStep) * minorStep + halfMinor;

        if (((endZ - startZ) / minorStep <= 500) && ((endX - startX) / minorStep <= 500)) {
            const canDrawGrid = ((endZ - startZ) / minorStep <= 500) && ((endX - startX) / minorStep <= 500);
            const clampedOriginY = Math.max(clipTop + 20, Math.min(clipBottom - 20, originScreenY));
            const clampedOriginX = Math.max(clipLeft + 20, Math.min(clipRight - 20, originScreenX));

            for (let z = startZ; z <= endZ; z += minorStep) {
                if (Math.abs(z) > LIMIT) continue; 

                const screenX = zToScreen(z);
                if (screenX < borderLeft || screenX > borderRight) continue;

                const isMajor = Math.abs((z - halfMajor) % majorStep) < halfMinor;

                if (canDrawGrid) {
                    const line = document.createElement('div');
                    line.className = `dynamic-grid-line ${isMajor ? 'major' : 'minor'}`;
                    line.style.left = `${screenX}px`;
                    line.style.top = `${clipTop}px`;
                    line.style.height = `${borderHeight}px`;
                    line.style.width = isMajor ? '1.5px' : '0.5px';
                    line.style.backgroundColor = isMajor ? 'rgba(141, 129, 109, 0.35)' : 'rgba(141, 129, 109, 0.12)';
                    axisOverlay.appendChild(line);
                }
            }

            for (let x = startX; x <= endX; x += minorStep) {
                if (Math.abs(x) > LIMIT) continue;

                const screenY = xToScreen(x);
                if (screenY < borderBottom || screenY > borderTop) continue;

                const isMajor = Math.abs((x - halfMajor) % majorStep) < halfMinor;

                if (canDrawGrid) {
                    const line = document.createElement('div');
                    line.className = `dynamic-grid-line ${isMajor ? 'major' : 'minor'}`;
                    line.style.left = `${clipLeft}px`;
                    line.style.width = `${borderWidth}px`;
                    line.style.top = `${screenY}px`;
                    line.style.height = isMajor ? '1.5px' : '0.5px';
                    line.style.backgroundColor = isMajor ? 'rgba(141, 129, 109, 0.35)' : 'rgba(141, 129, 109, 0.12)';
                    axisOverlay.appendChild(line);
                }
            }
        }
    }

    function getStudCoordinates(clientX, clientY) {
        const rect = mapSurface.getBoundingClientRect();
        const localX = clientX - rect.left;
        const localY = clientY - rect.top;

        const z = clamp(Math.round(centerZCoord - ((localX - rect.width / 2) * studsPerPixel)), -LIMIT, LIMIT);
        const x = clamp(Math.round(centerXCoord + ((localY - rect.height / 2) * studsPerPixel)), -LIMIT, LIMIT);

        return { x, z };
    }

    function updateCoordinateDisplay(clientX, clientY) {
        const { x, z } = getStudCoordinates(clientX, clientY);
        if (coordinateOutput) {
            const commaX = Math.round(x).toLocaleString('en-US');
            const commaZ = Math.round(z).toLocaleString('en-US');


            coordinateOutput.textContent = `X ${commaX}, Z ${commaZ}`;
        }
    }

    function handleWheel(event) {
        event.preventDefault();

        const rect = mapSurface.getBoundingClientRect();
        const cursorX = event.clientX - rect.left;
        const cursorY = event.clientY - rect.top;

        const { x: targetWorldX, z: targetWorldZ } = getStudCoordinates(event.clientX, event.clientY);

        const zoomFactor = event.deltaY < 0 ? 1 / 1.2 : 1.2;
        studsPerPixel = Math.max(0.00001, Math.min(4000000, studsPerPixel * zoomFactor));

        const halfWidth = rect.width / 2;
        const halfHeight = rect.height / 2;

        centerZCoord = clamp(targetWorldZ + ((cursorX - halfWidth) * studsPerPixel), -LIMIT, LIMIT);
        centerXCoord = clamp(targetWorldX - ((cursorY - halfHeight) * studsPerPixel), -LIMIT, LIMIT);

        applyTransform();
    }

    function beginDrag(event) {
        if (event.button !== 0) return;

        dragging = true;
        startX = event.clientX;
        startY = event.clientY;
        startCenterX = centerXCoord;
        startCenterZ = centerZCoord;

        mapSurface.classList.add('dragging');
        mapSurface.setPointerCapture(event.pointerId);
    }

    function handleDrag(event) {
        if (!dragging) {
            updateCoordinateDisplay(event.clientX, event.clientY);
            return;
        }

        centerZCoord = clamp(startCenterZ + ((event.clientX - startX) * studsPerPixel), -LIMIT, LIMIT);
        centerXCoord = clamp(startCenterX - ((event.clientY - startY) * studsPerPixel), -LIMIT, LIMIT);

        applyTransform();
        updateCoordinateDisplay(event.clientX, event.clientY);
    }

    function endDrag() {
        if (!dragging) return;
        dragging = false;
        mapSurface.classList.remove('dragging');
    }

    setInitialZoom();
    window.addEventListener('resize', applyTransform);

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

    setTimeout(applyTransform, 100);

    window.MapEngine = {
        applyTransform: applyTransform,
        get studsPerPixel() { return studsPerPixel; },
        get centerCoords() { return { x: centerXCoord, z: centerZCoord }; },
        get LIMIT() { return LIMIT; },
        onViewportChange: null 
    };
})();