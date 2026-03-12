import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:5000';

export function useWebSocket() {
  const [sensorData, setSensorData] = useState(null);
  const [digitalTwinData, setDigitalTwinData] = useState(null);
  const [controls, setControls] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [connected, setConnected] = useState(false);
  const [sensorHistory, setSensorHistory] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        console.log('✅ WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          switch (message.type) {
            case 'sensor-update':
              setSensorData(message.data);
              setSensorHistory(prev => {
                const updated = [...prev, message.data];
                return updated.slice(-60);
              });
              break;
            case 'digital-twin-update':
              setDigitalTwinData(message.data);
              break;
            case 'controls-update':
              setControls(message.data);
              break;
            case 'ai-recommendation':
              setAiRecommendation(message.data);
              break;
          }
        } catch (err) {
          console.error('WebSocket parse error:', err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        console.log('WebSocket disconnected, reconnecting...');
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
      reconnectTimer.current = setTimeout(connect, 3000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  return { sensorData, digitalTwinData, controls, aiRecommendation, connected, sensorHistory };
}
