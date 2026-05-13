const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getParkingSpots,
  reserveSpot,
  cancelSpotReservation,
  getSpotsByFloor,
} = require('../controllers/parkingController');

// GET /api/parking — Liste des places
router.get('/', protect, getParkingSpots);

// GET /api/parking/floor/:floor — Places par étage
router.get('/floor/:floor', protect, getSpotsByFloor);

// POST /api/parking/:id/reserve — Réserver une place
router.post('/:id/reserve', protect, reserveSpot);

// PUT /api/parking/:id/cancel — Annuler une réservation
router.put('/:id/cancel', protect, cancelSpotReservation);

module.exports = router;