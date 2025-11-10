const User = require('../models/User');
const Notification = require('../models/Notification');
const { generateStreamToken, upsertStreamUser, createCall, apiKey } = require('../utils/getstream');

/**
 * Get GetStream token for the authenticated user
 */
exports.getStreamToken = async (req, res) => {
  try {
    if (!apiKey) {
      return res.status(503).json({ message: 'GetStream service not configured' });
    }

    const userId = req.user._id.toString();
    
    // Upsert user in GetStream
    await upsertStreamUser(userId, {
      fullname: req.user.fullname,
      profileImage: req.user.profileImage,
    });

    // Generate token
    const token = generateStreamToken(userId);

    res.json({
      token,
      apiKey,
      userId,
    });
  } catch (err) {
    console.error('GetStream token error:', err);
    res.status(500).json({ message: 'Failed to generate stream token' });
  }
};

/**
 * Initiate emergency call with all emergency contacts
 */
exports.initiateEmergencyCall = async (req, res) => {
  try {
    if (!apiKey) {
      return res.status(503).json({ message: 'GetStream service not configured' });
    }

    const userId = req.user._id.toString();
    
    // Get emergency contacts
    const emergencyContacts = await User.find(
      { _id: { $in: req.user.emergencyContacts } },
      '_id fullname profileImage'
    );

    if (emergencyContacts.length === 0) {
      return res.status(400).json({ message: 'No emergency contacts found' });
    }

    // Prepare members for the call (creator + emergency contacts)
    const memberIds = [userId, ...emergencyContacts.map(c => c._id.toString())];

    // Upsert all users in GetStream
    await upsertStreamUser(userId, {
      fullname: req.user.fullname,
      profileImage: req.user.profileImage,
    });

    for (const contact of emergencyContacts) {
      await upsertStreamUser(contact._id.toString(), {
        fullname: contact.fullname,
        profileImage: contact.profileImage,
      });
    }

    // Create unique call ID
    const callId = `emergency_${userId}_${Date.now()}`;

    // Create the call
    await createCall(callId, userId, memberIds);

    // Send notifications to emergency contacts
    const notificationPromises = emergencyContacts.map(contact => 
      Notification.create({
        user: contact._id,
        message: `${req.user.fullname} is making an emergency call!`,
        type: 'emergency_call',
        data: { 
          callId, 
          callType: 'audio_room',
          caller: userId,
          callerName: req.user.fullname 
        }
      })
    );
    await Promise.all(notificationPromises);

    res.json({
      callId,
      callType: 'audio_room',
      members: memberIds,
      emergencyContacts: emergencyContacts.map(c => ({
        id: c._id,
        fullname: c.fullname,
        profileImage: c.profileImage,
      })),
    });
  } catch (err) {
    console.error('Emergency call error:', err);
    res.status(500).json({ message: 'Failed to initiate emergency call' });
  }
};
