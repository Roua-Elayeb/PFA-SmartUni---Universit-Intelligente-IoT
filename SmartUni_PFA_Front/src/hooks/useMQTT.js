// ============================================================
//  SmartUni Front — useMQTT.js
//  Fichier : src/hooks/useMQTT.js
//
//  Hook React Native qui :
//  1. Connecte au backend via Socket.IO pour les updates temps réel
//  2. Reconnecte automatiquement si déconnecté
//  3. Expose : sensors, alerts, isConnected, lastUpdate
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = 'http://192.168.0.121:5000'; // même URL que l'API

export function useMQTT() {
  const [sensors, setsensors]         = useState([]);
  const [newAlert, setNewAlert]       = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate]   = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('🔌 Socket.IO connecté');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.warn('⚠️ Socket.IO déconnecté');
    });

    // Mise à jour capteur en temps réel (depuis MQTT → backend → Socket.IO)
    socket.on('sensor:update', (sensor) => {
      setLastUpdate(new Date());
      setsensors((prev) => {
        // Remplacer la dernière valeur du même deviceId
        const idx = prev.findIndex((s) => s.deviceId === sensor.deviceId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = sensor;
          return updated;
        }
        return [sensor, ...prev];
      });
    });

    // Nouvelle alerte (warning/critical automatique)
    socket.on('alert:new', (data) => {
      setNewAlert(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const clearAlert = useCallback(() => setNewAlert(null), []);

  return { sensors, newAlert, clearAlert, isConnected, lastUpdate };
}