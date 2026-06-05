// ============================================================
//  SmartUni — parkingController.js (version MQTT + ultrason)
//  Remplace controllers/parkingController.js
//  Ajout :
//   - notifyParkingReservation() → envoie MQTT vers ESP32
//   - occupiedByVehicle dans les réponses
//   - POST /api/parking/barrier/open → commande barrière admin
// ============================================================

const Parking = require('../models/Parking');
const { notifyParkingReservation, publishParkingCommand } = require('../services/mqttService');

// GET /api/parking
const getParkingSpots = async (req, res) => {
  try {
    const spots = await Parking.find().sort({ floor: 1, spotNumber: 1 });
    res.json({ count: spots.length, spots });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// GET /api/parking/floor/:floor
const getSpotsByFloor = async (req, res) => {
  try {
    const floor = parseInt(req.params.floor);
    if (isNaN(floor)) return res.status(400).json({ message: "Numéro d'étage invalide." });
    const spots = await Parking.find({ floor }).sort({ spotNumber: 1 });
    res.json({ floor, count: spots.length, spots });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/parking/:id/reserve
const reserveSpot = async (req, res) => {
  try {
    const spot = await Parking.findById(req.params.id);
    if (!spot) return res.status(404).json({ message: 'Place introuvable.' });

    // Vérifier disponibilité (réservation app ET voiture physique)
    if (!spot.available) return res.status(409).json({ message: 'Cette place est déjà réservée.' });
    if (spot.occupiedByVehicle) return res.status(409).json({ message: 'Une voiture est déjà garée sur cette place.' });

    const { reservedUntil } = req.body;
    if (!reservedUntil) return res.status(400).json({ message: "La date de fin est obligatoire." });

    spot.available       = false;
    spot.reservedBy      = req.user._id;
    spot.reservedByName  = req.user.name;
    spot.reservedUntil   = new Date(reservedUntil);
    await spot.save();

    // Notifier ESP32 via MQTT → LED rouge + LCD mis à jour
    notifyParkingReservation(spot.spotNumber, req.user.name, true);

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

    if (spot.reservedBy?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Vous ne pouvez pas annuler cette réservation." });
    }

    const spotNumber = spot.spotNumber;
    spot.available      = true;
    spot.reservedBy     = null;
    spot.reservedByName = null;
    spot.reservedUntil  = null;
    await spot.save();

    // Notifier ESP32 → LED verte + LCD mis à jour
    notifyParkingReservation(spotNumber, null, false);

    res.json({ message: 'Réservation annulée.', spot });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/parking/barrier/open  ← admin uniquement
const openBarrier = async (req, res) => {
  try {
    publishParkingCommand({ command: 'open_barrier', by: req.user.name });
    res.json({ message: 'Commande ouverture barrière envoyée via MQTT.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { getParkingSpots, reserveSpot, cancelSpotReservation, getSpotsByFloor, openBarrier };