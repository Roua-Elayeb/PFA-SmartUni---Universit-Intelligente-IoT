const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getAlerts,
  createAlert,
  markAsRead,
  triggerAlarm,
} = require('../controllers/alertController');

// GET /api/alerts — Liste des alertes
router.get('/', protect, getAlerts);

// POST /api/alerts — Créer une alerte
router.post('/', protect, createAlert);

// PUT /api/alerts/:id/read — Marquer comme lue
router.put('/:id/read', protect, markAsRead);

// POST /api/alerts/alarm — Déclencher alarme générale
router.post('/alarm', protect, triggerAlarm);

module.exports = router;