/**
 * CJS shim for uuid — used by Jest via moduleNameMapper.
 * Provides v7 (time-based), v4 (random) using Node's built-in crypto.
 * Only needed in the test environment since uuid v14 is pure ESM.
 */
const crypto = require('crypto');

// UUIDv4 — crypto.randomUUID() is available in Node 14.17+
function v4() {
  return crypto.randomUUID();
}

// UUIDv7 — time-sortable UUID (simplified implementation for tests)
function v7() {
  const now    = BigInt(Date.now());
  const ms     = now.toString(16).padStart(12, '0');          // 48-bit unix ms
  const rand   = crypto.randomBytes(10).toString('hex');       // 80 random bits
  const ver    = '7';
  const varBits = ((parseInt(rand.slice(4, 6), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0');
  // Format: xxxxxxxx-xxxx-7xxx-Nxxx-xxxxxxxxxxxx
  const uuid = [
    ms.slice(0, 8),
    ms.slice(8, 12),
    ver + rand.slice(0, 3),
    varBits + rand.slice(6, 9),
    rand.slice(9, 21),
  ].join('-');
  return uuid;
}

module.exports = { v4, v7 };
