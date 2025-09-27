const statusDiv = document.getElementById('status');
const socket = new WebSocket('wss://kind-nights-share.loca.lt');
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

const videoElement = document.getElementById('cameraFeed');
const cameraContainer = document.getElementById('camera-container');
const cameraToggleButton = document.getElementById('camera-toggle-btn');
const cameraToggleStatus = document.getElementById('camera-toggle-status');
const cameraPlaceholder = document.getElementById('camera-placeholder');
let cameraStream = null;
let isCameraOn = false;

async function startCamera() {
    cameraPlaceholder.style.display = 'flex';
    videoElement.style.display = 'none';
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraStream = stream;
        videoElement.srcObject = stream;
        videoElement.style.display = 'block';
        cameraPlaceholder.style.display = 'none';
        cameraContainer.classList.add('visible');
        cameraToggleButton.textContent = 'Hide Camera Feed';
        cameraToggleStatus.textContent = 'Camera is ON';
        isCameraOn = true;
    } catch (error) {
        console.error("Error accessing camera: ", error);
        cameraContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: var(--error-color);">Could not access camera. Please grant permission.</p>`;
        cameraContainer.classList.add('visible');
        cameraPlaceholder.style.display = 'none';
        cameraToggleButton.textContent = 'Camera Unavailable';
        cameraToggleButton.disabled = true;
        cameraToggleStatus.textContent = 'Camera Unavailable';
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
        cameraStream = null;
    }
    cameraContainer.classList.remove('visible');
    cameraToggleButton.textContent = 'Show Camera Feed';
    cameraToggleStatus.textContent = 'Camera is OFF';
    isCameraOn = false;
}

cameraToggleButton.addEventListener('click', () => {
    if (isCameraOn) {
        stopCamera();
    } else {
        startCamera();
    }
});

function resetDashboard() {
    for(const key in dataElements) {
        const element = dataElements[key];
        if (key === 'dtc') {
            element.textContent = '---';
            element.classList.remove('has-dtc', 'no-dtc');
        } else if (key === 'ignitionState') {
            element.textContent = '---';
            element.classList.remove('Off', 'On', 'Running');
        }
        else {
            element.textContent = '---';
        }
    }
}

function setStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type; // 'success', 'error', or 'warning'
}

socket.onopen = function(event) {
    setStatus('Status: Connected to server. Awaiting OBD-II data...', 'warning');
};

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    if (data.status === 'disconnected') {
        setStatus(`Status: ${data.error}`, 'error');
        resetDashboard();
        return;
    }
    
    setStatus('Status: Connected and receiving data.', 'success');

    for (const key in data) {
        if (dataElements[key]) {
            const value = data[key];
            const element = dataElements[key];

            if (value === null || value === undefined) {
                element.textContent = 'N/A';
                if (key === 'ignitionState') element.classList.remove('Off', 'On', 'Running');
                if (key === 'dtc') element.classList.remove('has-dtc', 'no-dtc');
                continue;
            }
            
            if (key === 'ignitionState') {
                element.textContent = value;
                element.classList.remove('Off', 'On', 'Running');
                element.classList.add(value);
            } else if (key === 'dtc') {
                const hasDTCs = value && value.length > 0;
                element.textContent = hasDTCs ? value : 'None';
                element.classList.remove('has-dtc', 'no-dtc');
                element.classList.add(hasDTCs ? 'has-dtc' : 'no-dtc');
            } else if (key === 'idlingTime') {
                const date = new Date(0);
                date.setSeconds(value);
                element.textContent = date.toISOString().substr(11, 8);
            } else if (typeof value === 'number') {
                element.textContent = Number(value).toFixed(1);
            } else {
                element.textContent = value;
            }
        }
    }
};

socket.onclose = function(event) {
    setStatus('Status: Disconnected from server. Please restart the Python server and refresh.', 'error');
    resetDashboard();
    stopCamera();
};

socket.onerror = function(error) {
    setStatus('Status: Connection error. Is the Python server running?', 'error');
    resetDashboard();
    stopCamera();

};







