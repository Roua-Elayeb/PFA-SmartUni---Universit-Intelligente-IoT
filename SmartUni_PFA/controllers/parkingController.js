const Parking = require('../models/Parking');

// GET /api/parking
const getParkingSpots = async (req, res) => {
  try {
    const spots = await Parking.find().sort({ floor: 1, spotNumber: 1 });
    res.json({ count: spots.length, spots });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/parking/:id/reserve
const reserveSpot = async (req, res) => {
  try {
    const spot = await Parking.findById(req.params.id);
    if (!spot) return res.status(404).json({ message: 'Place introuvable.' });
    if (!spot.available) return res.status(409).json({ message: 'Cette place est déjà occupée.' });

    const { reservedUntil } = req.body;
    if (!reservedUntil) {
      return res.status(400).json({ message: "La date de fin de réservation est obligatoire." });
    }

    spot.available = false;
    spot.reservedBy = req.user._id;
    spot.reservedByName = req.user.name;
    spot.reservedUntil = new Date(reservedUntil);
    await spot.save();

    res.json({ message: 'Place réservée avec succès.', spot });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// PUT /api/parking/:id/cancel
const cancelSpotReservation = async (req, res) => {
  try {
    const spot = await Parking.findById(req.params.id);
    if (!spot) return res.status(404).json({ message: 'Place introuvable.' });

    if (
      spot.reservedBy?.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: "Vous ne pouvez pas annuler cette réservation." });
    }

    spot.available = true;
    spot.reservedBy = null;
    spot.reservedByName = null;
    spot.reservedUntil = null;
    await spot.save();

    res.json({ message: 'Réservation annulée.', spot });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// GET /api/parking/floor/:floor
const getSpotsByFloor = async (req, res) => {
  try {
    const floor = parseInt(req.params.floor);
    if (isNaN(floor)) {
      return res.status(400).json({ message: "Numéro d'étage invalide." });
    }

    const spots = await Parking.find({ floor }).sort({ spotNumber: 1 });
    res.json({ floor, count: spots.length, spots });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { getParkingSpots, reserveSpot, cancelSpotReservation, getSpotsByFloor };