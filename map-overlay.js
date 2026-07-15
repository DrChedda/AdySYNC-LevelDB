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
            const oldSectorLabels = labelsLayer.querySelectorAll('.sector-title-label');
            oldSectorLabels.forEach(el => el.remove());

            if (visibleWidthInStuds < 15000000) {
                const sectorSize = 1000000;

                const baselineZoom = 3200; 
                const textScale = Math.max(0.01, Math.min(1.0, baselineZoom / studsPerPixel));

                const halfWidthStuds = (rect.width / 2) * studsPerPixel;
                const halfHeightStuds = (rect.height / 2) * studsPerPixel;

                const minZ = centerCoords.z - halfWidthStuds;
                const maxZ = centerCoords.z + halfWidthStuds;
                const minX = centerCoords.x - halfHeightStuds;
                const maxX = centerCoords.x + halfHeightStuds;

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
                            sectorLabel.style.padding = '12px';
                            sectorLabel.style.margin = '0';
                            
                            sectorLabel.style.transformOrigin = '0% 0%';
                            sectorLabel.style.transform = `scale(${textScale})`;
                            
                            labelsLayer.appendChild(sectorLabel);
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