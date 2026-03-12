/**
 * Smart Vertical Farming System - Backend Server
 * Express + WebSocket server with sensor simulation, digital twin, and AI optimization
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const cron = require('node-cron');
require('dotenv').config();

const { db } = require('./firebase');
const SensorSimulator = require('./sensorSimulator');
const DigitalTwin = require('./digitalTwin');
const AIOptimizer = require('./aiOptimizer');

// Initialize modules
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const simulator = new SensorSimulator();
const digitalTwin = new DigitalTwin();
const aiOptimizer = new AIOptimizer();

// Middleware
app.use(cors());
app.use(express.json());

// State
let latestSensorData = null;
let latestDigitalTwinState = null;
let sensorHistory = [];
const MAX_HISTORY = 200;

let controls = {
  ledIntensity: 70,
  pumpActive: false,
  nutrientDosing: 3,
  irrigationInterval: 60,
  irrigationDuration: 30,
  autoMode: true,
};

// ========== WebSocket ==========
const wsClients = new Set();

wss.on('connection', (ws) => {
  wsClients.add(ws);
  console.log(`🔌 WebSocket client connected (${wsClients.size} total)`);

  // Send current state on connect
  if (latestSensorData) {
    ws.send(JSON.stringify({ type: 'sensor-update', data: latestSensorData }));
  }
  if (latestDigitalTwinState) {
    ws.send(JSON.stringify({ type: 'digital-twin-update', data: latestDigitalTwinState }));
  }
  ws.send(JSON.stringify({ type: 'controls-update', data: controls }));

  ws.on('close', () => {
    wsClients.delete(ws);
    console.log(`🔌 WebSocket client disconnected (${wsClients.size} total)`);
  });
});

function broadcast(type, data) {
  const message = JSON.stringify({ type, data });
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// ========== Sensor Data Collection ==========
async function collectSensorData() {
  // Apply current controls to simulator
  simulator.applyControls(controls);

  // Generate reading
  const reading = simulator.generateReading();
  latestSensorData = reading;

  // Store in history
  sensorHistory.push(reading);
  if (sensorHistory.length > MAX_HISTORY) {
    sensorHistory = sensorHistory.slice(-MAX_HISTORY);
  }

  // Store in Firestore
  try {
    await db.collection('sensorReadings').add(reading);
  } catch (err) {
    // Silent fail for storage
  }

  // Run digital twin simulation
  const twinResults = digitalTwin.simulate(reading);
  latestDigitalTwinState = {
    plants: twinResults,
    systemHealth: digitalTwin.calculateSystemHealth(),
    lastUpdated: Date.now(),
  };

  // Broadcast updates
  broadcast('sensor-update', reading);
  broadcast('digital-twin-update', latestDigitalTwinState);

  return reading;
}

// Collect sensor data every 10 seconds
cron.schedule('*/10 * * * * *', collectSensorData);

// Initial data collection
setTimeout(collectSensorData, 1000);

// ========== REST API Routes ==========

// --- Sensors ---
app.get('/api/sensors/latest', (req, res) => {
  if (!latestSensorData) {
    return res.json({ message: 'No sensor data yet', data: null });
  }
  res.json({ data: latestSensorData });
});

app.get('/api/sensors/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const history = sensorHistory.slice(-limit);
  res.json({ data: history, total: sensorHistory.length });
});

// --- Digital Twin ---
app.get('/api/digital-twin/state', (req, res) => {
  const state = digitalTwin.getState();
  res.json({ data: state });
});

app.post('/api/digital-twin/simulate', (req, res) => {
  if (!latestSensorData) {
    return res.status(400).json({ error: 'No sensor data available yet' });
  }
  const results = digitalTwin.simulate(latestSensorData);
  res.json({ data: results });
});

app.get('/api/digital-twin/crops', (req, res) => {
  res.json({ data: digitalTwin.getCropProfiles() });
});

// --- Plants ---
app.get('/api/plants', (req, res) => {
  const state = digitalTwin.getState();
  res.json({ data: state.plants });
});

app.post('/api/plants', (req, res) => {
  const { cropType, name } = req.body;
  if (!cropType || !name) {
    return res.status(400).json({ error: 'cropType and name are required' });
  }
  try {
    const plant = digitalTwin.addPlant(cropType, name);
    res.json({ data: plant });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/plants/:id', (req, res) => {
  digitalTwin.removePlant(req.params.id);
  res.json({ success: true });
});

// --- AI Optimization ---
app.post('/api/ai/optimize', async (req, res) => {
  if (!latestSensorData) {
    return res.status(400).json({ error: 'No sensor data available yet' });
  }

  try {
    const plantStates = digitalTwin.getState().plants;
    const recommendation = await aiOptimizer.optimize(latestSensorData, plantStates);

    // Auto-apply in auto mode
    if (controls.autoMode) {
      controls.ledIntensity = recommendation.ledIntensity;
      controls.nutrientDosing = recommendation.nutrientDosing;
      controls.irrigationInterval = recommendation.irrigationInterval;
      controls.irrigationDuration = recommendation.irrigationDuration;
      broadcast('controls-update', controls);
    }

    broadcast('ai-recommendation', recommendation);
    res.json({ data: recommendation });
  } catch (err) {
    console.error('AI optimization error:', err);
    res.status(500).json({ error: 'AI optimization failed' });
  }
});

app.get('/api/ai/latest', (req, res) => {
  const latest = aiOptimizer.getLastRecommendation();
  res.json({ data: latest });
});

app.get('/api/ai/history', (req, res) => {
  res.json({ data: aiOptimizer.getHistory() });
});

// --- Controls ---
app.get('/api/controls', (req, res) => {
  res.json({ data: controls });
});

app.post('/api/controls/update', (req, res) => {
  const updates = req.body;
  controls = { ...controls, ...updates };
  broadcast('controls-update', controls);
  res.json({ data: controls });
});

// --- System ---
app.get('/api/system/status', (req, res) => {
  res.json({
    data: {
      uptime: process.uptime(),
      sensorDataPoints: sensorHistory.length,
      activeWebSockets: wsClients.size,
      plantsMonitored: digitalTwin.getState().plants.length,
      systemHealth: digitalTwin.calculateSystemHealth(),
      autoMode: controls.autoMode,
      aiSource: aiOptimizer.hasApi ? 'gemini' : 'rule-based',
    },
  });
});

// ========== Auto-optimize every 2 minutes ==========
cron.schedule('*/2 * * * *', async () => {
  if (latestSensorData && controls.autoMode) {
    try {
      const plantStates = digitalTwin.getState().plants;
      const recommendation = await aiOptimizer.optimize(latestSensorData, plantStates);
      controls.ledIntensity = recommendation.ledIntensity;
      controls.nutrientDosing = recommendation.nutrientDosing;
      broadcast('controls-update', controls);
      broadcast('ai-recommendation', recommendation);
      console.log('🤖 Auto-optimization applied');
    } catch (err) {
      console.error('Auto-optimization error:', err);
    }
  }
});

// ========== Start Server ==========
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║  🌱 Smart Vertical Farming System Backend       ║
║  ──────────────────────────────────────────────  ║
║  Server:     http://localhost:${PORT}              ║
║  WebSocket:  ws://localhost:${PORT}                ║
║  Sensors:    Simulating every 10 seconds         ║
║  AI Mode:    ${aiOptimizer.hasApi ? 'Gemini API     ' : 'Rule-based     '}                  ║
╚══════════════════════════════════════════════════╝
  `);
});
