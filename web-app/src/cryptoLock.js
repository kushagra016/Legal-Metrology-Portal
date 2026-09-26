// src/cryptoLock.js

const DEFAULT_SECRET = 'SIH-26036-METROLOGY-HMAC-KEY';

/**
 * Normalizes and hashes calibration parameters using HMAC-SHA-256
 * @param {Object} params - Calibration parameters (e.g., zero_offset, cal_weight, divisions)
 * @param {string} secretKey - Cloud secret key for signing
 * @returns {Promise<string>} Hex-encoded SHA-256 hash
 */
export async function generateCalibrationHash(params, secretKey = DEFAULT_SECRET) {
  // 1. Sort keys so serialization is deterministic regardless of key insertion order
  const sortedKeys = Object.keys(params).sort();
  const canonicalData = JSON.stringify(params, sortedKeys);

  const encoder = new TextEncoder();
  const keyBuffer = encoder.encode(secretKey);
  const dataBuffer = encoder.encode(canonicalData);

  // 2. Import the signing key
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // 3. Generate HMAC signature
  const signatureBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);

  // 4. Convert ArrayBuffer to Hex String
  return Array.from(new Uint8Array(signatureBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}