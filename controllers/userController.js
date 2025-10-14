const User = require('../models/User');
const Notification = require('../models/Notification');

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password -resetPasswordToken -resetPasswordExpires')
      .populate('emergencyContacts', 'fullname phone email')
      .populate('syncedContacts', 'fullname phone email');
    
    res.json({ users });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Get single user details
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password -resetPasswordToken -resetPasswordExpires')
      .populate('emergencyContacts', 'fullname phone email username bio gender')
      .populate('syncedContacts', 'fullname phone email username bio gender');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (err) {
    console.error('Get user by ID error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id, '-password -resetPasswordToken -resetPasswordExpires')
      .populate('emergencyContacts', 'fullname phone email')
      .populate('syncedContacts', 'fullname phone email');
    
    res.json({ user });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Set SOS (emergency true/false)
exports.setSOS = async (req, res) => {
  const { emergency } = req.body;
  try {
    console.log('SOS request body:', req.body);
    console.log('User before:', req.user._id.toString(), 'emergency:', req.user.emergency);
    req.user.emergency = !!emergency;
    await req.user.save();
    console.log('User after:', req.user._id.toString(), 'emergency:', req.user.emergency);
    // Notify all users whom I have added in my emergencyContacts if emergency is true
    if (req.user.emergency) {
      const User = require('../models/User');
      const users = await User.find({ _id: { $in: req.user.emergencyContacts } });
      for (const u of users) {
        await Notification.create({
          user: u._id,
          message: `${req.user.fullname} is in emergency!`,
          type: 'emergency',
          data: { user: req.user._id }
        });
        console.log('Notification created for:', u._id.toString(), 'by', req.user._id.toString());
      }
    }
    res.json({ message: `Emergency set to ${req.user.emergency}`, user: req.user });
  } catch (err) {
    console.error('SOS error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Delete user and remove from all contacts
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find the user to be deleted
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove this user from all other users' emergency contacts
    await User.updateMany(
      { emergencyContacts: userId },
      { $pull: { emergencyContacts: userId } }
    );

    // Remove this user from all other users' synced contacts
    await User.updateMany(
      { syncedContacts: userId },
      { $pull: { syncedContacts: userId } }
    );

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};