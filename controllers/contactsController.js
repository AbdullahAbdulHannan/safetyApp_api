const User = require('../models/User');
const Notification = require('../models/Notification');
const { normalizePhoneNumber } = require('../utils/phoneNumberUtils');

// Sync contacts: Accepts a list of phone numbers, returns registered users, saves to syncedContacts
exports.syncContacts = async (req, res) => {
  const { contacts } = req.body; // contacts: array of phone numbers
  try {
    if (!contacts || contacts.length === 0) {
      return res.json({ registeredContacts: [] });
    }
    
    // Normalize all contact phone numbers
    const normalizedContacts = contacts.map(phone => normalizePhoneNumber(phone));
    
    // Get all users and filter by normalized phone numbers
    const allUsers = await User.find({}, '_id fullname phone');
    const registeredUsers = allUsers.filter(user => {
      const normalizedUserPhone = normalizePhoneNumber(user.phone);
      return normalizedContacts.includes(normalizedUserPhone);
    });
    
    req.user.syncedContacts = registeredUsers.map(u => u._id);
    await req.user.save();
    res.json({ registeredContacts: registeredUsers });
  } catch (err) {
    console.error('Sync contacts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add or remove emergency contact
exports.addOrRemoveEmergencyContact = async (req, res) => {
  const { contactId, action } = req.body; // action: 'add' or 'remove'
  try {
    if (action === 'add') {
      if (!req.user.emergencyContacts.includes(contactId)) {
        req.user.emergencyContacts.push(contactId);
        await req.user.save();
        // Create notification for the added user
        await Notification.create({
          user: contactId,
          message: `${req.user.fullname} added you to their emergency contacts.`,
          type: 'added_to_emergency',
          data: { by: req.user._id }
        });
      }
      res.json({ message: 'Contact added to emergency' });
    } else if (action === 'remove') {
      req.user.emergencyContacts = req.user.emergencyContacts.filter(id => id.toString() !== contactId);
      await req.user.save();
      res.json({ message: 'Contact removed from emergency' });
    } else {
      res.status(400).json({ message: 'Invalid action' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get emergency contacts
exports.getEmergencyContacts = async (req, res) => {
  try {
    const contacts = await User.find({ _id: { $in: req.user.emergencyContacts } }, 'fullname phone');
    res.json({ emergencyContacts: contacts });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get 'My People' (users who have added me to their emergency list)
exports.getMyPeople = async (req, res) => {
  try {
    const people = await User.find({ emergencyContacts: req.user._id }, 'fullname phone emergency');
    res.json({ myPeople: people });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRegisteredContacts = async (req, res) => {
  try {
    const contacts = await User.find({ _id: { $in: req.user.syncedContacts } }, 'fullname phone');
    res.json({ registeredContacts: contacts });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 