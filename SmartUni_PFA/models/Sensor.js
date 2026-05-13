const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: [true, "L'identifiant du capteur est obligatoire"],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Le nom du capteur est obligatoire'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Le type du capteur est obligatoire'],
      enum: ['temperature', 'humidity', 'co2', 'airQuality', 'pressure', 'noise'],
    },
    value: {
      type: Number,
      required: [true, 'La valeur du capteur est obligatoire'],
    },
    unit: {
      type: String,
      required: [true, "L'unité est obligatoire"],
      trim: true,
    },
    status: {
      type: String,
      enum: ['normal', 'warning', 'critical'],
      default: 'normal',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model('Sensor', sensorSchema);