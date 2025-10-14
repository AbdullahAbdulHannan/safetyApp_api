const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  agreeTerms: { type: Boolean, required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  username: { type: String, required: true, unique: true },
  bio: { type: String },
  // New fields for emergency and contacts features
  emergency: { type: Boolean, default: false },
  emergencyContacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  syncedContacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 