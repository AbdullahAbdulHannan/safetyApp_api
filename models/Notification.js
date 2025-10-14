const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String }, // e.g., 'emergency', 'added_to_emergency', etc.
  data: { type: Object }, // Additional data if needed
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema); 