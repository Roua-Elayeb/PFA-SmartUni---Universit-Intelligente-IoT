const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getRooms,
  reserveRoom,
  cancelRoomReservation,
  getRoomReservations,
} = require('../controllers/roomController');

// GET /api/rooms — Liste des salles
router.get('/', protect, getRooms);

// POST /api/rooms/:id/reserve — Réserver une salle
router.post('/:id/reserve', protect, reserveRoom);

// PUT /api/rooms/:id/cancel — Annuler une réservation
router.put('/:id/cancel', protect, cancelRoomReservation);

// GET /api/rooms/:id/reservations — Voir les réservations d'une salle
router.get('/:id/reservations', protect, getRoomReservations);

module.exports = router;