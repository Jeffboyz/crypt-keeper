# Crypt Keeper Technical Steering

## Tech Stack & Constraints

### Allowed

- **HTML5** (semantic markup, no framework)
- **CSS3** (no preprocessor; plain CSS with variables and media queries)
- **JavaScript (ES6+)** (no transpiler, no bundler, no node_modules)
- **Browser APIs**:
  - **WebCrypto** (AES-GCM, PBKDF2-SHA-256, random generation)
  - **localStorage** (persistent storage)
  - **Fetch API** (for file I/O; download/import)
  - **DOM manipulation** (no jQuery)
  - **sessionStorage** (optional, for session-only data)

### Forbidden

- Build tools (webpack, vite, etc.)
- Package managers (npm, yarn, etc.)
- Transpilers (babel, TypeScript compilation)
- External dependencies (libraries, CDNs)
- Backend servers or APIs
- Third-party services (analytics, auth, email)
- Database (server-side; localStorage only)

### Why These Constraints?

1. **Zero Setup**: Users download a single HTML file and open it; no npm install, no build step.
2. **Maximum Portability**: Works offline, works in any modern browser, works on USB drive or email attachment.
3. **Security Clarity**: No opaque dependencies; all code is reviewable.
4. **Hackathon Scope**: Minimal complexity; focus on core features and UX.

## Cryptographic Design & Security Rules

### AES-GCM Encryption

**Rule 1**: Every entry encryption SHALL use a unique, random 96-bit IV.
- **Why**: Deterministic IVs are a critical weakness; reusing an IV breaks GCM security.
- **Implementation**: Call `crypto.getRandomValues(new Uint8Array(12))` per encryption.
- **Testing**: Verify different IVs for identical plaintexts.

**Rule 2**: AES-GCM authentication tag SHALL NOT be bypassed or ignored.
- **Why**: The auth tag detects tampering; ignoring it exposes the app to ciphertext-only attacks.
- **Implementation**: Use `crypto.subtle.decrypt()` and let it fail if auth fails.
- **Testing**: Verify decryption fails with wrong key or tampered ciphertext.

### PBKDF2 Key Derivation

**Rule 3**: PBKDF2 SHALL use 250,000 iterations (NIST recommendation) and SHA-256.
- **Why**: Slows brute-force attacks to ~100-300ms per attempt; at 1M attempts/second, a passphrase would take years to crack.
- **Implementation**: `crypto.subtle.deriveKey(..., {name: "PBKDF2", hash: "SHA-256", salt, iterations: 250000}, ...)`
- **Testing**: Verify consistent key output; measure timing.

**Rule 4**: Each vault SHALL have a unique, random salt (32 bytes minimum).
- **Why**: Prevents rainbow table attacks and distinguishes vaults.
- **Implementation**: Generate salt once at vault creation; store in localStorage (unencrypted).
- **Testing**: Verify different vaults have different salts.

### Passphrase & Key Management

**Rule 5**: Passphrases SHALL NOT be stored, logged, or transmitted.
- **Why**: If a passphrase is stored, loss of that storage = loss of vault.
- **Implementation**: Derive key from passphrase in memory; discard passphrase after derivation.
- **Testing**: Verify passphrase is not in localStorage, sessionStorage, or global scope.

**Rule 6**: Derived keys SHALL be cleared from memory on lock or close.
- **Why**: If device is compromised, in-memory key could be extracted via memory dump.
- **Implementation**: On lock, set key variable to null; rely on garbage collection.
- **Testing**: Manual inspection; add debug logging to verify key is nulled.

**Rule 7**: Private keys or session tokens SHALL NOT be logged, even at debug level.
- **Why**: Logs could be captured and transmitted; secrets must stay in-memory only.
- **Implementation**: Avoid logging cryptographic data; log only success/failure indicators.

### Data Encryption & Storage

**Rule 8**: Entry secrets SHALL ALWAYS be encrypted before storage in localStorage.
- **Why**: localStorage is vulnerable to XSS and device theft; encryption provides defense-in-depth.
- **Implementation**: Encrypt each entry with AES-GCM before writing to localStorage.
- **Testing**: Verify ciphertext in localStorage is unreadable without key.

**Rule 9**: Metadata (heir name, timestamps, intervals) MAY be stored unencrypted.
- **Why**: Metadata is not sensitive; unencrypted storage simplifies display logic.
- **Justification**: Heir name and contact are often shared; user understands they are exposed.
- **Testing**: Verify sensitive secrets are encrypted; metadata is readable.

**Rule 10**: Decrypted entries SHALL NOT persist in localStorage beyond the active session.
- **Why**: Decrypted data on disk is exposed if device is stolen.
- **Implementation**: Decrypt on unlock; store decrypted data in memory only; clear on lock.
- **Testing**: Verify decrypted text is not in localStorage at any time.

### Demo Timer & Release

**Rule 11**: Demo timer fast-forward SHALL be client-side only; no network requests.
- **Why**: Prevents accidental triggers of real notifications or backend changes.
- **Implementation**: Only modify `lastCheckIn` in localStorage; no fetch/XHR calls.
- **Testing**: Monitor network tab; verify no outbound requests.

**Rule 12**: Release condition evaluation SHALL occur client-side only.
- **Why**: Prevents external validation or delays.
- **Implementation**: Compare `lastCheckIn + interval > now()` in JavaScript.
- **Testing**: Verify release state is set locally.

### Error Handling & Logging

**Rule 13**: Decryption errors SHALL NOT include the plaintext or key in error messages.
- **Why**: Error messages are often logged or captured; leaking secrets would be catastrophic.
- **Implementation**: Catch decryption exceptions; log only "Decryption failed" or "Wrong passphrase."
- **Testing**: Verify error messages don't leak data.

**Rule 14**: Invalid entries (corrupted ciphertext) SHALL be skipped, not crash the app.
- **Why**: Partial vault corruption should not lock the user out.
- **Implementation**: Wrap decryption in try-catch; log warning; continue.
- **Testing**: Corrupt a stored ciphertext and verify app still loads.

## Code Quality & Testing Rules

### Unit Testing

**Rule 15**: All crypto functions SHALL have property-based tests.
- **Why**: Crypto correctness is non-negotiable; property tests catch edge cases.
- **Implementation**: Use node:test; generate 100+ random inputs; test encrypt→decrypt.
- **Testing**: Run `node tests/test.js` before committing.

**Rule 16**: Wrong-passphrase decryption SHALL be tested and documented.
- **Why**: False positives (wrong passphrase succeeds) are security bugs.
- **Implementation**: Test that decrypt(ciphertext, wrongKey, iv) fails.

**Rule 17**: Timer logic SHALL be tested with mocked time.
- **Why**: Hard to test real time; mocking allows fast validation.
- **Implementation**: Inject mock Date or time function; test intervals and release.

### Code Organization

**Rule 18**: Crypto utilities SHALL be separate from UI code.
- **Why**: Easier to review security code; reduces coupling.
- **Implementation**: Separate module (or clearly delimited section) for encryption/key derivation.

**Rule 19**: All functions SHALL have JSDoc comments.
- **Why**: Security code is complex; good documentation prevents misuse.
- **Implementation**: `/** @param {ArrayBuffer} plaintext ... @returns {Promise<{ciphertext, iv}>} */`

**Rule 20**: No eval() or dynamic code execution.
- **Why**: Eval is a security risk; prevents code injection.
- **Implementation**: Use only standard JavaScript syntax and APIs.

## UI & UX Rules

### Accessibility

**Rule 21**: Color contrast SHALL meet WCAG AA minimum (4.5:1 for normal text).
- **Why**: Users with low vision need readable text.
- **Testing**: Use WebAIM Contrast Checker or automated tools.

**Rule 22**: All interactive elements SHALL be keyboard-navigable.
- **Why**: Users without mice need full functionality.
- **Implementation**: Tab order, Enter/Space to activate, Escape to close modals.

**Rule 23**: Form labels SHALL be explicitly associated with inputs.
- **Why**: Screen readers need semantic links.
- **Implementation**: `<label for="passphrase-input">...</label>` with matching `id`.

### Performance

**Rule 24**: PBKDF2 derivation SHALL show a loading indicator.
- **Why**: Derivation takes 100-300ms; users need feedback.
- **Implementation**: Show spinner; disable UI during derivation.

**Rule 25**: Encryption/decryption SHALL NOT block UI.
- **Why**: Poor perceived performance; use async functions.
- **Implementation**: Use `await crypto.subtle.encrypt()` in async handlers.

### Tone & Messaging

**Rule 26**: All error messages SHALL be user-friendly and non-technical.
- **Why**: Users may not understand crypto jargon.
- **Examples**:
  - ✅ "Passphrase incorrect"
  - ❌ "PBKDF2 key derivation failed"
  - ✅ "Unable to read file"
  - ❌ "JSON.parse threw SyntaxError"

**Rule 27**: Demo timer SHALL include explicit disclaimer.
- **Why**: Users must understand it is simulated, not real.
- **Implementation**: Display near control: "DEMO: Simulated client-side only. No actual emails sent."

## Browser Compatibility

**Rule 28**: App SHALL support modern browsers with WebCrypto (Chrome 37+, Firefox 34+, Safari 11+, Edge 79+).
- **Why**: Older browsers lack WebCrypto; supporting them requires polyfills (forbidden).
- **Implementation**: Add feature detection; show compatibility warning if WebCrypto unavailable.

**Rule 29**: App SHALL gracefully degrade if WebCrypto is unavailable.
- **Why**: Old browsers or blocked APIs shouldn't crash the app.
- **Implementation**: Check `window.crypto.subtle` exists; show warning if not.

## File Structure & Conventions

### File Organization

```
crypt-keeper/
├── index.html           # All HTML, possibly with embedded CSS/JS
├── app.js               # Main application logic (or embedded in HTML)
├── style.css            # Stylesheets (or embedded in HTML)
├── tests/
│   └── test.js          # Node.js test file
├── .kiro/               # Kiro configuration and specs
├── LICENSE              # License (e.g., MIT, Apache 2.0)
└── .gitignore
```

### Naming Conventions

- **Functions**: `camelCase`, descriptive names (e.g., `deriveKeyFromPassphrase`, `encryptEntry`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `PBKDF2_ITERATIONS`, `ENCRYPTION_ALGORITHM`)
- **Variables**: `camelCase` (e.g., `vaultMeta`, `decryptedEntries`)
- **CSS classes**: `kebab-case` (e.g., `.vault-header`, `.entry-list`, `.demo-control`)
- **IDs**: `kebab-case` (e.g., `#passphrase-input`, `#check-in-button`)

### Comment Style

```javascript
/**
 * Derives a key from a passphrase using PBKDF2-SHA-256.
 * @param {string} passphrase - The user's master passphrase (not stored).
 * @param {Uint8Array} salt - Random salt (32 bytes); stored in vault metadata.
 * @param {number} iterations - Number of PBKDF2 iterations (default: 250000).
 * @returns {Promise<CryptoKey>} A 256-bit AES-GCM key.
 * @throws {Error} If passphrase is empty or derivation fails.
 */
async function deriveKeyFromPassphrase(passphrase, salt, iterations = 250000) {
  // Implementation...
}
```

## Security Checklist (Pre-Commit)

- [ ] No plaintext secrets in code or comments
- [ ] No network requests (except file download/import)
- [ ] No external dependencies or CDN links
- [ ] Crypto functions tested with property-based tests
- [ ] Decryption errors do NOT leak plaintext
- [ ] Passphrases are NOT logged
- [ ] Keys are cleared from memory on lock
- [ ] Decrypted data is NOT persisted to localStorage
- [ ] localStorage only stores ciphertext (entries) and metadata
- [ ] Demo timer is client-side only
- [ ] No browser console errors
- [ ] All tests pass: `node tests/test.js`

## Testing & Verification Commands

```bash
# Run unit tests
node tests/test.js

# Check for console errors (manual browser inspection)
# Open app in browser, open DevTools Console, look for errors

# Verify no network requests (manual)
# Open app in browser, open DevTools Network tab, check for outbound requests

# Verify localStorage structure (manual)
# Open app, unlock vault, open DevTools Application tab, inspect localStorage

# Performance check (manual)
# Unlock vault, measure time taken (should be ~100-300ms for PBKDF2)
```

## Deployment & Distribution

- **Format**: Single HTML file or HTML + separate CSS/JS (depending on hackathon rules).
- **Distribution**: Upload to GitHub, submit to hackathon judges, or distribute as ZIP.
- **No build step**: `open index.html` should work immediately.
- **No installation**: Users do NOT need to run npm install or any setup.

## Future-Proofing

### Versioning

- **Format**: `version: "1.0"` in vault metadata and exports.
- **Migration**: If v2 has different encryption, include migration logic to read v1 vaults.

### Extensibility

- Crypto functions isolated; easy to swap algorithms in v2.
- Metadata structure is forward-compatible; new fields can be added.
- Entry type is enumerable (`password`, `message`, `wish`); new types can be added in v2.

---

## Summary

Crypt Keeper's technical approach prioritizes **security, simplicity, and verifiability** over features or frameworks. Every cryptographic decision is grounded in standards; every code decision is transparent and reviewable. The tech stack is intentionally minimal to enable portability and to reduce attack surface.
