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

    function generateMapWalls() {
        wallsLayer.innerHTML = '';
        if (!wallData || wallData.length === 0) return;

        const { worldSize, studSize } = window.MapEngine;
        const halfWorld = worldSize / 2;

        for (let i = 0; i < wallData.length - 1; i++) {
            const current = wallData[i];
            const next = wallData[i + 1];

            if (current === null || next === null) {
                continue;
            }

            const z1 = halfWorld - (current.z * studSize);
            const x1 = halfWorld + (current.x * studSize);
            const z2 = halfWorld - (next.z * studSize);
            const x2 = halfWorld + (next.x * studSize);

            const dx = x2 - x1;
            const dz = z2 - z1;
            const length = Math.sqrt(dx * dx + dz * dz);
            const angle = Math.atan2(dx, dz) * (180 / Math.PI);

            const wallEl = document.createElement('div');
            wallEl.className = 'map-wall';

            wallEl.style.left = `${z1}px`;
            wallEl.style.top = `${x1}px`;
            wallEl.style.width = `${length}px`;
            wallEl.style.transform = `rotate(${angle}deg)`;

            wallsLayer.appendChild(wallEl);
        }
    }

    function generateMapPoints() {
        pointsLayer.innerHTML = '';
        if (!pointsData || pointsData.length === 0) return;

        const { worldSize, studSize } = window.MapEngine;
        const halfWorld = worldSize / 2;

        pointsData.forEach(point => {
            if (point.x === undefined || point.z === undefined) return;

            const leftPos = halfWorld - (point.z * studSize);
            const topPos = halfWorld + (point.x * studSize);

            const pointContainer = document.createElement('div');
            pointContainer.className = 'map-point-container';
            pointContainer.style.position = 'absolute';
            pointContainer.style.left = `${leftPos}px`;
            pointContainer.style.top = `${topPos}px`;

            const marker = document.createElement('div');
            marker.className = 'point-marker';
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

    function updateOverlayElements() {
        generateMapWalls();
        generateMapPoints();
        
        if (window.MapEngine && window.MapEngine.applyTransform) {
            window.MapEngine.applyTransform();
        }
    }

    Promise.all([
        fetch('./coordinateFiles/InfiniteLandsWalls.json').then(res => res.json()).catch(() => []),
        fetch('./coordinateFiles/locations.json').then(res => res.json()).catch(() => [])
    ])
    .then(([walls, points]) => {
        wallData = walls;
        pointsData = points;
        updateOverlayElements();
    })
    .catch(error => console.error("Error loading map layout assets:", error));
})();