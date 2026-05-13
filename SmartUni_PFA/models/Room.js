const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:  { type: String, required: true },
  date:      { type: String, required: true },
  startTime: { type: String, required: true },
  duration:  { type: Number, required: true },
});

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom de la salle est obligatoire'],
      unique: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'La capacité est obligatoire'],
      min: [1, 'La capacité doit être >= 1'],
    },
    equipment: {
      type: [String],
      default: [],
    },
    available: {
      type: Boolean,
      default: true,
    },
    reservations: {
      type: [reservationSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);