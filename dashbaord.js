const statusDiv = document.getElementById('status');
const socket = new WebSocket('wss:///new-cups-thank.loca.lt
'); 
const dataElements = {
    rpm: document.getElementById('rpm'),
    speed: document.getElementById('speed'),
    coolantTemp: document.getElementById('coolantTemp'),
    engineLoad: document.getElementById('engineLoad'),
    fuelLevel: document.getElementById('fuelLevel'),
    throttlePos: document.getElementById('throttlePos'),
    mafAirFlow: document.getElementById('mafAirFlow'),
    mpg: document.getElementById('mpg'),
    batteryVoltage: document.getElementById('batteryVoltage'),
    soc: document.getElementById('soc'),
    idlingTime: document.getElementById('idlingTime'),
    acceleration: document.getElementById('acceleration'),
    tripDistance: document.getElementById('tripDistance'),
    dtc: document.getElementById('dtc'),
    ignitionState: document.getElementById('ignitionState'),
};

// --- Camera Elements and Logic ---
const videoElement = document.getElementById('cameraFeed');
const cameraToggleButton = document.getElementById('camera-toggle-btn');
const cameraToggleStatus = document.getElementById('camera-toggle-status');
const cameraPlaceholder = document.getElementById('camera-placeholder');
let cameraStream = null;
let isCameraOn = false;

// --- Lidar Elements and Logic ---
const lidarCanvas = document.getElementById('lidar-canvas');
const lidarCtx = lidarCanvas.getContext('2d');
let lidarAnimationId = null;

function setStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
}

async function startCamera() {
    cameraPlaceholder.textContent = 'Accessing Camera...';
    videoElement.style.display = 'none';
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        cameraStream = stream;
        videoElement.srcObject = stream;
        videoElement.style.display = 'block';
        isCameraOn = true;
        cameraToggleButton.textContent = 'Hide Camera Feed';
        cameraToggleStatus.textContent = 'Camera is ON';
    } catch (err) {
        console.error("Error accessing camera: ", err);
        cameraPlaceholder.textContent = "Camera not available.";
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }
    videoElement.style.display = 'none';
    cameraPlaceholder.textContent = 'Camera Paused';
    isCameraOn = false;
    cameraToggleButton.textContent = 'Show Camera Feed';
    cameraToggleStatus.textContent = 'Camera is OFF';
}

function toggleCamera() {
    isCameraOn ? stopCamera() : startCamera();
}

// --- Lidar Simulation Logic ---
function drawLidar() {
    const w = lidarCanvas.width;
    const h = lidarCanvas.height;
    const centerX = w / 2;
    const centerY = h - 20;

    lidarCtx.fillStyle = '#000';
    lidarCtx.fillRect(0, 0, w, h);

    // Draw the car
    lidarCtx.fillStyle = '#007bff';
    lidarCtx.fillRect(centerX - 10, centerY - 5, 20, 10);

    // Draw simulated points
    for (let i = 0; i < 200; i++) {
        const angle = Math.random() * Math.PI;
        const maxDist = Math.min(centerX, centerY);
        let distance = Math.random() * maxDist;
        if (Math.random() > 0.95) {
            distance = Math.random() * (maxDist * 0.4) + (maxDist * 0.2);
        }
        const x = centerX - Math.cos(angle) * distance;
        const y = centerY - Math.sin(angle) * distance;
        lidarCtx.fillStyle = `rgba(0, 245, 212, ${1 - (distance / maxDist)})`;
        lidarCtx.beginPath();
        lidarCtx.arc(x, y, 2, 0, Math.PI * 2);
        lidarCtx.fill();
    }
    lidarAnimationId = requestAnimationFrame(drawLidar);
}

function startLidar() {
    const rect = lidarCanvas.parentElement.getBoundingClientRect();
    lidarCanvas.width = rect.width;
    lidarCanvas.height = rect.height;
    if (lidarAnimationId) cancelAnimationFrame(lidarAnimationId);
    drawLidar();
}

// Event Listeners
cameraToggleButton.addEventListener('click', toggleCamera);
window.addEventListener('resize', startLidar);

// WebSocket Connection
socket.onopen = function() {
    setStatus('Status: Connected to server.', 'success');
    startLidar();
};

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    for (const key in data) {
        const element = dataElements[key];
        if (element) {
            const value = data[key];
            if (value === null || typeof value === 'undefined') {
                const target = element.querySelector('span') || element;
                target.textContent = '---';
                continue;
            }
            if (key === 'ignitionState') {
                element.textContent = value;
                element.className = `metric-value text-status ${value}`;
            } else if (key === 'dtc') {
                const hasDTCs = value && value.length > 0 && value !== 'None';
                element.textContent = hasDTCs ? value : 'None';
                element.className = `metric-value small-text dtc ${hasDTCs ? 'has-dtc' : 'no-dtc'}`;
            } else if (key === 'idlingTime') {
                const date = new Date(0);
                date.setSeconds(value);
                element.textContent = date.toISOString().substr(11, 8);
            } else if (typeof value === 'number') {
                const target = element.querySelector('span') || element;
                target.textContent = Number(value).toFixed(1);
            } else {
                const target = element.querySelector('span') || element;
                target.textContent = value;
            }
        }
    }
};

socket.onclose = function() {
    setStatus('Status: Disconnected. Please restart the server and refresh.', 'error');
    stopCamera();
    if (lidarAnimationId) cancelAnimationFrame(lidarAnimationId);
};

socket.onerror = function() {
    setStatus('Status: Connection error. Is the server running?', 'error');
    stopCamera();
    if (lidarAnimationId) cancelAnimationFrame(lidarAnimationId);
};



