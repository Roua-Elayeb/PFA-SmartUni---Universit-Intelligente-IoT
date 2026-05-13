const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, "Le type d'alerte est obligatoire"],
      enum: ['urgence', 'sécurité', 'technique'],
    },
    message: {
      type: String,
      required: [true, "Le message de l'alerte est obligatoire"],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: 'Non spécifié',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isAlarm: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);