const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { sendEmail } = require('../utils/sendEmail');
const { normalizePhoneNumber } = require('../utils/phoneNumberUtils');
const crypto = require('crypto');

exports.signup = async (req, res) => {
  const { fullname, username, email, phone, password, gender, agreeTerms, bio } = req.body;
  console.log("Incoming request body:", req.body);
  try {
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
    if (await User.findOne({ username })) return res.status(400).json({ message: 'Username already exists' });
    
    // Normalize phone number before saving
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // Check if normalized phone number already exists
    const existingUserWithPhone = await User.findOne({ phone: normalizedPhone });
    if (existingUserWithPhone) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }
    
    const user = await User.create({ 
      fullname, 
      username, 
      email, 
      phone: normalizedPhone, 
      password, 
      gender, 
      agreeTerms, 
      bio 
    });
    const token = generateToken(user._id);
    res.status(201).json({ user: { id: user._id, fullname: user.fullname, username: user.username, email: user.email, phone: user.phone, gender: user.gender, bio: user.bio }, token });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: err });
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
    res.json({ user: { id: user._id, fullname: user.fullname, username: user.username, email: user.email, phone: user.phone, gender: user.gender, bio: user.bio }, token });
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

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return res.status(400).json({ message: 'Old password is incorrect' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  const { fullname, username, bio } = req.body;
  try {
    // Check for unique username (exclude self)
    const existing = await User.findOne({ username, _id: { $ne: req.user._id } });
    if (existing) return res.status(400).json({ message: 'Username already exists' });
    req.user.fullname = fullname;
    req.user.username = username;
    req.user.bio = bio;
    await req.user.save();
    res.json({ message: 'Profile updated', user: { fullname, username, bio } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.checkUsername = async (req, res) => {
  const { username } = req.query;
  try {
    const user = await User.findOne({ username });
    res.json({ available: !user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.checkPhone = async (req, res) => {
  const { phone } = req.query;
  try {
    const normalizedPhone = normalizePhoneNumber(phone);
    const user = await User.findOne({ phone: normalizedPhone });
    res.json({ available: !user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 