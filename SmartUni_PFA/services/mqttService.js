// ============================================================
//  SmartUni — mqttService.js (version complète avec Parking)
//  Remplace services/mqttService.js
//
//  Gère :
//   - smartuni/sensors/#    → capteurs (temp, humidité, CO2, AQI...)
//   - smartuni/parking/status → mise à jour places via ultrason
//   - smartuni/parking/entry  → voiture détectée à l'entrée
// ============================================================

const mqtt   = require('mqtt');
const Sensor  = require('../models/Sensor');
const Alert   = require('../models/Alert');
const Parking = require('../models/Parking');

const BROKER_URL = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com:1883';
const VALID_SENSOR_TYPES = ['temperature', 'humidity', 'co2', 'airQuality', 'pressure', 'noise'];

let mqttClient = null;
let ioInstance  = null;

function setIO(io) { ioInstance = io; }

// ─── Alerte automatique capteur ───────────────────────────────
async function createAutoAlert(sensor) {
  try {
    const msg = sensor.status === 'critical'
      ? `🚨 CRITIQUE — ${sensor.name} : ${sensor.value}${sensor.unit}`
      : `⚠️ ATTENTION — ${sensor.name} : ${sensor.value}${sensor.unit}`;
    await Alert.create({ message: msg, type: sensor.status === 'critical' ? 'urgence' : 'maintenance', isRead: false });
    if (ioInstance) ioInstance.emit('alert:new', { status: sensor.status, sensor });
  } catch (e) { console.error('Alerte sensor :', e.message); }
}

// ─── Traitement capteurs environnement ───────────────────────
async function handleSensorMessage(topic, payload) {
  try {
    const data = JSON.parse(payload.toString());
    const { deviceId, name, type, value, unit, status } = data;
    if (!deviceId || !name || !VALID_SENSOR_TYPES.includes(type) || value === undefined || !unit) return;

    const sensor = await Sensor.create({
      deviceId, name, type,
      value: parseFloat(value),
      unit,
      status: status || 'normal',
      timestamp: new Date(),
    });

    console.log(`✅ Capteur [${type}] ${name} = ${value}${unit} (${status})`);
    if (ioInstance) ioInstance.emit('sensor:update', sensor);
    if (status === 'warning' || status === 'critical') await createAutoAlert(sensor);
  } catch (e) {
    if (e.name !== 'SyntaxError') console.error('Erreur sensor MQTT :', e.message);
  }
}

// ─── Traitement état parking (ultrason) ──────────────────────
async function handleParkingStatus(payload) {
  try {
    const data = JSON.parse(payload.toString());
    const { spots } = data;
    if (!Array.isArray(spots)) return;

    const updates = [];
    for (const s of spots) {
      // Mettre à jour uniquement le champ ultrason (occupiedByVehicle)
      // Ne pas écraser la réservation application
      const result = await Parking.findOneAndUpdate(
        { spotNumber: s.name },
        {
          occupiedByVehicle: s.occupiedSensor,
          lastSensorUpdate:  new Date(),
          // Si voiture physique détectée, marquer comme indisponible
          ...(s.occupiedSensor ? { available: false } : {}),
        },
        { new: true }
      );
      if (result) updates.push(result);
    }

    console.log(`🅿️  Parking mis à jour : ${updates.length} places`);

    // Diffuser à l'application en temps réel
    if (ioInstance && updates.length > 0) {
      ioInstance.emit('parking:update', { spots: updates });
    }
  } catch (e) {
    if (e.name !== 'SyntaxError') console.error('Erreur parking MQTT :', e.message);
  }
}

// ─── Traitement détection entrée ─────────────────────────────
async function handleParkingEntry(payload) {
  try {
    const data = JSON.parse(payload.toString());
    console.log(`🚗 Entrée voiture détectée — device: ${data.device}`);
    if (ioInstance) ioInstance.emit('parking:entry', data);
  } catch (e) {}
}

// ─── Démarrer MQTT ────────────────────────────────────────────
function startMQTT() {
  const options = {
    clientId: 'smartuni-backend-' + Math.random().toString(16).slice(2, 8),
    clean:    true,
    reconnectPeriod: 5000,
  };

  console.log(`📡 Connexion MQTT → ${BROKER_URL}`);
  mqttClient = mqtt.connect(BROKER_URL, options);

  mqttClient.on('connect', () => {
    console.log('✅ MQTT Backend connecté');
    mqttClient.subscribe('smartuni/sensors/#',       { qos: 1 });
    mqttClient.subscribe('smartuni/parking/status',  { qos: 1 });
    mqttClient.subscribe('smartuni/parking/entry',   { qos: 0 });
    mqttClient.subscribe('smartuni/status',          { qos: 0 });
    console.log('📥 Abonné à sensors/#, parking/status, parking/entry');
  });

  mqttClient.on('message', async (topic, payload) => {
    if (topic.startsWith('smartuni/sensors/'))       await handleSensorMessage(topic, payload);
    else if (topic === 'smartuni/parking/status')    await handleParkingStatus(payload);
    else if (topic === 'smartuni/parking/entry')     await handleParkingEntry(payload);
    else if (topic === 'smartuni/status') {
      try { const hb = JSON.parse(payload.toString()); console.log(`💓 ${hb.device}`); } catch (_) {}
    }
  });

  mqttClient.on('error',     (e) => console.error('❌ MQTT :', e.message));
  mqttClient.on('reconnect', ()  => console.log('🔄 MQTT reconnexion...'));
  return mqttClient;
}

// ─── Publier commande vers ESP32 parking ─────────────────────
function publishParkingCommand(command) {
  if (!mqttClient?.connected) return;
  mqttClient.publish('smartuni/parking/command', JSON.stringify(command), { qos: 1 });
  console.log('📤 Commande parking :', command);
}

// ─── Notifier ESP32 d'une réservation app ────────────────────
function notifyParkingReservation(spotName, userName, reserve) {
  if (!mqttClient?.connected) return;
  const msg = JSON.stringify({ spotName, userName, reserve });
  mqttClient.publish('smartuni/parking/reserve', msg, { qos: 1 });
  console.log(`📤 Réservation parking MQTT : ${spotName} → ${reserve ? userName : 'libéré'}`);
}

// ─── Publier commande alarme ──────────────────────────────────
function triggerAlarm(message) {
  if (!mqttClient?.connected) return;
  mqttClient.publish('smartuni/command/alarm', JSON.stringify({ message, timestamp: new Date().toISOString() }), { qos: 1 });
}

module.exports = { startMQTT, setIO, triggerAlarm, publishParkingCommand, notifyParkingReservation };