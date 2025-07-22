const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { sendEmail } = require('../utils/sendEmail');
const crypto = require('crypto');

exports.signup = async (req, res) => {
  const { fullname, email, phone, password, gender, agreeTerms } = req.body;
  try {
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
    const user = await User.create({ fullname, email, phone, password, gender, agreeTerms });
    const token = generateToken(user._id);
    res.status(201).json({ user: { id: user._id, fullname: user.fullname, email: user.email, phone: user.phone, gender: user.gender }, token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password, rememberMe } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(400).json({ message: 'Invalid credentials' });
    // Optionally, set longer expiry if rememberMe is true
    const token = rememberMe ? generateToken(user._id) : generateToken(user._id); // Adjust expiry logic if needed
    res.json({ user: { id: user._id, fullname: user.fullname, email: user.email, phone: user.phone, gender: user.gender }, token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = (req, res) => {
  // For JWT, logout is handled on client by deleting token.
  res.json({ message: 'Logged out successfully' });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    await sendEmail(
      user.email,
      'Password Reset',
      `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`
    );
    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 