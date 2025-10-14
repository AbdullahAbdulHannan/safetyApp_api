/**
 * Phone number normalization utility
 * Handles different phone number formats and normalizes them for consistent matching
 */

/**
 * Normalizes a phone number by removing all non-digit characters and handling country codes
 * @param {string} phoneNumber - The phone number to normalize
 * @returns {string} - The normalized phone number
 */
function normalizePhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Handle international numbers with country codes
  // Common country codes: +1 (US/Canada), +44 (UK), +91 (India), +86 (China), +81 (Japan), etc.
  const countryCodes = {
    '1': 10,    // US/Canada: 10 digits after country code
    '44': 10,   // UK: 10-11 digits after country code
    '91': 10,   // India: 10 digits after country code
    '86': 11,   // China: 11 digits after country code
    '81': 10,   // Japan: 10 digits after country code
    '49': 10,   // Germany: 10-12 digits after country code
    '33': 9,    // France: 9 digits after country code
    '39': 10,   // Italy: 10 digits after country code
    '34': 9,    // Spain: 9 digits after country code
    '31': 9,    // Netherlands: 9 digits after country code
    '46': 9,    // Sweden: 9 digits after country code
    '47': 8,    // Norway: 8 digits after country code
    '45': 8,    // Denmark: 8 digits after country code
    '358': 9,   // Finland: 9 digits after country code
    '48': 9,    // Poland: 9 digits after country code
    '420': 9,   // Czech Republic: 9 digits after country code
    '36': 9,    // Hungary: 9 digits after country code
    '380': 9,   // Ukraine: 9 digits after country code
    '7': 10,    // Russia: 10 digits after country code
    '90': 10,   // Turkey: 10 digits after country code
    '971': 9,   // UAE: 9 digits after country code
    '966': 9,   // Saudi Arabia: 9 digits after country code
    '20': 10,   // Egypt: 10 digits after country code
    '27': 9,    // South Africa: 9 digits after country code
    '234': 10,  // Nigeria: 10 digits after country code
    '254': 9,   // Kenya: 9 digits after country code
    '92': 10,   // Pakistan: 10 digits after country code
    '880': 10,  // Bangladesh: 10 digits after country code
    '977': 10,  // Nepal: 10 digits after country code
    '94': 9,    // Sri Lanka: 9 digits after country code
    '95': 10,   // Myanmar: 10 digits after country code
    '66': 9,    // Thailand: 9 digits after country code
    '84': 9,    // Vietnam: 9 digits after country code
    '65': 8,    // Singapore: 8 digits after country code
    '60': 9,    // Malaysia: 9 digits after country code
    '62': 9,    // Indonesia: 9 digits after country code
    '63': 10,   // Philippines: 10 digits after country code
    '852': 8,   // Hong Kong: 8 digits after country code
    '853': 8,   // Macau: 8 digits after country code
    '886': 9,   // Taiwan: 9 digits after country code
    '82': 10,   // South Korea: 10 digits after country code
    '61': 9,    // Australia: 9 digits after country code
    '64': 9,    // New Zealand: 9 digits after country code
    '55': 10,   // Brazil: 10-11 digits after country code
    '54': 10,   // Argentina: 10 digits after country code
    '56': 9,    // Chile: 9 digits after country code
    '57': 10,   // Colombia: 10 digits after country code
    '58': 10,   // Venezuela: 10 digits after country code
    '51': 9,    // Peru: 9 digits after country code
    '593': 9,   // Ecuador: 9 digits after country code
    '595': 9,   // Paraguay: 9 digits after country code
    '598': 8,   // Uruguay: 8 digits after country code
    '591': 8,   // Bolivia: 8 digits after country code
    '507': 8,   // Panama: 8 digits after country code
    '506': 8,   // Costa Rica: 8 digits after country code
    '503': 8,   // El Salvador: 8 digits after country code
    '502': 8,   // Guatemala: 8 digits after country code
    '504': 8,   // Honduras: 8 digits after country code
    '505': 8,   // Nicaragua: 8 digits after country code
    '52': 10,   // Mexico: 10 digits after country code
  };
  
  // Check for country codes and normalize accordingly
  for (const [code, expectedLength] of Object.entries(countryCodes)) {
    if (cleaned.startsWith(code)) {
      const numberAfterCode = cleaned.substring(code.length);
      
      // If the number after country code matches expected length, return it
      if (numberAfterCode.length === expectedLength) {
        return numberAfterCode;
      }
      
      // Handle cases where there might be a leading zero after country code
      if (numberAfterCode.startsWith('0') && numberAfterCode.length === expectedLength + 1) {
        return numberAfterCode.substring(1);
      }
    }
  }
  
  // Handle local numbers (numbers starting with 0)
  if (cleaned.startsWith('0') && cleaned.length > 1) {
    return cleaned.substring(1);
  }
  
  // If no country code pattern matches, return the cleaned number as is
  return cleaned;
}

/**
 * Formats a phone number for display
 * @param {string} phoneNumber - The normalized phone number
 * @returns {string} - The formatted phone number
 */
function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  
  const normalized = normalizePhoneNumber(phoneNumber);
  
  // Format based on length
  if (normalized.length === 10) {
    // Format as XXX-XXX-XXXX for 10-digit numbers
    return `${normalized.substring(0, 3)}-${normalized.substring(3, 6)}-${normalized.substring(6)}`;
  } else if (normalized.length === 9) {
    // Format as XXX-XXX-XXX for 9-digit numbers
    return `${normalized.substring(0, 3)}-${normalized.substring(3, 6)}-${normalized.substring(6)}`;
  } else if (normalized.length === 8) {
    // Format as XXX-XXX-XX for 8-digit numbers
    return `${normalized.substring(0, 3)}-${normalized.substring(3, 6)}-${normalized.substring(6)}`;
  }
  
  return normalized;
}

/**
 * Checks if two phone numbers are equivalent after normalization
 * @param {string} phone1 - First phone number
 * @param {string} phone2 - Second phone number
 * @returns {boolean} - True if numbers are equivalent
 */
function arePhoneNumbersEqual(phone1, phone2) {
  const normalized1 = normalizePhoneNumber(phone1);
  const normalized2 = normalizePhoneNumber(phone2);
  return normalized1 === normalized2;
}

/**
 * Validates if a phone number is in a valid format
 * @param {string} phoneNumber - The phone number to validate
 * @returns {boolean} - True if the phone number is valid
 */
function isValidPhoneNumber(phoneNumber) {
  if (!phoneNumber) return false;
  
  const normalized = normalizePhoneNumber(phoneNumber);
  
  // Check if it's a reasonable length (7-15 digits)
  if (normalized.length < 7 || normalized.length > 15) {
    return false;
  }
  
  // Check if it contains only digits
  if (!/^\d+$/.test(normalized)) {
    return false;
  }
  
  return true;
}

module.exports = {
  normalizePhoneNumber,
  formatPhoneNumber,
  arePhoneNumbersEqual,
  isValidPhoneNumber
};