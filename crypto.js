/**
 * Crypto utilities for Crypt Keeper
 * Uses only browser WebCrypto APIs (or Node.js in test environments)
 */

// Detect environment and use appropriate crypto API
const getCrypto = (() => {
  let _crypto = null;
  
  return () => {
    if (_crypto) return _crypto;
    
    // Try globalThis (browser and modern Node.js)
    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
      _crypto = globalThis.crypto;
      return _crypto;
    }
    
    // Try window (browser)
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      _crypto = window.crypto;
      return _crypto;
    }
    
    // Try global (Node.js)
    if (typeof global !== 'undefined' && global.crypto && global.crypto.subtle) {
      _crypto = global.crypto;
      return _crypto;
    }
    
    // Try require for Node.js webcrypto
    try {
      const { webcrypto } = require('crypto');
      if (webcrypto && webcrypto.subtle) {
        _crypto = webcrypto;
        return _crypto;
      }
    } catch {}
    
    throw new Error('WebCrypto not available in this environment');
  };
})();

/**
 * Generates a random salt for PBKDF2 derivation
 * @param {number} [length=32] - Length in bytes (default 32 = 256 bits)
 * @returns {Uint8Array} Random salt bytes
 */
function generateSalt(length = 32) {
  const crypto = getCrypto();
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generates a random IV for AES-GCM encryption
 * @returns {Uint8Array} Random 96-bit (12-byte) IV
 */
function generateIV() {
  const crypto = getCrypto();
  return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Converts Uint8Array to base64 string
 * @param {Uint8Array} arr - Input bytes
 * @returns {string} Base64-encoded string
 */
function uint8ToBase64(arr) {
  if (typeof btoa !== 'undefined') {
    // Browser
    return btoa(String.fromCharCode.apply(null, arr));
  } else {
    // Node.js
    return Buffer.from(arr).toString('base64');
  }
}

/**
 * Converts base64 string to Uint8Array
 * @param {string} str - Base64-encoded string
 * @returns {Uint8Array} Decoded bytes
 */
function base64ToUint8(str) {
  if (typeof atob !== 'undefined') {
    // Browser
    const binaryString = atob(str);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } else {
    // Node.js
    return new Uint8Array(Buffer.from(str, 'base64'));
  }
}

/**
 * Derives a cryptographic key from a passphrase using PBKDF2-SHA-256
 * @param {string} passphrase - The user's master passphrase (not stored)
 * @param {Uint8Array|null} [salt=null] - Random salt (32 bytes); if null, generates new
 * @param {number} [iterations=250000] - Number of PBKDF2 iterations (NIST recommendation)
 * @returns {Promise<{key: CryptoKey, salt: Uint8Array}>} Derived key and salt
 * @throws {Error} If passphrase is empty or derivation fails
 */
async function deriveKey(passphrase, salt = null, iterations = 250000) {
  if (typeof passphrase !== 'string') {
    throw new Error('Passphrase must be a string');
  }

  const crypto = getCrypto();
  
  // Generate salt if not provided
  if (!salt) {
    salt = generateSalt(32);
  }

  // Encode passphrase as UTF-8
  const encoder = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive key using PBKDF2
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: salt,
      iterations: iterations
    },
    passphraseKey,
    { name: 'AES-GCM', length: 256 },
    false, // key is not extractable
    ['encrypt', 'decrypt']
  );

  return { key: derivedKey, salt };
}

/**
 * Encrypts plaintext using AES-GCM
 * @param {string} plaintext - The data to encrypt
 * @param {CryptoKey} key - The AES-GCM key (derived from passphrase)
 * @returns {Promise<{ciphertext: string, iv: string}>} Base64-encoded ciphertext and IV
 * @throws {Error} If encryption fails
 */
async function encryptEntry(plaintext, key) {
  if (typeof plaintext !== 'string') {
    throw new Error('Plaintext must be a string');
  }

  const crypto = getCrypto();
  const iv = generateIV();

  // Encode plaintext as UTF-8
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  // Encrypt using AES-GCM
  const ciphertextArrayBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    plaintextBytes
  );

  // Convert to base64 for storage
  const ciphertext = uint8ToBase64(new Uint8Array(ciphertextArrayBuffer));
  const ivBase64 = uint8ToBase64(iv);

  return { ciphertext, iv: ivBase64 };
}

/**
 * Decrypts AES-GCM ciphertext
 * @param {string} ciphertext - Base64-encoded ciphertext
 * @param {string} ivBase64 - Base64-encoded IV
 * @param {CryptoKey} key - The AES-GCM key (derived from passphrase)
 * @returns {Promise<string>} Decrypted plaintext
 * @throws {Error} If decryption fails (wrong key, tampering detected, wrong IV)
 */
async function decryptEntry(ciphertext, ivBase64, key) {
  if (!ciphertext || !ivBase64) {
    throw new Error('Ciphertext and IV are required');
  }

  const crypto = getCrypto();

  // Decode from base64
  const ciphertextBytes = base64ToUint8(ciphertext);
  const iv = base64ToUint8(ivBase64);

  // Decrypt using AES-GCM (will fail if key is wrong or ciphertext is tampered)
  const plaintextArrayBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    ciphertextBytes
  );

  // Decode UTF-8
  const decoder = new TextDecoder();
  return decoder.decode(plaintextArrayBuffer);
}

/**
 * Encrypts a canary plaintext for vault verification
 * Used to verify passphrase without storing a separate test entry
 * @param {CryptoKey} key - The derived key
 * @returns {Promise<{ciphertext: string, iv: string}>} Encrypted canary
 */
async function encryptCanary(key) {
  const CANARY = 'crypt-keeper-canary';
  return encryptEntry(CANARY, key);
}

/**
 * Verifies a canary (attempts to decrypt it)
 * @param {string} ciphertext - Base64-encoded canary ciphertext
 * @param {string} iv - Base64-encoded IV
 * @param {CryptoKey} key - The derived key
 * @returns {Promise<boolean>} True if decryption succeeds, false otherwise
 */
async function verifyCanary(ciphertext, iv, key) {
  try {
    const plaintext = await decryptEntry(ciphertext, iv, key);
    return plaintext === 'crypt-keeper-canary';
  } catch {
    return false;
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.CryptoUtil = {
    generateSalt,
    generateIV,
    uint8ToBase64,
    base64ToUint8,
    deriveKey,
    encryptEntry,
    decryptEntry,
    encryptCanary,
    verifyCanary
  };
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateSalt,
    generateIV,
    uint8ToBase64,
    base64ToUint8,
    deriveKey,
    encryptEntry,
    decryptEntry,
    encryptCanary,
    verifyCanary
  };
}
