# NeuroPhia: AI-Powered Post-Stroke Rehabilitation Platform

**NeuroPhia** is an affordable, high-tech telerehabilitation platform designed to restore balance and coordination in post-stroke patients. It combines custom hardware (dual-plate stabilometric platform) with AI-driven software to provide real-time biofeedback and clinical analysis.

---

## Key Features
* **Real-time Biofeedback:** Visualizes Center of Pressure (CoP) and weight distribution with ultra-low latency (<50ms) via WebSockets.
* **AI Clinical Analysis:** Integrated **Google Gemini LLM** generates instant, professional medical reports based on session metrics.
* **Tremor Filtering:** Custom DSP algorithms (Exponential Moving Average) isolate pathological tremor frequencies.
* **Gamified Rehabilitation:** Interactive training modes (Quick Test, Standard, Endurance).
* **Security:** JWT-based authentication and secure password hashing.

---

##  How It Works (User Journey)
*(Этот раздел оставляем без изменений, он у тебя уже есть)*
...

---

##  Deep Technical Architecture

This project implements a decoupled **Client-Server architecture** utilizing asynchronous I/O for high-performance data streaming.

### 1. Backend Engineering (`backend/main.py`)
**Core Framework:** FastAPI (Python 3.10+) running on Uvicorn.

#### A. Data Acquisition & Concurrency
* **Serial Interface:** Reads JSON streams from ESP32 at **115200 baud**.
* **Daemon Threading:** Implements a background `daemon thread` for non-blocking serial reading. This allows the main event loop to handle HTTP requests while simultaneously processing hardware interrupts.
* **Global State Management:** Uses a thread-safe `global data` dictionary to share sensor state between the serial reader and WebSocket endpoint.

#### B. Signal Processing (DSP)
* **Algorithm:** `ExponentialMovingAverage` (EMA) class.
* **Logic:** $S_t = \alpha \cdot Y_t + (1 - \alpha) \cdot S_{t-1}$ where $\alpha = 0.6$.
* **Purpose:** Filters out high-frequency electrical noise from HX711 amplifiers and micro-tremors, preserving voluntary motor control signals.

#### C. API & Security Layer
* **Authentication:** OAuth2 standard with **JWT (JSON Web Tokens)**.
* **Cryptography:** Passwords are hashed using `bcrypt` (via `passlib`).
* **WebSockets:** The `/ws` endpoint manages active connections using a custom `ConnectionManager` class, enabling full-duplex communication for the live graph.
* **Database:** SQLite with direct SQL queries for lightweight, serverless data persistence.

#### D. AI Integration
* **Library:** `google-generativeai` (Gemini 1.5 Flash).
* **Prompt Engineering:** The system dynamically constructs a clinical context prompt, injecting session variables (`avg_score`, `stability_index`, `duration`) to enforce a "Rehabilitation Doctor" persona response.

---

### 2. Frontend Engineering (`frontend/src/App.tsx`)
**Core Framework:** React 18 + TypeScript (Vite bundler).

#### A. Real-Time Visualization Engine
* **Custom Hooks:** `useSensors.ts` manages the WebSocket lifecycle (connect, disconnect, error handling) and state updates.
* **Rendering Optimization:**
    * **Components:** `CoPVisualizer` uses CSS `transform: translate3d()` for GPU-accelerated cursor movement (60 FPS).
    * **Charts:** `Recharts` library renders the "Stability Trend" with responsive containers.
* **Tailwind CSS:** Utility-first styling for rapid UI development and consistent design system (Slate/Emerald/Rose palette).

#### B. Application State
* **Finite State Machine:** The app transitions between strict states: `IDLE` -> `CALIBRATION` (3s countdown) -> `TRAINING` (Data recording) -> `RESULTS` (AI Analysis).
* **Type Safety:** Full TypeScript interfaces (`GraphPoint`, `DashboardProps`) ensure compile-time error checking for data props.

---

## 3. Firmware Logic (`firmware/`)
* **Hardware Abstraction:** Uses `HX711.h` library for 24-bit ADC communication.
* **Data Protocol:** Aggregates 4 independent load cell readings into a unified JSON packet to minimize Serial overhead.
* **Noise Gate:** Implements a hardware-level threshold (`if abs(val) < 10.0`) to zero out idle noise.

---

## Installation & Setup

### 1. Clone the Repository
```bash
git clone [https://github.com/kaisaraka/NeuroPhia.git](https://github.com/kaisaraka/NeuroPhia.git)
cd NeuroPhia
```
2. Backend Setup
Create a .env file in the backend folder and add your API keys:
```bash
GEMINI_API_KEY="your_google_api_key"
SECRET_KEY="your_secret_key"
```
Install dependencies and run the server:
```bash
cd backend
pip install -r requirements.txt
python main.py
```
3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
5. Firmware Setup (Arduino/ESP32)
To flash the microcontroller, you need the Arduino IDE with the following library installed:
HX711 by Bogdan Necula (v0.7.5 or newer)
Steps:
Open firmware/neurophia_firmware.ino in Arduino IDE.
Install the HX711 library via Library Manager.
Connect your board and upload.
