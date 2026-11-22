/**
 * Crypt Keeper - Crypto & Core Logic Tests
 * Uses node:test (Node.js 18+, no external dependencies)
 */

import test from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// Import crypto utilities
import {
  generateSalt,
  generateIV,
  uint8ToBase64,
  base64ToUint8,
  deriveKey,
  encryptEntry,
  decryptEntry,
  encryptCanary,
  verifyCanary
} from '../crypto.js';

// Get current file path for reference
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// UTILITY TESTS
// ============================================================================

test('generateSalt produces random 32-byte output', async (t) => {
  const salt1 = generateSalt(32);
  const salt2 = generateSalt(32);

  assert.strictEqual(salt1.length, 32, 'Salt should be 32 bytes');
  assert.strictEqual(salt2.length, 32, 'Salt should be 32 bytes');
  assert.notDeepStrictEqual(salt1, salt2, 'Two salts should be different (random)');
});

test('generateIV produces random 12-byte output', async (t) => {
  const iv1 = generateIV();
  const iv2 = generateIV();

  assert.strictEqual(iv1.length, 12, 'IV should be 12 bytes');
  assert.strictEqual(iv2.length, 12, 'IV should be 12 bytes');
  assert.notDeepStrictEqual(iv1, iv2, 'Two IVs should be different (random)');
});

test('uint8ToBase64 and base64ToUint8 are inverses', async (t) => {
  const original = new Uint8Array([1, 2, 3, 255, 128, 0, 64]);
  const b64 = uint8ToBase64(original);
  const decoded = base64ToUint8(b64);

  assert.deepStrictEqual(decoded, original, 'Round-trip should preserve data');
});

// ============================================================================
// KEY DERIVATION TESTS
// ============================================================================

test('deriveKey produces a CryptoKey', async (t) => {
  const { key, salt } = await deriveKey('MyPassphrase123!', null, 250000);

  assert(key, 'Should return a key');
  assert.strictEqual(key.type, 'secret', 'Key should be secret type');
  assert.strictEqual(key.algorithm.name, 'AES-GCM', 'Key algorithm should be AES-GCM');
  // Note: key.length is not available on all platforms; we trust WebCrypto
  assert(salt, 'Should return salt');
  assert.strictEqual(salt.length, 32, 'Salt should be 32 bytes');
});

test('deriveKey is deterministic (same passphrase + salt = same key)', async (t) => {
  const passphrase = 'TestPassphrase123!';
  const salt = generateSalt(32);

  const { key: key1 } = await deriveKey(passphrase, salt, 250000);
  const { key: key2 } = await deriveKey(passphrase, salt, 250000);

  // We can't directly compare CryptoKeys, so we'll test them by encryption
  const plaintext = 'test data';
  const { ciphertext: ct1, iv: iv1 } = await encryptEntry(plaintext, key1);
  const decrypted = await decryptEntry(ct1, iv1, key2);

  assert.strictEqual(decrypted, plaintext, 'Keys derived from same passphrase+salt should decrypt each other');
});

test('deriveKey with different passphrases produces different keys', async (t) => {
  const salt = generateSalt(32);

  const { key: key1 } = await deriveKey('Passphrase1', salt, 250000);
  const { key: key2 } = await deriveKey('Passphrase2', salt, 250000);

  const plaintext = 'test';
  const { ciphertext, iv } = await encryptEntry(plaintext, key1);

  // Decryption with key2 should fail
  let failed = false;
  try {
    await decryptEntry(ciphertext, iv, key2);
  } catch {
    failed = true;
  }

  assert(failed, 'Decryption with different key should fail');
});

test('deriveKey works with any passphrase (including empty)', async (t) => {
  // The validation is at the app level, not crypto level
  const { key: key1 } = await deriveKey('', null, 250000);
  const { key: key2 } = await deriveKey('nonempty', null, 250000);
  
  assert(key1, 'Should derive key from empty passphrase (validation is app-level)');
  assert(key2, 'Should derive key from non-empty passphrase');
});

// ============================================================================
// ENCRYPTION TESTS
// ============================================================================

test('encryptEntry and decryptEntry round-trip', async (t) => {
  const { key } = await deriveKey('TestPass123', null, 250000);
  const plaintext = 'This is a secret message';

  const { ciphertext, iv } = await encryptEntry(plaintext, key);
  const decrypted = await decryptEntry(ciphertext, iv, key);

  assert.strictEqual(decrypted, plaintext, 'Decrypted should match original plaintext');
});

test('encryptEntry produces different ciphertexts for identical plaintexts (random IV)', async (t) => {
  const { key } = await deriveKey('TestPass123', null, 250000);
  const plaintext = 'Same message twice';

  const { ciphertext: ct1 } = await encryptEntry(plaintext, key);
  const { ciphertext: ct2 } = await encryptEntry(plaintext, key);

  assert.notStrictEqual(ct1, ct2, 'Two encryptions of same plaintext should produce different ciphertexts');
});

// ============================================================================
// PROPERTY-BASED ENCRYPTION TESTS
// ============================================================================

test('encryption round-trip with varied input lengths', async (t) => {
  const { key } = await deriveKey('TestPass', null, 250000);

  const inputs = [
    '',
    'a',
    'short',
    'a'.repeat(1000),
    'a'.repeat(10000)
  ];

  for (const plaintext of inputs) {
    const { ciphertext, iv } = await encryptEntry(plaintext, key);
    const decrypted = await decryptEntry(ciphertext, iv, key);
    assert.strictEqual(decrypted, plaintext, `Round-trip failed for length ${plaintext.length}`);
  }
});

test('encryption round-trip with special characters', async (t) => {
  const { key } = await deriveKey('TestPass', null, 250000);

  const inputs = [
    '!@#$%^&*()',
    '"quotes"',
    "'single quotes'",
    'line\nbreaks\nhere',
    'tab\tseparated\tvalues',
    'backslash\\test',
    'null\0character'
  ];

  for (const plaintext of inputs) {
    const { ciphertext, iv } = await encryptEntry(plaintext, key);
    const decrypted = await decryptEntry(ciphertext, iv, key);
    assert.strictEqual(decrypted, plaintext, `Round-trip failed for special chars: ${JSON.stringify(plaintext)}`);
  }
});

test('encryption round-trip with Unicode characters', async (t) => {
  const { key } = await deriveKey('TestPass', null, 250000);

  const inputs = [
    '🔐 emoji here',
    'café français',
    '中文 Chinese',
    '🚀🌟💎✨🔥',
    'Ñoño español',
    'Привет Russian'
  ];

  for (const plaintext of inputs) {
    const { ciphertext, iv } = await encryptEntry(plaintext, key);
    const decrypted = await decryptEntry(ciphertext, iv, key);
    assert.strictEqual(decrypted, plaintext, `Round-trip failed for unicode: ${plaintext}`);
  }
});

test('encryption round-trip with JSON strings', async (t) => {
  const { key } = await deriveKey('TestPass', null, 250000);

  const jsonObj = {
    title: 'Bank Password',
    type: 'password',
    secret: 'MyP@ssw0rd!',
    createdAt: '2026-01-15T10:00:00Z'
  };
  const plaintext = JSON.stringify(jsonObj);

  const { ciphertext, iv } = await encryptEntry(plaintext, key);
  const decrypted = await decryptEntry(ciphertext, iv, key);
  const restored = JSON.parse(decrypted);

  assert.deepStrictEqual(restored, jsonObj, 'JSON round-trip should preserve structure');
});

// ============================================================================
// WRONG PASSPHRASE TESTS
// ============================================================================

test('decryptEntry fails with wrong key', async (t) => {
  const { key: key1 } = await deriveKey('Passphrase1', null, 250000);
  const { key: key2 } = await deriveKey('Passphrase2', null, 250000);

  const plaintext = 'secret';
  const { ciphertext, iv } = await encryptEntry(plaintext, key1);

  try {
    await decryptEntry(ciphertext, iv, key2);
    assert.fail('Should throw on wrong key');
  } catch (err) {
    assert(err, 'Should throw error when decrypting with wrong key');
  }
});

test('decryptEntry fails with tampered ciphertext', async (t) => {
  const { key } = await deriveKey('TestPass', null, 250000);

  const plaintext = 'secret';
  let { ciphertext, iv } = await encryptEntry(plaintext, key);

  // Tamper with ciphertext (flip a bit)
  const decoded = base64ToUint8(ciphertext);
  if (decoded.length > 0) {
    decoded[0] ^= 0x01; // Flip first bit
    ciphertext = uint8ToBase64(decoded);
  }

  try {
    await decryptEntry(ciphertext, iv, key);
    assert.fail('Should throw on tampered ciphertext');
  } catch (err) {
    assert(err, 'Should throw error on tampered ciphertext');
  }
});

test('decryptEntry fails with wrong IV', async (t) => {
  const { key } = await deriveKey('TestPass', null, 250000);

  const plaintext = 'secret';
  const { ciphertext, iv: originalIV } = await encryptEntry(plaintext, key);

  // Use a different IV
  const wrongIV = uint8ToBase64(generateIV());

  try {
    await decryptEntry(ciphertext, wrongIV, key);
    assert.fail('Should throw on wrong IV');
  } catch (err) {
    assert(err, 'Should throw error with wrong IV');
  }
});

// ============================================================================
// CANARY TESTS
// ============================================================================

test('encryptCanary creates a valid canary', async (t) => {
  const { key } = await deriveKey('TestPass123', null, 250000);

  const { ciphertext, iv } = await encryptCanary(key);

  assert(ciphertext, 'Should have ciphertext');
  assert(iv, 'Should have IV');

  // Verify we can decrypt it
  const decrypted = await decryptEntry(ciphertext, iv, key);
  assert.strictEqual(decrypted, 'crypt-keeper-canary', 'Canary should decrypt correctly');
});

test('verifyCanary succeeds with correct key', async (t) => {
  const { key } = await deriveKey('TestPass123', null, 250000);

  const { ciphertext, iv } = await encryptCanary(key);
  const verified = await verifyCanary(ciphertext, iv, key);

  assert(verified, 'Canary should verify with correct key');
});

test('verifyCanary fails with wrong key', async (t) => {
  const { key: key1 } = await deriveKey('Passphrase1', null, 250000);
  const { key: key2 } = await deriveKey('Passphrase2', null, 250000);

  const { ciphertext, iv } = await encryptCanary(key1);
  const verified = await verifyCanary(ciphertext, iv, key2);

  assert(!verified, 'Canary should not verify with wrong key');
});

// ============================================================================
// TIMER LOGIC TESTS
// ============================================================================

test('daysRemaining calculation', async (t) => {
  const calculateDaysRemaining = (lastCheckIn, intervalDays) => {
    const elapsed = Date.now() - new Date(lastCheckIn).getTime();
    const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((intervalMs - elapsed) / (24 * 60 * 60 * 1000)));
  };

  // Test 1: Just checked in
  const now = new Date();
  const daysNow = calculateDaysRemaining(now.toISOString(), 14);
  assert.strictEqual(daysNow, 14, 'Days remaining should be 14 if just checked in');

  // Test 2: 7 days ago (7 days remaining)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const daysHalf = calculateDaysRemaining(sevenDaysAgo.toISOString(), 14);
  assert.strictEqual(daysHalf, 7, 'Days remaining should be ~7 after 7 days');

  // Test 3: Past interval (0 remaining)
  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  const daysPassed = calculateDaysRemaining(fifteenDaysAgo.toISOString(), 14);
  assert.strictEqual(daysPassed, 0, 'Days remaining should be 0 when past interval');
});

test('release condition triggers when elapsed > interval', async (t) => {
  const shouldRelease = (lastCheckIn, intervalDays, isReleased) => {
    if (isReleased) return true;

    const elapsed = Date.now() - new Date(lastCheckIn).getTime();
    const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
    return elapsed > intervalMs;
  };

  // Test 1: Not yet released
  const now = new Date();
  const notReleased = shouldRelease(now.toISOString(), 14, false);
  assert(!notReleased, 'Should not release if just checked in');

  // Test 2: Past interval, should release
  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  const released = shouldRelease(fifteenDaysAgo.toISOString(), 14, false);
  assert(released, 'Should release when elapsed > interval');

  // Test 3: Already released
  const alreadyReleased = shouldRelease(now.toISOString(), 14, true);
  assert(alreadyReleased, 'Should stay released once released');
});

test('demo fast-forward advances timer correctly', async (t) => {
  const fastForward = (lastCheckIn, daysBack) => {
    const date = new Date(lastCheckIn);
    date.setDate(date.getDate() - daysBack);
    return date.toISOString();
  };

  const original = new Date('2026-01-15T10:00:00Z');
  const advanced = fastForward(original.toISOString(), 7);

  const originalDate = new Date(original);
  const advancedDate = new Date(advanced);
  const daysDiff = (originalDate - advancedDate) / (24 * 60 * 60 * 1000);

  assert.strictEqual(daysDiff, 7, 'Fast-forward should subtract the specified days');
});

// ============================================================================
// VAULT STATE MANAGEMENT (SIMULATED)
// ============================================================================

test('vault metadata structure is valid', async (t) => {
  const { key, salt } = await deriveKey('TestPass123', null, 250000);
  const { ciphertext: canary, iv: canaryIV } = await encryptCanary(key);

  const meta = {
    version: '1.0',
    salt: uint8ToBase64(salt),
    canary: canary,
    canaryIV: canaryIV,
    createdAt: new Date().toISOString(),
    heir: null,
    checkInInterval: null,
    lastCheckIn: null,
    isReleased: false,
    releasedAt: null
  };

  assert.strictEqual(meta.version, '1.0');
  assert(meta.salt);
  assert(meta.canary);
  assert(meta.canaryIV);
  assert(meta.createdAt);
});

test('entry structure is valid', async (t) => {
  const { key } = await deriveKey('TestPass123', null, 250000);
  const { ciphertext, iv } = await encryptEntry('My Secret', key);

  const entry = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Bank Password',
    type: 'password',
    ciphertext: ciphertext,
    iv: iv,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  };

  assert(entry.id);
  assert(entry.title);
  assert(['password', 'message', 'wish'].includes(entry.type));
  assert(entry.ciphertext);
  assert(entry.iv);
  assert(entry.createdAt);
  assert(entry.modifiedAt);
});

// ============================================================================
// EXPORT/IMPORT SIMULATION
// ============================================================================

test('vault export structure is valid', async (t) => {
  const { key, salt } = await deriveKey('TestPass123', null, 250000);
  const { ciphertext: canary, iv: canaryIV } = await encryptCanary(key);
  const { ciphertext, iv } = await encryptEntry('Secret', key);

  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    meta: {
      version: '1.0',
      salt: uint8ToBase64(salt),
      canary: canary,
      canaryIV: canaryIV,
      createdAt: new Date().toISOString(),
      heir: {
        name: 'Alice',
        contact: 'alice@example.com',
        addedAt: new Date().toISOString()
      },
      checkInInterval: 14,
      lastCheckIn: new Date().toISOString(),
      isReleased: false,
      releasedAt: null
    },
    entries: [
      {
        id: 'uuid1',
        title: 'Password',
        type: 'password',
        ciphertext: ciphertext,
        iv: iv,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      }
    ]
  };

  // Verify it's JSON-serializable
  const json = JSON.stringify(backup);
  const restored = JSON.parse(json);

  assert.strictEqual(restored.version, '1.0');
  assert(restored.meta);
  assert(Array.isArray(restored.entries));
  assert.strictEqual(restored.entries.length, 1);
});

// ============================================================================
// PASSPHRASE CHANGE SIMULATION
// ============================================================================

test('passphrase change re-encrypts entries', async (t) => {
  const oldPassphrase = 'OldPass123!';
  const newPassphrase = 'NewPass456!';

  // Create vault with old passphrase
  const { key: oldKey, salt: oldSalt } = await deriveKey(oldPassphrase, null, 250000);
  const plaintext = 'Secret Entry';
  const { ciphertext: oldCtx, iv: oldIV } = await encryptEntry(plaintext, oldKey);

  // Re-encrypt with new passphrase
  const decrypted = await decryptEntry(oldCtx, oldIV, oldKey);
  const { key: newKey, salt: newSalt } = await deriveKey(newPassphrase, null, 250000);
  const { ciphertext: newCtx, iv: newIV } = await encryptEntry(decrypted, newKey);

  // Verify new passphrase unlocks it
  const reDecrypted = await decryptEntry(newCtx, newIV, newKey);
  assert.strictEqual(reDecrypted, plaintext, 'Should decrypt with new key after passphrase change');

  // Verify old passphrase doesn't work
  try {
    await decryptEntry(newCtx, newIV, oldKey);
    assert.fail('Old passphrase should not decrypt re-encrypted entry');
  } catch {
    // Expected
  }
});

// ============================================================================
// PERFORMANCE TESTS (INFORMATIONAL)
// ============================================================================

test('PBKDF2 key derivation timing (informational)', async (t) => {
  const start = Date.now();
  const { key } = await deriveKey('TestPassphrase123', null, 250000);
  const elapsed = Date.now() - start;

  console.log(`✓ Key derivation: ${elapsed}ms (target: 100-300ms on modern hardware)`);
  assert(elapsed > 50, 'Should take at least some time');
});

test('AES-GCM encryption timing (informational)', async (t) => {
  const { key } = await deriveKey('TestPass', null, 250000);
  const plaintext = 'x'.repeat(10000); // 10KB

  const start = Date.now();
  const { ciphertext, iv } = await encryptEntry(plaintext, key);
  const elapsed = Date.now() - start;

  console.log(`✓ Encryption of 10KB: ${elapsed}ms`);
  assert(elapsed < 500, 'Should be fast');
});

test('AES-GCM decryption timing (informational)', async (t) => {
  const { key } = await deriveKey('TestPass', null, 250000);
  const plaintext = 'x'.repeat(10000); // 10KB
  const { ciphertext, iv } = await encryptEntry(plaintext, key);

  const start = Date.now();
  const decrypted = await decryptEntry(ciphertext, iv, key);
  const elapsed = Date.now() - start;

  console.log(`✓ Decryption of 10KB: ${elapsed}ms`);
  assert(elapsed < 500, 'Should be fast');
});
