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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Parking', parkingSchema);