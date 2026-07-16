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

    const borderLeftEl = document.querySelector('.border-line--left');
    const borderRightEl = document.querySelector('.border-line--right');
    const borderTopEl = document.querySelector('.border-line--top');
    const borderBottomEl = document.querySelector('.border-line--bottom');

    const LIMIT = 1000000000;

    let centerXCoord = 0; 
    let centerZCoord = 0; 
    let studsPerPixel = 10; 

    let dragging = false;
    let startX = 0, startY = 0;
    let startCenterX = 0, startCenterZ = 0;

    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    function setInitialZoom() {
        const rect = mapSurface.getBoundingClientRect();
        studsPerPixel = 20000 / (Math.min(rect.width, rect.height) || 800); 
    }

    const toScreen = (x, z, rect) => ({
        x: (rect.width / 2) - ((z - centerZCoord) / studsPerPixel),
        y: (rect.height / 2) + ((x - centerXCoord) / studsPerPixel)
    });

    const toWorld = (screenX, screenY, rect) => ({
        z: clamp(Math.round(centerZCoord - ((screenX - rect.width / 2) * studsPerPixel)), -LIMIT, LIMIT),
        x: clamp(Math.round(centerXCoord + ((screenY - rect.height / 2) * studsPerPixel)), -LIMIT, LIMIT)
    });

    function applyTransform() {
        const rect = mapSurface.getBoundingClientRect();
        centerXCoord = clamp(centerXCoord, -LIMIT, LIMIT);
        centerZCoord = clamp(centerZCoord, -LIMIT, LIMIT);

        if (zoomLabel) {
            zoomLabel.textContent = `${((1 / studsPerPixel) * 100).toFixed(4)}%`;
        }

        updateDynamicGrid(rect.width, rect.height);

        if (window.MapEngine?.onViewportChange) {
            window.MapEngine.onViewportChange();
        }
    }

    function updateDynamicGrid(width, height) {
        axisOverlay.querySelectorAll('.dynamic-grid-line').forEach(el => el.remove());

        const rect = { width, height };
        const borderLeft = toScreen(0, LIMIT, rect).x;
        const borderRight = toScreen(0, -LIMIT, rect).x;
        const borderTop = toScreen(LIMIT, 0, rect).y;     
        const borderBottom = toScreen(-LIMIT, 0, rect).y; 

        const clipLeft = Math.max(0, borderLeft);
        const clipRight = Math.min(width, borderRight);
        const clipTop = Math.max(0, borderBottom);
        const clipBottom = Math.min(height, borderTop);

        const originScreen = toScreen(0, 0, rect);

        if (axisLineV) {
            Object.assign(axisLineV.style, {
                left: `${originScreen.x}px`, top: `${clipTop}px`, height: `${clipBottom - clipTop}px`,
                display: (originScreen.x < borderLeft || originScreen.x > borderRight || clipTop >= clipBottom) ? 'none' : 'block'
            });
        }
        if (axisLineH) {
            Object.assign(axisLineH.style, {
                top: `${originScreen.y}px`, left: `${clipLeft}px`, width: `${clipRight - clipLeft}px`,
                display: (originScreen.y < borderBottom || originScreen.y > borderTop || clipLeft >= clipRight) ? 'none' : 'block'
            });
        }

        const borderHeight = clipBottom - clipTop;
        const borderWidth = clipRight - clipLeft;

        if (borderLeftEl) {
            const showLeft = borderHeight > 0 && borderLeft >= 0 && borderLeft <= width;
            borderLeftEl.style.display = showLeft ? 'block' : 'none';
            if (showLeft) {
                Object.assign(borderLeftEl.style, {
                    left: `${borderLeft}px`, top: `${clipTop}px`,
                    width: '3px', height: `${borderHeight}px`, transform: 'translateX(-50%)'
                });
            }
        }

        if (borderRightEl) {
            const showRight = borderHeight > 0 && borderRight >= 0 && borderRight <= width;
            borderRightEl.style.display = showRight ? 'block' : 'none';
            if (showRight) {
                Object.assign(borderRightEl.style, {
                    left: `${borderRight}px`, top: `${clipTop}px`,
                    width: '3px', height: `${borderHeight}px`, transform: 'translateX(-50%)'
                });
            }
        }

        if (borderTopEl) {
            const showTop = borderWidth > 0 && borderTop >= 0 && borderTop <= height;
            borderTopEl.style.display = showTop ? 'block' : 'none';
            if (showTop) {
                Object.assign(borderTopEl.style, {
                    left: `${clipLeft}px`, top: `${borderTop}px`,
                    width: `${borderWidth}px`, height: '3px', transform: 'translateY(-50%)'
                });
            }
        }

        if (borderBottomEl) {
            const showBottom = borderWidth > 0 && borderBottom >= 0 && borderBottom <= height;
            borderBottomEl.style.display = showBottom ? 'block' : 'none';
            if (showBottom) {
                Object.assign(borderBottomEl.style, {
                    left: `${clipLeft}px`, top: `${borderBottom}px`,
                    width: `${borderWidth}px`, height: '3px', transform: 'translateY(-50%)'
                });
            }
        }

        const visibleWidthInStuds = width * studsPerPixel;

        if (wallsLayer) {
            wallsLayer.classList.toggle('hidden', visibleWidthInStuds > 20000000);
        }

        let majorStep, minorStep;
        if (visibleWidthInStuds >= 500000 && visibleWidthInStuds <= 20000000) {
            majorStep = 1000000;
            minorStep = 200000;
        } else {
            const rawStep = 120 * studsPerPixel; 
            const basePower = Math.pow(10, Math.floor(Math.log10(rawStep)));
            const ratio = rawStep / basePower;
            majorStep = basePower * (ratio >= 5 ? 5 : (ratio >= 2 ? 2 : 1));
            minorStep = majorStep / 5;
        }

        const halfMinor = minorStep / 2;
        const halfMajor = majorStep / 2;

        const minZ = centerZCoord - ((width / 2) * studsPerPixel);
        const maxZ = centerZCoord + ((width / 2) * studsPerPixel);
        const minX = centerXCoord - ((height / 2) * studsPerPixel);
        const maxX = centerXCoord + ((height / 2) * studsPerPixel);

        const startZ = Math.floor((minZ - halfMinor) / minorStep) * minorStep + halfMinor;
        const endZ = Math.ceil((maxZ - halfMinor) / minorStep) * minorStep + halfMinor;
        const startX = Math.floor((minX - halfMinor) / minorStep) * minorStep + halfMinor;
        const endX = Math.ceil((maxX - halfMinor) / minorStep) * minorStep + halfMinor;

        const canDrawGrid = ((endZ - startZ) / minorStep <= 500) && ((endX - startX) / minorStep <= 500);

        if (canDrawGrid) {
            for (let z = startZ; z <= endZ; z += minorStep) {
                if (Math.abs(z) > LIMIT) continue; 
                const screenX = toScreen(0, z, rect).x;
                if (screenX < borderLeft || screenX > borderRight) continue;

                const isMajor = Math.abs((z - halfMajor) % majorStep) < halfMinor;
                const line = document.createElement('div');
                line.className = `dynamic-grid-line ${isMajor ? 'major' : 'minor'}`;
                Object.assign(line.style, {
                    left: `${screenX}px`, top: `${clipTop}px`, height: `${borderHeight}px`,
                    width: isMajor ? '1.5px' : '0.5px',
                    backgroundColor: isMajor ? 'rgba(141, 129, 109, 0.35)' : 'rgba(141, 129, 109, 0.12)'
                });
                axisOverlay.appendChild(line);
            }

            for (let x = startX; x <= endX; x += minorStep) {
                if (Math.abs(x) > LIMIT) continue;
                const screenY = toScreen(x, 0, rect).y;
                if (screenY < borderBottom || screenY > borderTop) continue;

                const isMajor = Math.abs((x - halfMajor) % majorStep) < halfMinor;
                const line = document.createElement('div');
                line.className = `dynamic-grid-line ${isMajor ? 'major' : 'minor'}`;
                Object.assign(line.style, {
                    left: `${clipLeft}px`, width: `${borderWidth}px`, top: `${screenY}px`,
                    height: isMajor ? '1.5px' : '0.5px',
                    backgroundColor: isMajor ? 'rgba(141, 129, 109, 0.35)' : 'rgba(141, 129, 109, 0.12)'
                });
                axisOverlay.appendChild(line);
            }
        }
    }

    function updateCoordinateDisplay(clientX, clientY) {
        const rect = mapSurface.getBoundingClientRect();
        const { x, z } = toWorld(clientX - rect.left, clientY - rect.top, rect);
        if (coordinateOutput) {
            coordinateOutput.textContent = `X ${Math.round(x).toLocaleString('en-US')}, Z ${Math.round(z).toLocaleString('en-US')}`;
        }
    }

    function handleWheel(event) {
        event.preventDefault();
        const rect = mapSurface.getBoundingClientRect();
        const targetWorld = toWorld(event.clientX - rect.left, event.clientY - rect.top, rect);

        studsPerPixel = Math.max(0.00001, Math.min(4000000, studsPerPixel * (event.deltaY < 0 ? 1 / 1.2 : 1.2)));

        centerZCoord = clamp(targetWorld.z + (((event.clientX - rect.left) - rect.width / 2) * studsPerPixel), -LIMIT, LIMIT);
        centerXCoord = clamp(targetWorld.x - (((event.clientY - rect.top) - rect.height / 2) * studsPerPixel), -LIMIT, LIMIT);

        applyTransform();
    }

    function beginDrag(event) {
        if (event.button !== 0) return;
        dragging = true;
        startX = event.clientX; startY = event.clientY;
        startCenterX = centerXCoord; startCenterZ = centerZCoord;

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
        if (!dragging) updateCoordinateDisplay(event.clientX, event.clientY);
    });

    setTimeout(applyTransform, 100);

    window.MapEngine = {
        applyTransform,
        get studsPerPixel() { return studsPerPixel; },
        get centerCoords() { return { x: centerXCoord, z: centerZCoord }; },
        get LIMIT() { return LIMIT; },
        onViewportChange: null 
    };
})();