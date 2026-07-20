// map-overlay.js
(function() {
    const wallsLayer = document.querySelector('.walls-layer');
    const pointsLayer = document.querySelector('.points-layer');
    const coordTagEl = document.querySelector('.coord-level-tag');

    let currentLevelData = null;
    let wallData = [], pointsData = [], sectorNamesData = {};

    const getColumnLetter = col => {
        const isNegative = col < 0;
        let n = Math.abs(col);
        let result = "";

        while (n >= 0) {
            result = String.fromCharCode((n % 26) + 65) + result;
            n = Math.floor(n / 26) - 1;
        }

        return isNegative ? `-${result}` : result;
    };

    function getDynamicStep(studsPerPixel) {
        const idealStep = 160 * studsPerPixel;
        if (!idealStep || !isFinite(idealStep)) return 1000000;

        const magnitude = Math.pow(10, Math.floor(Math.log10(idealStep)));
        const ratio = idealStep / magnitude;
        const step = magnitude * (ratio < 1.5 ? 1 : ratio < 3.5 ? 2 : ratio < 7.5 ? 5 : 10);

        return (!step || !isFinite(step)) ? 1000000 : Math.max(100, step);
    }

    function renderActiveViewportContent() {
        if (!window.MapEngine) return;
        
        const { studsPerPixel, centerCoords, LIMIT } = window.MapEngine;
        const rect = wallsLayer.parentElement.getBoundingClientRect();
        const screenCenterX = rect.width / 2, screenCenterY = rect.height / 2;
        
        const visibleWidthInStuds = rect.width * studsPerPixel;

        const toScreen = (x, z) => ({
            x: screenCenterX - ((z - centerCoords.z) / studsPerPixel),
            y: screenCenterY + ((x - centerCoords.x) / studsPerPixel)
        });

        const isElementInViewport = (x, y, padding = 0) => {
            return (
                x >= -padding && 
                x <= rect.width + padding && 
                y >= -padding && 
                y <= rect.height + padding
            );
        };

        wallsLayer.innerHTML = '';
        if (wallData?.length > 1) {
            for (let i = 0; i < wallData.length - 1; i++) {
                const curr = wallData[i], next = wallData[i + 1];
                if (!curr || !next || Math.abs(curr.x) > LIMIT || Math.abs(curr.z) > LIMIT || Math.abs(next.x) > LIMIT || Math.abs(next.z) > LIMIT) continue;

                const p1 = toScreen(curr.x, curr.z), p2 = toScreen(next.x, next.z);
                const dx = p2.x - p1.x, dy = p2.y - p1.y;
                const length = Math.sqrt(dx * dx + dy * dy);

                if (Math.max(p1.x, p2.x) < 0 || Math.min(p1.x, p2.x) > rect.width || Math.max(p1.y, p2.y) < 0 || Math.min(p1.y, p2.y) > rect.height) continue;

                const wallEl = document.createElement('div');
                wallEl.className = 'map-wall';
                Object.assign(wallEl.style, {
                    position: 'absolute', left: `${p1.x}px`, top: `${p1.y}px`,
                    width: `${length}px`, height: '3px',
                    transform: `rotate(${Math.atan2(dy, dx) * (180 / Math.PI)}deg)`,
                    transformOrigin: '0 50%'
                });
                wallsLayer.appendChild(wallEl);
            }
        }

        const labelsLayer = document.querySelector('.labels-layer');
        if (labelsLayer) {
            labelsLayer.querySelectorAll('.sector-title-label, .dynamic-axis-label').forEach(el => el.remove());

            const halfW = (rect.width / 2) * studsPerPixel, halfH = (rect.height / 2) * studsPerPixel;
            const minZ = centerCoords.z - halfW, maxZ = centerCoords.z + halfW;
            const minX = centerCoords.x - halfH, maxX = centerCoords.x + halfH;

            const boundaryBox = labelsLayer.querySelector('.map-boundary-box');
            if (boundaryBox) {
                const borderLimit = currentLevelData?.worldBorder;

                if (borderLimit && visibleWidthInStuds <= 20000000) {
                    const boxMinLimit = -borderLimit;
                    const boxMaxLimit = borderLimit;

                    const boxLeft = screenCenterX - ((boxMaxLimit - centerCoords.z) / studsPerPixel);
                    const boxRight = screenCenterX - ((boxMinLimit - centerCoords.z) / studsPerPixel);
                    const boxTop = screenCenterY + ((boxMinLimit - centerCoords.x) / studsPerPixel);
                    const boxBottom = screenCenterY + ((boxMaxLimit - centerCoords.x) / studsPerPixel);

                    Object.assign(boundaryBox.style, { 
                        left: `${boxLeft}px`, 
                        top: `${boxTop}px`, 
                        width: `${boxRight - boxLeft}px`, 
                        height: `${boxBottom - boxTop}px`,
                        display: 'block'
                    });
                } else {
                    boundaryBox.style.display = 'none';
                }
            }

            if (currentLevelData?.hasSectors && visibleWidthInStuds < 20000000) {
                const stepSz = 1000000;
                const scale = Math.max(0.2, Math.min(1.0, 3200 / studsPerPixel));

                const startRow = Math.floor((minX + 500000) / stepSz);
                const endRow = Math.floor((maxX + 500000) / stepSz);
                const startCol = Math.floor((minZ + 500000) / stepSz);
                const endCol = Math.floor((maxZ + 500000) / stepSz);

                if ((endRow - startRow) * (endCol - startCol) < 400) {
                    for (let r = startRow; r <= endRow; r++) {
                        for (let c = startCol; c <= endCol; c++) {
                            const worldX = (r * stepSz) - 500000;
                            const worldZ = (c * stepSz) + 500000;

                            if (Math.abs(worldX) > LIMIT || Math.abs(worldZ) > LIMIT) continue;

                            const pos = toScreen(worldX, worldZ);

                            if (isElementInViewport(pos.x, pos.y, 100)) {
                                const sectorId = `${r}|${getColumnLetter(c)}`;
                                const customName = sectorNamesData[sectorId];

                                const label = document.createElement('div');
                                label.className = 'sector-title-label';
                                label.textContent = customName ? `Sector ${customName} (${sectorId})` : `Sector ${sectorId}`;

                                Object.assign(label.style, {
                                    position: 'absolute', 
                                    left: `${pos.x}px`, 
                                    top: `${pos.y}px`,
                                    transform: `scale(${scale}) translate(4px, 4px)`,
                                    pointerEvents: 'none'
                                });

                                labelsLayer.appendChild(label);
                            }
                        }
                    }
                }
            }

            const step = getDynamicStep(studsPerPixel), edge = 25;
            const axisZ = toScreen(0, 0).x, axisX = toScreen(0, 0).y;

            const createAxisLabel = (text, x, y, transform, extraStyle = {}) => {
                const lbl = document.createElement('div');
                lbl.className = 'dynamic-axis-label';
                lbl.textContent = text;
                Object.assign(lbl.style, { position: 'absolute', left: `${x}px`, top: `${y}px`, transform, ...extraStyle });
                labelsLayer.appendChild(lbl);
            };

            if (axisZ > 0 && axisZ < rect.width && ((Math.floor(maxX / step) * step - Math.ceil(minX / step) * step) / step < 200)) {
                for (let xVal = Math.ceil(minX / step) * step; xVal <= Math.floor(maxX / step) * step; xVal += step) {
                    if (Math.abs(xVal) > LIMIT || xVal === 0) continue;
                    const pos = toScreen(xVal, 0);
                    if (pos.y > edge && pos.y < rect.height - edge) {
                        createAxisLabel(`X ${xVal.toLocaleString()}`, axisZ - 8, pos.y, 'translate(-100%, -50%)');
                    }
                }
            }

            if (axisX > 0 && axisX < rect.height && ((Math.floor(maxZ / step) * step - Math.ceil(minZ / step) * step) / step < 200)) {
                for (let zVal = Math.ceil(minZ / step) * step; zVal <= Math.floor(maxZ / step) * step; zVal += step) {
                    if (Math.abs(zVal) > LIMIT) continue;
                    const pos = toScreen(0, zVal);
                    if (pos.x > edge && pos.x < rect.width - edge) {
                        if (zVal === 0) {
                            createAxisLabel("0", pos.x - 8, axisX + 8, 'translate(-100%, 0%)');
                        } else {
                            createAxisLabel(`Z ${zVal.toLocaleString()}`, pos.x, axisX + 8, 'translateX(-50%)');
                        }
                    }
                }
            }
        }

        if (pointsLayer) {
            pointsLayer.innerHTML = '';
            if (pointsData?.length > 0) {
                pointsData.forEach(p => {
                    if (p.x === undefined || p.z === undefined || Math.abs(p.x) > LIMIT || Math.abs(p.z) > LIMIT) return;
                    const pointLayer = p.layer ?? 0;

                    if (visibleWidthInStuds > 20000000) {
                        if (pointLayer < 2) return;
                    } 
                    else if (visibleWidthInStuds > 200000) {
                        if (pointLayer < 1) return;
                    }

                    const pos = toScreen(p.x, p.z);
                    if (!isElementInViewport(pos.x, pos.y, 0)) return;

                    const container = document.createElement('div');
                    container.className = 'map-point-container';
                    Object.assign(container.style, {
                        position: 'absolute',
                        left: `${pos.x}px`,
                        top: `${pos.y}px`
                    });

                    const marker = document.createElement('div');
                    marker.className = 'point-marker';
                    if (p.color) {
                        marker.style.backgroundColor = p.color;
                        marker.style.boxShadow = `0 0 8px ${p.color}`;
                    }
                    container.appendChild(marker);

                    if (p.name) {
                        const lbl = document.createElement('span');
                        lbl.className = 'point-label';
                        lbl.textContent = p.name;
                        container.appendChild(lbl);
                    }
                    container.style.cursor = 'pointer';
                    container.style.pointerEvents = 'auto';

                    container.addEventListener('click', (event) => {
                        event.stopPropagation();
                        if (window.MapUI) {
                            window.MapUI.openSidebarWithData(p);
                        }
                    });
                    pointsLayer.appendChild(container);
                });
            }
        }
    }

    function loadLevel(levelNum = 0) {
        const file = `./levelData/level-${levelNum}.json`;

        fetch(file)
            .then(res => {
                if (!res.ok) throw new Error(`Level data missing for level-${levelNum}`);
                return res.json();
            })
            .then(data => {
                currentLevelData = data;
                wallData = data.walls || [];
                pointsData = data.locations || [];
                sectorNamesData = data.sectors || {};

                const levelId = data.levelId || `Level-${levelNum}`;
                if (coordTagEl) coordTagEl.textContent = levelId;
                
                if (window.MapEngine) {
                    window.MapEngine.setLimit(data.limit || 1000000000);
                    window.MapEngine.onViewportChange = renderActiveViewportContent;
                    window.MapEngine.applyTransform();
                }
            })
            .catch(err => {
                console.warn(err.message, "Defaulting to empty viewport.");
                wallData = []; pointsData = []; sectorNamesData = {};
                if (coordTagEl) coordTagEl.textContent = `Level-${levelNum}`;
                if (window.MapEngine) window.MapEngine.applyTransform();
            });
    }

    loadLevel(0);

    window.MapOverlay = {
        loadLevel
    };
})();