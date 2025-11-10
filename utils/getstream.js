const { StreamClient } = require('@stream-io/node-sdk');

// Initialize Stream client with API credentials from environment variables
const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.warn('GetStream API credentials not configured. Audio calling features will be disabled.');
}

const streamClient = apiKey && apiSecret ? new StreamClient(apiKey, apiSecret) : null;

/**
 * Generate a GetStream token for a user
 * @param {string} userId - The user ID
 * @returns {string} - Generated token
 */
const generateStreamToken = (userId) => {
  if (!streamClient) {
    throw new Error('GetStream client not initialized');
  }
  
  // Create token for the user
  const token = streamClient.createToken(userId);
  return token;
};

/**
 * Create or update a user in GetStream
 * @param {string} userId - The user ID
 * @param {Object} userData - User data (name, image, etc.)
 */
const upsertStreamUser = async (userId, userData) => {
  if (!streamClient) {
    throw new Error('GetStream client not initialized');
  }

  await streamClient.upsertUsers({
    users: {
      [userId]: {
        id: userId,
        name: userData.name || userData.fullname,
        image: userData.profileImage || userData.image,
      }
    }
  });
};

/**
 * Create a call
 * @param {string} callId - Unique call ID
 * @param {string} createdBy - User ID who creates the call
 * @param {Array} members - Array of user IDs to add to the call
 * @returns {Object} - Call details
 */
const createCall = async (callId, createdBy, members) => {
  if (!streamClient) {
    throw new Error('GetStream client not initialized');
  }

  const call = streamClient.video.call('audio_room', callId);
  
  await call.getOrCreate({
    data: {
      created_by_id: createdBy,
      members: members.map(userId => ({ user_id: userId })),
      settings_override: {
        audio: {
          mic_default_on: true,
          speaker_default_on: true,
        },
      },
    },
  });

  return call;
};

module.exports = {
  streamClient,
  generateStreamToken,
  upsertStreamUser,
  createCall,
  apiKey,
};
