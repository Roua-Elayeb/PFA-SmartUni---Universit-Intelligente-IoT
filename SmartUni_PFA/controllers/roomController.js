const Room = require('../models/Room');

// GET /api/rooms
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json({ count: rooms.length, rooms });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/rooms/:id/reserve
const reserveRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Salle introuvable.' });
    if (!room.available) return res.status(409).json({ message: 'Cette salle est déjà réservée.' });

    const { date, startTime, duration } = req.body;
    if (!date || !startTime || !duration) {
      return res.status(400).json({ message: 'Date, heure de début et durée sont obligatoires.' });
    }

    room.reservations.push({
      userId: req.user._id,
      userName: req.user.name,
      date,
      startTime,
      duration,
    });
    room.available = false;
    await room.save();

    res.json({ message: 'Salle réservée avec succès.', room });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// PUT /api/rooms/:id/cancel
const cancelRoomReservation = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Salle introuvable.' });

    room.reservations = room.reservations.filter(
      (r) => r.userId.toString() !== req.user._id.toString()
    );
    room.available = room.reservations.length === 0;
    await room.save();

    res.json({ message: 'Réservation annulée.', room });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// GET /api/rooms/:id/reservations
const getRoomReservations = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Salle introuvable.' });

    res.json({ room: room.name, reservations: room.reservations });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { getRooms, reserveRoom, cancelRoomReservation, getRoomReservations };