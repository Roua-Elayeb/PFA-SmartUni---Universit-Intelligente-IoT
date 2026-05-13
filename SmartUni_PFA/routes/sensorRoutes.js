const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getAllSensors,
  getLatestSensors,
  addSensorReading,
  getSensorsByType,
} = require('../controllers/sensorController');

// GET /api/sensors — Tous les capteurs
router.get('/', protect, getAllSensors);

// GET /api/sensors/latest — Dernières valeurs de chaque capteur
router.get('/latest', protect, getLatestSensors);

// POST /api/sensors — Ajouter une lecture
router.post('/', protect, addSensorReading);

// GET /api/sensors/:type — Filtrer par type
router.get('/:type', protect, getSensorsByType);

module.exports = router;