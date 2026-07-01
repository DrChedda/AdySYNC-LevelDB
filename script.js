const mapSurface = document.querySelector('.map-surface');
const mapWorld = document.querySelector('.map-world');
const axisOverlay = document.querySelector('.axis-overlay');
const wallsLayer = document.querySelector('.walls-layer');
const coordinateOutput = document.querySelector('[data-coordinate]');
const zoomOutButton = document.querySelector('[data-zoom-out]');
const zoomInButton = document.querySelector('[data-zoom-in]');
const zoomLabel = document.querySelector('[data-zoom-label]');

const studSize = 1;
const worldRadius = 10000;
const worldSize = worldRadius * 2 * studSize;

const wallData = [
  { x: -5458, z: 1573 },
  { x: -5458, z: 2254 },
  { x: -5487, z: 2279 },
  { x: -5487, z: 3133 },
  { x: -5487, z: 2579 },
  { x: -6287, z: 2592 },
  { x: -6287, z: 2979 },
  { x: -6287, z: 2879 },
  { x: -6479, z: 2882 },
  { x: -6479, z: 3756 },
  { x: -6479, z: 3239 },
  { x: -7890, z: 3244 },
  { x: -7890, z: 3746 },
  { x: -7859, z: 3777 },
  { x: -7860, z: 4294 },
  { x: -7827, z: 4316 },
  { x: -7827, z: 4833 },
  { x: -7799, z: 4857 },
  { x: -7799, z: 5374 },
  { x: -7772, z: 5399 },
  { x: -7593, z: 5399 },
  { x: -7591, z: 7830 },
  { x: -3539, z: 7830 },
  { x: -3539, z: 7169 },
  { x: -3541, z: 7229 },
  { x: -2877, z: 7227 },
  { x: -2877, z: 7167 },
  { x: -2877, z: 7803 },
  { x: -2877, z: 7617 },
  { x: -2249, z: 7617 },
  { x: -2225, z: 7647 },
  { x: -1620, z: 7646 },
  { x: -1592, z: 7679 },
  { x: -987,  z: 7678 },
  
  null, // --- split ---
  
  { x: -1753, z: 8283 },
  { x: -2370, z: 8281 },
  
  null, // --- split ---
  
  { x: -2652, z: 8281 },
  { x: -3282, z: 8281 },
  
  null, // --- split ---
  
  { x: -3589, z: 8280 },
  { x: -4214, z: 8280 },
  
  null, // --- split ---
  
  { x: -4525, z: 8285 },
  { x: -5140, z: 8285 },

  null, // --- split ---

  { x: 2235, z: 6450 },
  { x: 2235, z: 6489 },
  { x: 2170, z: 6491 },
  { x: 2133, z: 6450 },
  { x: 1169, z: 6450 },
  { x: 1169, z: 8041 },
  { x: 1292, z: 8041 },
  { x: 1292, z: 7948 },
  { x: 1171, z: 7948 },
  { x: 1169, z: 6450 },
  { x: 593, z: 6450 },
  { x: 567, z: 6423 },
  { x: -43, z: 6423 },
  { x: -43, z: 7018 },
  { x: 251, z: 7018 },
  { x: -43, z: 7018 },
  { x: -43, z: 8281 },
  { x: 55, z: 8281 },
  { x: -552, z: 8281 },
  { x: -50, z: 8281 },
  { x: -45, z: 8458 },

  null, // --- split ---

  { x: -1779, z: 7019 },
  { x: -43, z: 7019 },
  { x: -43, z: 6423 },
  { x: -1451, z: 6423 },


  null, // --- split ---

  { x: 2234, z: 6447 },
  { x: 2619, z: 6447 },
  { x: 2635, z: 6423 },
  { x: 3360, z: 6423 },
  { x: 3360, z: 7962 },
  { x: 3360, z: 6423 },
  { x: 4648, z: 6419 },
  { x: 4678, z: 6391 },
  { x: 6720, z: 6388 },
  { x: 6720, z: 4379 },
  { x: 5643, z: 4379 },
  { x: 5639, z: 2371 },
  { x: 5671, z: 2338 },
  { x: 5713, z: 2338 },
  { x: 5727, z: 2311 },
  { x: 5727, z: 300 },
  { x: 5761, z: 268 },
  { x: 5761, z: -895 },

  null, // --- split ---

  { x: 5763, z: -1005 },
  { x: 5763, z: -1743 },
  { x: 5786, z: -1770 },
  { x: 5786, z: -3777 },
  { x: 5760, z: -3803 },
  { x: 5760, z: -4255 },
  { x: 4081, z: -4255 },
  { x: 4060, z: -4231 },
  { x: 2046, z: -4231 },
  { x: 2017, z: -4196 },
  { x: 1, z: -4199 },
  { x: 1, z: -5069 },
  { x: -1409, z: -5066 },
  { x: -1409, z: -4470 },
  { x: -3448, z: -4471 },
  
  null, // --- split ---

  { x: -3898, z: -4573 },
  { x: -3901, z: -3841 },
  { x: -5460, z: -3837 },
  { x: -5460, z: -1826 },
  { x: -5427, z: -1800 },
  { x: -5427, z: 211 },
  { x: -5455, z: 246 },
  { x: -5455, z: 1481 },
  
  null, // --- split ---

  { x: -1729, z: -4142 },
  { x: -2679, z: -4144 },
  
  null, // --- split ---

  { x: -3897, z: -3839 },
  { x: -3408, z: -3839 },
  { x: -3393, z: -3870 },
  { x: -1365, z: -3870 }
];

function getMinZoom() {
    return Math.min(window.innerWidth, window.innerHeight) / worldSize;
}

let dragging = false;
let startX = 0;
let startY = 0;
let offsetX = 0;
let offsetY = 0;
let startOffsetX = 0;
let startOffsetY = 0;
let zoom = getMinZoom();

const maxZoom = 15.0;

function applyTransform() {
    const roundedX = Math.round(offsetX);
    const roundedY = Math.round(offsetY);

    mapWorld.style.transform = `translate(-50%, -50%) translate(${roundedX}px, ${roundedY}px) scale(${zoom})`;

    const inverseZoom = 1 / zoom;
    document.documentElement.style.setProperty('--inverse-zoom', inverseZoom.toString());

    zoomLabel.textContent = `${(zoom * 100).toFixed(0)}%`;

    updateDynamicGrid();
}

function generateMapWalls() {
    wallsLayer.innerHTML = '';
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

    const minWorldX = (-centerX - offsetX) / zoom;
    const maxWorldX = (rect.width - centerX - offsetX) / zoom;
    const minWorldY = (-centerY - offsetY) / zoom;
    const maxWorldY = (rect.height - centerY - offsetY) / zoom;

    const startX = Math.floor(Math.max(-worldRadius, minWorldX) / minorStep) * minorStep;
    const endX = Math.ceil(Math.min(worldRadius, maxWorldX) / minorStep) * minorStep;
    const startY = Math.floor(Math.max(-worldRadius, minWorldY) / minorStep) * minorStep;
    const endY = Math.ceil(Math.min(worldRadius, maxWorldY) / minorStep) * minorStep;

    if ((endX - startX) / minorStep > 300) return;

    for (let x = startX; x <= endX; x += minorStep) {
        if (Math.abs(x) > worldRadius) continue;
        const isMajor = Math.abs(x % majorStep) < (minorStep / 2);
        if (Math.abs(x) < 0.1) continue;

        const line = document.createElement('div');
        line.className = `dynamic-grid-line dynamic-grid-line--vertical ${isMajor ? 'major' : 'minor'}`;
        line.style.left = `${halfWorld - x}px`;
        axisOverlay.appendChild(line);

        if (isMajor) {
            const label = document.createElement('span');
            label.className = 'axis-label axis-label--horizontal';
            label.textContent = `Z ${Math.round(x).toLocaleString('en-US')}`;
            label.style.left = `${halfWorld - x}px`;
            label.style.top = `${halfWorld}px`;
            axisOverlay.appendChild(label);
        }
    }

    for (let y = startY; y <= endY; y += minorStep) {
        if (Math.abs(y) > worldRadius) continue;
        const isMajor = Math.abs(y % majorStep) < (minorStep / 2);
        if (Math.abs(y) < 0.1) continue;

        const line = document.createElement('div');
        line.className = `dynamic-grid-line dynamic-grid-line--horizontal ${isMajor ? 'major' : 'minor'}`;
        line.style.top = `${halfWorld + y}px`;
        axisOverlay.appendChild(line);

        if (isMajor) {
            const label = document.createElement('span');
            label.className = 'axis-label axis-label--vertical';
            label.textContent = `X ${Math.round(y).toLocaleString('en-US')}`;
            label.style.left = `${halfWorld}px`;
            label.style.top = `${halfWorld + y}px`;
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

    return {
        x,
        z
    };
}


function updateCoordinateDisplay(clientX, clientY) {
    const {
        x,
        z
    } = getStudCoordinates(clientX, clientY);
    coordinateOutput.textContent = `X ${x}, Z ${z}`;
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

generateMapWalls();
applyTransform();

window.addEventListener('resize', () => {
    zoom = Math.max(getMinZoom(), zoom);
    applyTransform();
});

mapSurface.addEventListener('wheel', handleWheel, {
    passive: false
});
zoomInButton.addEventListener('click', () => adjustZoom(1.2));
zoomOutButton.addEventListener('click', () => adjustZoom(1 / 1.2));

mapSurface.addEventListener('pointerdown', beginDrag);
mapSurface.addEventListener('pointermove', handleDrag);
mapSurface.addEventListener('pointerup', endDrag);
mapSurface.addEventListener('pointercancel', endDrag);

mapSurface.addEventListener('pointerleave', (event) => {
    if (!dragging) {
        updateCoordinateDisplay(event.clientX, event.clientY);
    }
});