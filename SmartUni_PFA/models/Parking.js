// ============================================================
//  SmartUni — Parking.js (modèle mis à jour)
//  Remplace models/Parking.js
//  Ajout : occupiedByVehicle (détecté par ultrason ESP32)
// ============================================================

const mongoose = require('mongoose');

const parkingSchema = new mongoose.Schema(
  {
    spotNumber: {
      type: String,
      required: [true, 'Le numéro de place est obligatoire'],
      unique: true,
      trim: true,
    },
    floor: {
      type: Number,
      required: [true, "L'étage est obligatoire"],
    },
    // Réservation manuelle via l'application
    available: {
      type: Boolean,
      default: true,
    },
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reservedByName: {
      type: String,
      default: null,
    },
    reservedUntil: {
      type: Date,
      default: null,
    },
    // ── NOUVEAU : détection physique par ultrason ──────────
    occupiedByVehicle: {
      type: Boolean,
      default: false,  // true = voiture physiquement présente (ultrason)
    },
    lastSensorUpdate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Méthode utilitaire : vraiment disponible ?
// Libre = pas de réservation ET pas de voiture physique
parkingSchema.virtual('trulyAvailable').get(function () {
  return this.available && !this.occupiedByVehicle;
});

module.exports = mongoose.model('Parking', parkingSchema);