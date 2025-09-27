const statusDiv = document.getElementById('status');
// Use a real URL from your localtunnel or ngrok service
const socket = new WebSocket('wss:purple-rivers-lay.loca.lt'); 
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
const cameraContainer = document.getElementById('camera-container');
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

function resetDashboard() {
    for (const key in dataElements) {
        const element = dataElements[key];
        if (element) {
            if (element.children.length > 0 && element.children[0].tagName === 'SPAN') {
                element.children[0].textContent = '---';
            } else {
                element.textContent = '---';
            }
        }
    }
}

async function startCamera() {
    cameraPlaceholder.style.display = 'flex';
    videoElement.style.display = 'none';
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        cameraStream = stream;
        videoElement.srcObject = stream;
        videoElement.style.display = 'block';
        cameraPlaceholder.style.display = 'none';
        isCameraOn = true;
        cameraToggleButton.textContent = 'Hide Camera Feed';
        cameraToggleStatus.textContent = 'Camera is ON';
    } catch (err) {
        console.error("Error accessing camera: ", err);
        cameraPlaceholder.textContent = "Camera not available.";
        isCameraOn = false;
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }
    videoElement.style.display = 'none';
    cameraPlaceholder.style.display = 'flex';
    cameraPlaceholder.textContent = 'Camera Paused';
    isCameraOn = false;
    cameraToggleButton.textContent = 'Show Camera Feed';
    cameraToggleStatus.textContent = 'Camera is OFF';
}

function toggleCamera() {
    if (isCameraOn) {
        stopCamera();
    } else {
        startCamera();
    }
}

// --- Lidar Simulation Logic ---
function drawLidar() {
    const w = lidarCanvas.width;
    const h = lidarCanvas.height;
    const centerX = w / 2;
    const centerY = h - 20; // Position the "car" at the bottom center

    lidarCtx.clearRect(0, 0, w, h);
    lidarCtx.fillStyle = '#000';
    lidarCtx.fillRect(0, 0, w, h);

    // Draw the car representation
    lidarCtx.fillStyle = '#007bff';
    lidarCtx.fillRect(centerX - 10, centerY - 5, 20, 10);

    // Draw simulated lidar points
    for (let i = 0; i < 200; i++) {
        const angle = Math.random() * Math.PI; // 180-degree forward scan
        const maxDist = Math.min(centerX, centerY);
        
        // Simulate some objects
        let distance = Math.random() * maxDist;
        if (Math.random() > 0.95) {
            distance = Math.random() * (maxDist * 0.4) + (maxDist * 0.2);
        }

        const x = centerX - Math.cos(angle) * distance;
        const y = centerY - Math.sin(angle) * distance;

        lidarCtx.fillStyle = `rgba(0, 245, 212, ${1 - (distance / maxDist)})`; // Teal points, fade with distance
        lidarCtx.beginPath();
        lidarCtx.arc(x, y, 2, 0, Math.PI * 2);
        lidarCtx.fill();
    }

    lidarAnimationId = requestAnimationFrame(drawLidar);
}

function startLidar() {
    // Resize canvas to fit container
    const rect = lidarCanvas.parentElement.getBoundingClientRect();
    lidarCanvas.width = rect.width;
    lidarCanvas.height = rect.height;
    if (lidarAnimationId) {
        cancelAnimationFrame(lidarAnimationId);
    }
    drawLidar();
}

// Event Listeners
cameraToggleButton.addEventListener('click', toggleCamera);
window.addEventListener('resize', startLidar); // Redraw on resize

// --- WebSocket Connection ---
socket.onopen = function(event) {
    setStatus('Status: Connected to server.', 'success');
    startLidar(); // Start lidar simulation once connected
};

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    // You can later add a case here to handle real lidar data
    // if (data.type === 'lidar') { ... }

    // Update OBD metrics
    for (const key in data) {
        const element = dataElements[key];
        if (element) {
            const value = data[key];

            // Handle null/undefined values gracefully
            if (value === null || typeof value === 'undefined') {
                if (element.children.length > 0 && element.children[0].tagName === 'SPAN') {
                    element.children[0].textContent = '---';
                } else {
                    element.textContent = '---';
                }
                // Cleanup classes
                if (key === 'ignitionState') element.classList.remove('Off', 'On', 'Running');
                if (key === 'dtc') element.classList.remove('has-dtc', 'no-dtc');
                continue;
            }
            
            if (key === 'ignitionState') {
                element.textContent = value;
                element.classList.remove('Off', 'On', 'Running');
                element.classList.add(value);
            } else if (key === 'dtc') {
                const hasDTCs = value && value.length > 0 && value !== 'None';
                element.textContent = hasDTCs ? value : 'None';
                element.classList.remove('has-dtc', 'no-dtc');
                element.classList.add(hasDTCs ? 'has-dtc' : 'no-dtc');
            } else if (key === 'idlingTime') {
                const date = new Date(0);
                date.setSeconds(value);
                element.textContent = date.toISOString().substr(11, 8);
            } else if (typeof value === 'number') {
                // Find the span if it exists, otherwise use the element itself
                const target = element.querySelector('span') || element;
                target.textContent = Number(value).toFixed(1);
            } else {
                const target = element.querySelector('span') || element;
                target.textContent = value;
            }
        }
    }
};

socket.onclose = function(event) {
    setStatus('Status: Disconnected from server. Please restart the Python server and refresh.', 'error');
    resetDashboard();
    stopCamera();
    if (lidarAnimationId) cancelAnimationFrame(lidarAnimationId);
};

socket.onerror = function(error) {
    setStatus('Status: Connection error. Is the Python server running?', 'error');
    resetDashboard();
    stopCamera();
    if (lidarAnimationId) cancelAnimationFrame(lidarAnimationId);
};

