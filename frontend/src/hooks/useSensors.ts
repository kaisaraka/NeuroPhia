// frontend/hooks/useSensors.ts
import { useState, useEffect, useRef } from 'react';

export const useSensors = () => {
  const [data, setData] = useState({
    cop_x: 0,
    cop_y: 0,
    totalWeight: 0,
    weightDist: { tl: 0, tr: 0, bl: 0, br: 0 },
    aiStatus: 'CALIBRATING',
  });

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = () => {
      const socket = new WebSocket('ws://localhost:8000/ws');
      ws.current = socket;
      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setData(parsed);
        } catch (e) {}
      };
      socket.onclose = () => setTimeout(connect, 1000);
    };
    connect();
    return () => ws.current?.close();
  }, []);

  return data;
};