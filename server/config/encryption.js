const CryptoJS = require('crypto-js');

const SECRET = process.env.AES_SECRET || 'default_aes_secret_key_32_chars!!';

/**
 * Encrypt data using AES-256
 * @param {any} data - Data to encrypt (will be JSON.stringified)
 * @returns {string} - Encrypted ciphertext string
 */
const encrypt = (data) => {
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(dataStr, SECRET).toString();
};

/**
 * Decrypt AES-256 encrypted data
 * @param {string} ciphertext - Encrypted string
 * @returns {any} - Decrypted data (JSON.parsed if possible)
 */
const decrypt = (ciphertext) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return null;
  }
};

/**
 * Generate SHA-256 hash for vote integrity
 * @param {string} data - Data to hash
 * @returns {string} - SHA-256 hash hex string
 */
const sha256Hash = (data) => {
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
};

module.exports = { encrypt, decrypt, sha256Hash };
