1. Backend Logic (backend/main.py)
The core of the system is built on FastAPI for asynchronous data handling. Key modules include:

A. Hardware Communication Layer
The system reads raw data from the microcontroller via Serial (USB) at 115200 baud.
background_reader(): A dedicated daemon thread that continuously polls the serial port. It prevents the main server thread from blocking during I/O operations.
Signal Processing:
Exponential Moving Average (EMA): Applied to raw load cell data to filter out high-frequency noise and micro-tremors (SMOOTH_FACTOR = 0.6).
Tare Function: calibrate_sensor() captures the current load as a zero-reference offset vector.
B. Center of Pressure (CoP) Calculation
The core biomechanical metric is derived from the 4-quadrant weight distribution:

Python
# Simplified Logic
CoP_X = ((Right_Sensors) - (Left_Sensors)) / Total_Weight
CoP_Y = ((Front_Sensors) - (Back_Sensors)) / Total_Weight
Normalization: Coordinates are clamped between -1.0 and 1.0 for UI rendering.
Stability Index: Calculated as the Euclidean distance from the center (0,0). If distance < 0.2, the state is classified as GREEN (Stable).
C. AI Integration (Google Gemini)
Model: gemini-flash-latest (optimized for low latency).
Prompt Engineering: The system constructs a dynamic prompt containing the patient's session metrics (Weight, Stability %, Duration).
The AI acts as a "Rehabilitation Doctor" strictly outputting clinical recommendations without conversational filler.
2. Frontend Logic (frontend/src/App.tsx)
The interface is built with React and TypeScript, focusing on real-time visual feedback.

A. Real-Time Data Visualization
WebSockets (useSensors.ts): Instead of HTTP polling, the app maintains a persistent WebSocket connection (ws://localhost:8000/ws). This ensures <50ms latency for the biofeedback loop, which is critical for motor learning.
CoPVisualizer Component: Renders the patient's center of gravity as a moving cursor on a 2D plane. It uses CSS transforms for hardware-accelerated animations (60 FPS).
B. State Management
Session Lifecycle: The app manages distinct states: CALIBRATION -> TRAINING -> RESULTS.
Authentication: Implements OAuth2 workflow. User tokens are stored in localStorage for persistent sessions.
C. Analytics
Recharts Library: Used to plot the "Stability Trend" graph, visualizing the patient's progress over multiple sessions.
3. Data Flow Diagram
Фрагмент кода
graph TD
    A[Patient] -->|Stands on Platform| B(Load Cells)
    B -->|Analog Signal| C(HX711 Amplifier)
    C -->|Digital Data| D(Arduino/ESP32)
    D -->|JSON over Serial| E[Python Backend]
    E -->|Smoothing & CoP Calc| E
    E -->|WebSocket Stream| F[React Frontend]
    E -->|Session Data| G[Google Gemini AI]
    G -->|Clinical Report| F
    F -->|Visual Biofeedback| A
