// map-overlay.js
(function() {
    const wallsLayer = document.querySelector('.walls-layer');
    
    let pointsLayer = document.querySelector('.points-layer');
    if (!pointsLayer) {
        pointsLayer = document.createElement('div');
        pointsLayer.className = 'points-layer';
        wallsLayer.parentElement.appendChild(pointsLayer); 
    }

    let wallData = [];
    let pointsData = [];
    let sectorNamesData = {};

    function getColumnLetter(colIndex) {
        if (colIndex >= 0) {
            return String.fromCharCode(65 + (colIndex % 26));
        } else {
            return String.fromCharCode(90 + ((colIndex + 1) % 26));
        }
    }

    function getDynamicStep(studsPerPixel) {
        const targetScreenSpacing = 160; 
        let idealStep = targetScreenSpacing * studsPerPixel;

        if (!idealStep || isNaN(idealStep) || !isFinite(idealStep)) {
            return 1000000;
        }

        const magnitude = Math.pow(10, Math.floor(Math.log10(idealStep)));
        const ratio = idealStep / magnitude;

        let step;
        if (ratio < 1.5) {
            step = magnitude;       
        } else if (ratio < 3.5) {
            step = magnitude * 2;   
        } else if (ratio < 7.5) {
            step = magnitude * 5;   
        } else {
            step = magnitude * 10;  
        }

        if (step <= 0 || isNaN(step) || !isFinite(step)) {
            return 1000000;
        }

        return Math.max(100, step);
    }

    function renderActiveViewportContent() {
        if (!window.MapEngine) return;
        
        const { studsPerPixel, centerCoords, LIMIT } = window.MapEngine;
        const rect = wallsLayer.parentElement.getBoundingClientRect();
        const screenCenterX = rect.width / 2;
        const screenCenterY = rect.height / 2;

        wallsLayer.innerHTML = '';
        if (wallData && wallData.length > 0) {
            for (let i = 0; i < wallData.length - 1; i++) {
                const current = wallData[i];
                const next = wallData[i + 1];

                if (current === null || next === null) continue;

                if (Math.abs(current.x) > LIMIT || Math.abs(current.z) > LIMIT) continue;
                if (Math.abs(next.x) > LIMIT || Math.abs(next.z) > LIMIT) continue;

                const x1 = screenCenterX - ((current.z - centerCoords.z) / studsPerPixel);
                const y1 = screenCenterY + ((current.x - centerCoords.x) / studsPerPixel);
                const x2 = screenCenterX - ((next.z - centerCoords.z) / studsPerPixel);
                const y2 = screenCenterY + ((next.x - centerCoords.x) / studsPerPixel);

                const dx = x2 - x1;
                const dy = y2 - y1;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                if (Math.max(x1, x2) < 0 || Math.min(x1, x2) > rect.width || Math.max(y1, y2) < 0 || Math.min(y1, y2) > rect.height) {
                    continue;
                }

                const wallEl = document.createElement('div');
                wallEl.className = 'map-wall';
                wallEl.style.position = 'absolute';
                wallEl.style.left = `${x1}px`;
                wallEl.style.top = `${y1}px`;
                wallEl.style.width = `${length}px`;
                wallEl.style.height = `3px`; 
                wallEl.style.transform = `rotate(${angle}deg)`;
                wallEl.style.transformOrigin = '0 50%';

                wallsLayer.appendChild(wallEl);
            }
        }

        const visibleWidthInStuds = rect.width * studsPerPixel;

        const labelsLayer = document.querySelector('.labels-layer');
        if (labelsLayer) {
            const oldLabels = labelsLayer.querySelectorAll('.sector-title-label, .dynamic-axis-label');
            oldLabels.forEach(el => el.remove());

            const halfWidthStuds = (rect.width / 2) * studsPerPixel;
            const halfHeightStuds = (rect.height / 2) * studsPerPixel;

            const minZ = centerCoords.z - halfWidthStuds;
            const maxZ = centerCoords.z + halfWidthStuds;
            const minX = centerCoords.x - halfHeightStuds;
            const maxX = centerCoords.x + halfHeightStuds;

            if (visibleWidthInStuds < 15000000) {
                const sectorSize = 1000000;

                const baselineZoom = 3200; 
                const textScale = Math.max(0.01, Math.min(1.0, baselineZoom / studsPerPixel));

                const startRow = Math.floor((minX + 500000) / sectorSize);
                const endRow = Math.floor((maxX + 500000) / sectorSize);
                const startCol = Math.floor((minZ + 500000) / sectorSize);
                const endCol = Math.floor((maxZ + 500000) / sectorSize);

                for (let r = startRow; r <= endRow; r++) {
                    for (let c = startCol; c <= endCol; c++) {
                        
                        const sectorTopLeftX = (r * sectorSize) - 500000;
                        const sectorTopLeftZ = (c * sectorSize) + 500000;

                        const screenX = screenCenterX - ((sectorTopLeftZ - centerCoords.z) / studsPerPixel);
                        const screenY = screenCenterY + ((sectorTopLeftX - centerCoords.x) / studsPerPixel);

                        if (screenX > -300 && screenX < rect.width + 100 && screenY > -100 && screenY < rect.height + 100) {
                            const sectorLabel = document.createElement('div');
                            sectorLabel.className = 'sector-title-label';
                            
                            const colLetter = getColumnLetter(c);
                            const sectorId = `${r}-${colLetter}`;

                            if (sectorNamesData && sectorNamesData[sectorId]) {
                                const customName = sectorNamesData[sectorId];
                                sectorLabel.textContent = `Sector ${customName} (${sectorId})`;
                            } else {
                                sectorLabel.textContent = `Sector ${sectorId}`;
                            }
                            
                            sectorLabel.style.position = 'absolute';
                            sectorLabel.style.left = `${screenX}px`;
                            sectorLabel.style.top = `${screenY}px`;
                            
                            sectorLabel.style.display = 'inline-block';
                            sectorLabel.style.whiteSpace = 'nowrap';
                            sectorLabel.style.width = 'auto';
                            
                            sectorLabel.style.padding = `${12 * textScale}px`;
                            sectorLabel.style.margin = '0';
                            
                            sectorLabel.style.transformOrigin = '0% 0%';
                            sectorLabel.style.transform = `scale(${textScale})`;
                            
                            labelsLayer.appendChild(sectorLabel);
                        }
                    }
                }
            }

            const step = getDynamicStep(studsPerPixel);

            const startX = Math.ceil(minX / step) * step;
            const endX = Math.floor(maxX / step) * step;
            const axisScreenZ = screenCenterX - ((0 - centerCoords.z) / studsPerPixel);

            if (axisScreenZ > 0 && axisScreenZ < rect.width) {
                const xCount = (endX - startX) / step;
                if (xCount > 0 && xCount < 200) {
                    for (let xVal = startX; xVal <= endX; xVal += step) {
                        if (Math.abs(xVal) > LIMIT) continue;
                        if (xVal === 0) continue;

                        const screenY = screenCenterY + ((xVal - centerCoords.x) / studsPerPixel);
                        if (screenY > 10 && screenY < rect.height - 10) {
                            const numLabel = document.createElement('div');
                            numLabel.className = 'dynamic-axis-label';
                            numLabel.textContent = xVal.toLocaleString();
                            numLabel.style.position = 'absolute';
                            numLabel.style.top = `${screenY}px`;
                            
                            numLabel.style.fontSize = '11px';
                            numLabel.style.fontWeight = 'bold';
                            numLabel.style.color = '#e0e0e0';
                            numLabel.style.background = 'rgba(15, 15, 15, 0.65)';
                            numLabel.style.backdropFilter = 'blur(2px)';
                            numLabel.style.webkitBackdropFilter = 'blur(2px)';
                            numLabel.style.border = 'none';
                            numLabel.style.padding = '2px 5px';
                            numLabel.style.borderRadius = '3px';
                            numLabel.style.pointerEvents = 'none';
                            numLabel.style.whiteSpace = 'nowrap';
                            numLabel.style.fontFamily = 'monospace';

                            numLabel.style.left = `${axisScreenZ - 8}px`;
                            numLabel.style.transform = 'translate(-100%, -50%)';

                            labelsLayer.appendChild(numLabel);
                        }
                    }
                }
            }

            const startZ = Math.ceil(minZ / step) * step;
            const endZ = Math.floor(maxZ / step) * step;
            const axisScreenX = screenCenterY + ((0 - centerCoords.x) / studsPerPixel);

            if (axisScreenX > 0 && axisScreenX < rect.height) {
                const zCount = (endZ - startZ) / step;
                if (zCount > 0 && zCount < 200) {
                    for (let zVal = startZ; zVal <= endZ; zVal += step) {
                        if (Math.abs(zVal) > LIMIT) continue;

                        const screenX = screenCenterX - ((zVal - centerCoords.z) / studsPerPixel);
                        if (screenX > 10 && screenX < rect.width - 10) {
                            const numLabel = document.createElement('div');
                            numLabel.className = 'dynamic-axis-label';
                            numLabel.textContent = zVal.toLocaleString();
                            numLabel.style.position = 'absolute';
                            numLabel.style.left = `${screenX}px`;
                            
                            numLabel.style.fontSize = '11px';
                            numLabel.style.fontWeight = 'bold';
                            numLabel.style.color = '#e0e0e0';
                            numLabel.style.background = 'rgba(15, 15, 15, 0.65)';
                            numLabel.style.backdropFilter = 'blur(2px)';
                            numLabel.style.webkitBackdropFilter = 'blur(2px)';
                            numLabel.style.border = 'none';
                            numLabel.style.padding = '2px 5px';
                            numLabel.style.borderRadius = '3px';
                            numLabel.style.pointerEvents = 'none';
                            numLabel.style.whiteSpace = 'nowrap';
                            numLabel.style.fontFamily = 'monospace';

                            if (zVal === 0) {
                                numLabel.style.top = `${axisScreenX + 8}px`;
                                numLabel.style.left = `${screenX - 8}px`;
                                numLabel.style.transform = 'translate(-100%, 0%)';
                            } else {
                                numLabel.style.top = `${axisScreenX + 8}px`;
                                numLabel.style.transform = 'translateX(-50%)';
                            }

                            labelsLayer.appendChild(numLabel);
                        }
                    }
                }
            }
        }

        pointsLayer.innerHTML = '';

        if (pointsData && pointsData.length > 0) {
            pointsData.forEach(point => {
                if (point.x === undefined || point.z === undefined) return;
                if (Math.abs(point.x) > LIMIT || Math.abs(point.z) > LIMIT) return;

                const layer = point.layer !== undefined ? point.layer : 0;

                if (layer === 0 && visibleWidthInStuds > 200000) {
                    return;
                }
                if (layer === 1 && visibleWidthInStuds > 20000000) {
                    return;
                }

                const screenX = screenCenterX - ((point.z - centerCoords.z) / studsPerPixel);
                const screenY = screenCenterY + ((point.x - centerCoords.x) / studsPerPixel);

                if (screenX < -20 || screenX > rect.width + 20 || screenY < -20 || screenY > rect.height + 20) {
                    return;
                }

                const pointContainer = document.createElement('div');
                pointContainer.className = 'map-point-container';
                pointContainer.style.position = 'absolute';
                pointContainer.style.left = `${screenX}px`;
                pointContainer.style.top = `${screenY}px`;

                const marker = document.createElement('div');
                marker.className = 'point-marker';
                
                if (point.color) {
                    marker.style.backgroundColor = point.color;
                    marker.style.boxShadow = `0 0 8px ${point.color}`;
                }
                
                pointContainer.appendChild(marker);

                if (point.name) {
                    const label = document.createElement('span');
                    label.className = 'point-label';
                    label.textContent = point.name;
                    pointContainer.appendChild(label);
                }

                pointsLayer.appendChild(pointContainer);
            });
        }
    }

    Promise.all([
        fetch('./coordinateFiles/InfiniteLandsWalls.json').then(res => res.json()).catch(() => []),
        fetch('./coordinateFiles/locations.json').then(res => res.json()).catch(() => []),
        fetch('./coordinateFiles/sectors.json').then(res => res.json()).catch(() => ({}))
    ])
    .then(([walls, points, sectorsConfig]) => {
        wallData = walls;
        pointsData = points;
        sectorNamesData = sectorsConfig;

        window.MapEngine.onViewportChange = renderActiveViewportContent;
        window.MapEngine.applyTransform();
    })
    .catch(error => console.error("Error loading map layout assets:", error));
})();