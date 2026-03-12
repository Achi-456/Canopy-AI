# Canopy-AI: Smart Vertical Farming System with Digital Twin

## 🤖 AI Context & System Overview
**Notice to AI Assistants:** This README is specifically structured to provide comprehensive context about the codebase, architecture, and design patterns, enabling you to reason about and assist with the project efficiently.

**Project Description:** 
Canopy-AI is a full-stack IoT and AI-driven Smart Vertical Farming system. It features a real-time web dashboard that interfaces with a backend simulation of physical farming sensors. The backend maintains a **Digital Twin** (a virtual representation of the physical farm state) and uses **AI Optimization** (Google Gemini) to analyze environmental data and provide actionable recommendations.

### Core Mechanisms:
1. **Sensor Simulation:** The backend generates realistic telemetry (temperature, humidity, pH, EC, light) mimicking physical IoT sensors.
2. **Real-time Communication:** The backend uses WebSockets to stream live sensor data, digital twin states, active controls, and AI recommendations to the frontend dashboard.
3. **AI Integration:** The backend periodically sends aggregated sensor data to the Gemini API, which returns JSON-formatted insights and recommendations for crop optimization.
4. **Data Persistence:** Firebase Firestore is used (or configured to be used) for persistent storage of telemetry and system states.

---

## 🏗️ Architecture & Tech Stack

### Frontend (`/smart-farm-frontend`)
*   **Framework:** React 19 + Vite
*   **Routing & State:** React Router, React Hooks (Custom `useWebSocket` hook)
*   **Styling & UI:** Tailwind CSS (assumed/planned), Framer Motion (animations), Lucide React (icons)
*   **Data Visualization:** Recharts
*   **Role:** Subscribes to backend via WebSocket (`ws://localhost:5000`) and visualizes real-time metrics, digital twin status, and AI insights.

### Backend (`/backend`)
*   **Runtime:** Node.js (v20+)
*   **Framework:** Express.js (HTTP API layer)
*   **Real-time:** `ws` (WebSocket server)
*   **AI Integration:** `@google/genai` (Google Gemini SDK)
*   **Database:** `firebase-admin` (Firestore)
*   **Task Scheduling:** `node-cron`
*   **Role:** Acts as the central hub. Simulates sensors, maintains the Digital Twin state, proxies AI requests, and streams data to connected clients.

### Infrastructure & Deployment
*   **Containerization:** Docker & Docker Compose
*   **Frontend Serving:** Nginx (Multi-stage Docker build)

---

## 📂 Repository Structure

```text
/ (Root)
├── docker-compose.yml       # Orchestrates frontend (port 80) and backend (port 5000) containers
├── backend/                 # Node.js Express server
│   ├── .env.example         # Required env variables (Firebase credentials, Gemini Key)
│   ├── Dockerfile           # Backend container definition
│   ├── server.js            # Main entry point (HTTP & WebSocket setup)
│   ├── sensorSimulator.js   # Generates realistic mock telemetry data
│   ├── digitalTwin.js       # Maintains and updates the virtual state of the farm
│   ├── aiOptimizer.js       # Handles communication with Google Gemini API
│   └── firebase.js          # Firestore database connection setup
└── smart-farm-frontend/     # React application
    ├── Dockerfile           # Multi-stage build (Vite build -> Nginx serving)
    ├── nginx.conf           # SPA routing and API/WS proxy configuration
    ├── vite.config.js       # Vite bundler config
    └── src/
        ├── hooks/
        │   └── useWebSocket.js # Custom hook managing stable WS connection to backend
        ├── components/      # Reusable UI elements (Sidebar, etc.)
        ├── pages/           # Route views (Dashboard, AIInsights, DigitalTwin, Controls)
        ├── App.jsx          # Main application component & routing layout
        └── main.jsx         # React DOM entry point
```

---

## 🚀 Setup & Execution

### Option 1: Docker (Recommended for Production/Deployment)
The project is fully dockerized with a reverse proxy (Nginx) handling frontend SPA routing and proxying API/WS requests to the backend.

1. Create `backend/.env` using `backend/.env.example` as a template.
2. Ensure Firebase credentials and `GEMINI_API_KEY` are provided.
3. Run from the root directory:
   ```bash
   docker compose up --build -d
   ```
4. Access the application at `http://localhost`.

### Option 2: Local Development (Hot Reloading)
**Backend:**
```bash
cd backend
npm install
# Ensure .env is configured
npm run dev # or npm start
# Runs on localhost:5000
```

**Frontend:**
```bash
cd smart-farm-frontend
npm install
npm run dev
# Runs on localhost:5173
```

---

## 🔑 Crucial Logic Flows for AI Reasoning

When modifying this repository, keep these architectural patterns in mind:

1. **WebSocket Proxying:** When deployed via Docker, the frontend communicates with the backend WebSocket through Nginx proxying at `ws://<host>/ws`. In local dev, it connects directly to `ws://localhost:5000`. Refer to `nginx.conf` and `useWebSocket.js` when modifying network behaviors.
2. **AI Prompting:** The `aiOptimizer.js` module constructs specific prompts instructing Gemini to return strict JSON describing system status, anomalies, and recommended actions. If changing the AI output format, both the prompt in `aiOptimizer.js` and the parsing logic in the frontend `AIInsights` page must be updated synchronously.
3. **Digital Twin Synchronization:** `digitalTwin.js` listens to `sensorSimulator.js` output and updates its internal state. The WebSocket server broadcasts this state. To add new sensor metrics, they must be added to the simulator, the digital twin state model, and the frontend visualization components (Recharts configurations).
