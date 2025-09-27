
# Real-Time Vehicle Telemetry Dashboard with AI Capabilities

This project provides a complete solution for reading live data from a vehicle's On-Board Diagnostics (OBD-II) port and displaying it on a modern, web-based dashboard. Powered by an **NVIDIA Jetson Nano**, this platform not only visualizes data but also serves as a foundation for in-car AI, computer vision, and sensor fusion applications.

The server is designed to be resilient, featuring an automatic "Demo Mode" that generates simulated data if no OBD-II adapter is connected, making it perfect for development and showcasing without a physical vehicle connection.

## Key Features ✨

  * **AI-Ready Platform:** Hosted on an NVIDIA Jetson Nano, enabling future expansion into real-time AI tasks like object detection from the camera feed or sensor fusion with LIDAR data.
  * **Real-Time Data Streaming:** Connects to any standard ELM327-based OBD-II adapter and streams key vehicle metrics over WebSockets.
  * **Comprehensive Metrics:** Gathers and displays a wide range of data, including:
      * **Primary Metrics:** RPM, Vehicle Speed, Engine Load, Coolant Temperature, Fuel Level, and more.
      * **Calculated Metrics:** Real-time MPG, Acceleration (m/s²), Trip Distance, and Total Idling Time.
      * **Vehicle Status:** Ignition State and Diagnostic Trouble Codes (DTCs).
  * **Advanced Visualization:** The dashboard features side-by-side windows for:
      * **Live Camera Feed:** A real-time video stream from a connected webcam.
      * **LIDAR Visualization:** A top-down, 2D representation of LIDAR point-cloud data (currently simulated).
  * **Remote Accessibility:** Includes instructions for using `localtunnel` to easily and securely expose the dashboard to the internet, allowing you to monitor your vehicle from anywhere.

-----

## Hardware & Software Requirements

### Hardware 🛠️

1.  **NVIDIA Jetson Nano:** This powerful, compact AI computer serves as the brain of the project, running the backend server.
2.  **USB OBD-II Adapter:** A standard ELM327-based adapter with a USB connection.
3.  **Webcam:** A standard USB webcam compatible with the Jetson Nano.
4.  **(Optional) LIDAR Sensor:** A 2D or 3D LIDAR sensor compatible with the Jetson Nano for future expansion.

### Software 💻

  * **Jetson Nano OS:** Flashed with the official NVIDIA JetPack SDK.
  * **Python 3.7+**
  * **Required Python Libraries:**
      * `pyserial`: For communicating with the USB adapter.
      * `websockets`: For real-time data streaming to the dashboard.
  * **`localtunnel` (Optional):** A command-line tool for exposing the server to the internet. Requires `npm`/`nodejs`.

-----

## Setup and Installation

Follow these steps to get your telemetry dashboard up and running on the Jetson Nano.

### 1\. Install Python Dependencies

Open a terminal on your Jetson Nano and install the necessary Python libraries using `pip`:

```bash
pip install pyserial websockets
```

### 2\. Install `localtunnel` (Optional)

If you want to access your dashboard from outside your local network, you'll need to install `localtunnel`.

```bash
# Install Node.js and npm (if not already installed)
sudo apt update
sudo apt install npm nodejs -y

# Install localtunnel globally
sudo npm install -g localtunnel
```

### 3\. Connect the Hardware

1.  Plug the OBD-II adapter into your vehicle's OBD-II port.
2.  Turn the vehicle's ignition to the "On" position.
3.  Connect the USB end of the adapter to one of the Jetson Nano's USB ports.
4.  Connect your webcam to another USB port on the Jetson Nano.

-----

## How to Use

### 1\. Start the Server

Open a terminal on your Jetson Nano, navigate to the project directory, and run the following command:

```bash
python3 server.py
```

  * The server will automatically try to connect to the OBD-II adapter at `/dev/ttyUSB0`.
  * If it succeeds, it will initialize the adapter and start broadcasting live vehicle data.
  * If it fails, it will notify you and start broadcasting simulated data in **Demo Mode**.

### 2\. Accessing the Dashboard

#### Method A: Local Network Access

While the server is running, you can access the dashboard from any device on the **same Wi-Fi network**.

1.  Find the local IP address of your Jetson Nano (e.g., `192.168.1.15`).
2.  On another device (phone, tablet, laptop), open a web browser and navigate to:
    `http://<JETSON_NANO_IP>:8000/index.html`

#### Method B: Internet Access with `localtunnel`

To access your dashboard from anywhere in the world:

1.  Make sure the `server.py` script is running.
2.  Open a **new** terminal window on the Jetson Nano and run:
    ```bash
    lt --port 8080
    ```
3.  `localtunnel` will provide you with a public URL, like `https://your-url.loca.lt`.
4.  Open your `dashbaord.js` file and change the WebSocket connection line to use this new URL, making sure to use **`wss://`**:
    ```javascript
    const socket = new WebSocket('wss://your-url.loca.lt');
    ```
5.  Now you can access your hosted `index.html` from any device with an internet connection.

-----

## File Descriptions

  * ### `server.py`

    The core backend script. It handles the connection to the OBD-II adapter, polls for data, processes it, and broadcasts it to all connected dashboard clients via a WebSocket server. It's built with `asyncio` for efficient, non-blocking operation.

  * ### `index.html`

    The main HTML file that structures the dashboard page, including containers for the camera feed, LIDAR canvas, and all the metric displays.

  * ### `dashboard.css`

    The stylesheet that provides the modern, dark-themed look and feel for the dashboard. It handles the responsive grid layout and the side-by-side media windows.

  * ### `dashbaord.js`

    The client-side JavaScript that powers the dashboard. It connects to the WebSocket server, updates the metric values in real-time, handles the camera feed logic, and runs the simulated LIDAR visualization.
