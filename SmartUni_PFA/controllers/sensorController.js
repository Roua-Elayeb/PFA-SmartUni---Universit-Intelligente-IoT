const Sensor = require('../models/Sensor');

const VALID_TYPES = ['temperature', 'humidity', 'co2', 'airQuality', 'pressure', 'noise'];

// GET /api/sensors
const getAllSensors = async (req, res) => {
  try {
    const sensors = await Sensor.find().sort({ timestamp: -1 });
    res.json({ count: sensors.length, sensors });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// GET /api/sensors/latest
const getLatestSensors = async (req, res) => {
  try {
    const latest = await Sensor.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$deviceId',
          doc: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$doc' } },
    ]);
    res.json({ count: latest.length, sensors: latest });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/sensors
const addSensorReading = async (req, res) => {
  try {
    const { deviceId, name, type, value, unit, status } = req.body;

    if (!deviceId || !name || !type || value === undefined || !unit) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
    }

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        message: `Type invalide. Types acceptés : ${VALID_TYPES.join(', ')}`,
      });
    }

    const sensor = await Sensor.create({ deviceId, name, type, value, unit, status });
    res.status(201).json({ message: 'Lecture enregistrée.', sensor });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// GET /api/sensors/:type
const getSensorsByType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        message: `Type invalide. Types acceptés : ${VALID_TYPES.join(', ')}`,
      });
    }

    const sensors = await Sensor.find({ type }).sort({ timestamp: -1 });
    res.json({ count: sensors.length, type, sensors });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { getAllSensors, getLatestSensors, addSensorReading, getSensorsByType };