# 🔐 Crypt Keeper

A respectful, client-side encrypted digital legacy vault designed for Kiroween 2026 (Costume Contest). Crypt Keeper enables users to create an encrypted repository of their digital assets—passwords, final messages, and wishes—protected by a master passphrase and accessible only by a trusted heir if the user does not check in after a configured interval.

## Features

- **Client-Side Encryption**: All data encrypted with AES-GCM (256-bit keys) using WebCrypto. Neither Crypt Keeper developers nor any third party can access your secrets.
- **Secure Key Derivation**: Passphrases are never stored. Instead, keys are derived using PBKDF2-SHA-256 (250,000 iterations) at unlock time.
- **Entry Management**: Add, edit, delete encrypted entries (passwords, messages, wishes). Each entry is encrypted with a unique random IV.
- **Heir Designation**: Specify a trusted heir (name, contact info).
- **Check-In Timer**: Set a check-in interval (7, 14, or 30 days). If you don't check in, your vault is released to your heir.
- **Demo Release Flow**: Fast-forward the timer client-side to preview the vault release without waiting.
- **Export & Import**: Backup and restore encrypted vaults as JSON files. No passwords sent anywhere.
- **Passphrase Change**: Re-encrypt your vault with a new passphrase.
- **Spooky Design**: Dark, candle-lit, graveyard-themed UI with gold accents. Respectful and accessible.
- **Zero Dependencies**: Pure HTML, CSS, JavaScript. No build step, no npm install, no external services.

## Getting Started

### Open the App

Simply open `index.html` in a modern web browser:

```bash
# macOS
open index.html

# Linux
xdg-open index.html
# or
firefox index.html

# Windows
start index.html
```

Or open it from a file manager by double-clicking `index.html`.

### Create a Vault

1. **Open the app** → See the vault creation screen.
2. **Enter a passphrase** (minimum 8 characters) → Real-time strength indicator.
3. **Confirm passphrase** → Match the first entry.
4. **Click "Create Vault"** → Vault is created and unlocked.

### Add Entries

1. **Click "+ Add Entry"** → Form appears.
2. **Enter title** (e.g., "Bank Password")
3. **Select type** (Password, Message, or Wish)
4. **Enter secret text** (the actual password, message, or wish)
5. **Click "Add Entry"** → Encrypted and stored.

### Set a Trusted Heir

1. **Click ⚙️ (Settings)** → Opens settings panel.
2. **Click "Heir" tab** → Enter heir's name and contact info.
3. **Click "Timer" tab** → Select check-in interval (7, 14, or 30 days).
4. **Check-in interval is active** → Your timer starts now.

### Check In

1. **Click "Check In"** button (visible if heir is set) → Timer resets.
2. **Your "days remaining" updates** → Resets to your selected interval.

### Demo Release Flow

1. **Click ⚙️ (Settings)** → Opens settings.
2. **Click "Demo" tab** → Shows "Fast-Forward Timer" section.
3. **Enter a number of days** → Fast-forward the timer.
4. **Click "Fast-Forward Timer"** → **⚠️ Simulated client-side only. No actual emails sent.**
5. **Vault transitions to "Released" state** → Shows heir contact info and message.
6. **Continue using the vault** → Still unlock with your passphrase; the vault is also now "released" to your heir in this simulation.

### Backup & Restore

1. **Click ⚙️ (Settings)** → Opens settings.
2. **Click "Export/Import" tab** → Two options:
   - **Download Backup**: Saves an encrypted JSON file to your device.
   - **Import Backup**: Restores a previously exported backup.

### Change Passphrase

1. **Click ⚙️ (Settings)** → Opens settings.
2. **Click "Passphrase" tab** → Enter current passphrase, new passphrase, and confirm.
3. **Click "Change Passphrase"** → Your vault is re-encrypted with the new passphrase.

## Security Model

### What is Encrypted?

- All entry data (passwords, messages, wishes) are encrypted with AES-GCM before storage in the browser's localStorage.
- Ciphertext and IV (initialization vector) are stored, but the plaintext is never written to disk.

### What is NOT Encrypted?

- **Metadata** (heir name, contact, check-in interval, timestamps, vault version) is stored unencrypted in localStorage. This is necessary for app functionality.
- **Salt** is stored unencrypted; this is standard practice and required to derive the key from your passphrase on unlock.

### Key Security Guarantees

1. **Passphrase Never Stored**: If you forget your passphrase, your vault is inaccessible by design. There is no recovery mechanism.
2. **Strong Key Derivation**: PBKDF2-SHA-256 with 250,000 iterations makes brute-force attacks economically unfeasible.
3. **Unique IVs**: Each entry is encrypted with a random IV, so identical plaintexts produce different ciphertexts.
4. **Authentication**: AES-GCM's authentication tag ensures tampering is detected.
5. **Client-Side Only**: No data leaves your device unless you explicitly export or sync.

### Limitations

- **Device Compromise**: If your device is compromised by malware, decrypted data in memory could be extracted.
- **localStorage Vulnerability**: While encrypted entries are safe, the browser's developer tools can access localStorage. Protect your device.
- **Demo is Simulated**: The "release to heir" flow is client-side simulation only; no actual emails are sent. In a v2 backend, real notifications could be implemented.
- **No Sync**: This version stores data only locally. Backups must be manually exported and stored securely.

### Recommended Practices

1. **Use a Strong Passphrase**: Mix uppercase, lowercase, numbers, and symbols. Minimum 16 characters recommended.
2. **Remember Your Passphrase**: There is no "forgot passphrase" recovery.
3. **Backup Regularly**: Export your vault periodically and store the backup in a secure location (encrypted external drive, password manager, etc.).
4. **Protect Your Device**: Use a strong OS password, enable full-disk encryption, keep software updated.
5. **Test Your Setup**: Verify you can export, import, and unlock the backup before trusting it with critical data.

## Technical Details

### Cryptography

- **Encryption Algorithm**: AES-GCM (Galois/Counter Mode)
  - Key Size: 256 bits
  - IV (Initialization Vector): 96 bits (12 bytes), random per entry
  - Authentication Tag: 128 bits (automatic with GCM)

- **Key Derivation**: PBKDF2-SHA-256
  - Passphrase + Salt → 256-bit AES-GCM key
  - Iterations: 250,000 (NIST recommendation)
  - Timing: ~100-300ms on modern hardware

- **Random Generation**: `crypto.getRandomValues()` from WebCrypto API
  - Salt: 256 bits (32 bytes) per vault
  - IV: 96 bits (12 bytes) per entry

### Data Storage

All data stored in browser's `localStorage`:

```
cryptKeeperMeta: {
  version: "1.0",
  salt: "base64-encoded",
  canary: "base64-encoded-canary-ciphertext",
  canaryIV: "base64-encoded-iv",
  createdAt: "2026-01-15T10:00:00Z",
  heir: { name, contact, addedAt },
  checkInInterval: 14,
  lastCheckIn: "2026-01-20T14:30:00Z",
  isReleased: false,
  releasedAt: null
}

cryptKeeperEntries: [
  {
    id: "uuid",
    title: "Bank Password",
    type: "password",
    ciphertext: "base64-encoded",
    iv: "base64-encoded",
    createdAt: "2026-01-15T10:00:00Z",
    modifiedAt: "2026-01-15T10:00:00Z"
  },
  ...
]
```

### Browser Compatibility

Works on modern browsers with WebCrypto API support:

- Chrome/Chromium 37+
- Firefox 34+
- Safari 11+
- Edge 79+

Older browsers will see a compatibility warning and cannot use the app.

## Testing

Run the test suite with Node.js 18+:

```bash
node tests/crypto.test.js
```

Tests cover:

- ✓ Key derivation (PBKDF2)
- ✓ Encryption/decryption round-trips
- ✓ Wrong passphrase failures
- ✓ Tamper detection
- ✓ Timer logic
- ✓ Vault state management
- ✓ Export/import
- ✓ Passphrase change
- ✓ Property-based tests with varied inputs (lengths, Unicode, special characters)

## Building & Deployment

### No Build Step Required

Crypt Keeper is a static single-page application. Simply serve the files:

```bash
# Python 3
python3 -m http.server 8000

# Node.js (http-server)
npx http-server .

# Or open index.html directly in a browser
open index.html
```

### Single-File Distribution (Optional)

For hackathon submissions, you can embed `app.js` and `style.css` inline in `index.html`:

```html
<style>
  /* contents of style.css */
</style>
<script>
  // contents of crypto.js
  // contents of app.js
</script>
```

## Development & Contributing

### Project Structure

```
crypt-keeper/
├── index.html          # Main HTML file
├── app.js              # Application logic
├── crypto.js           # Crypto utilities (reusable by tests)
├── style.css           # Styles
├── tests/
│   └── crypto.test.js  # Test suite
├── README.md           # This file
├── LICENSE             # MIT License
└── .kiro/              # Kiro config (specs, steering, hooks)
```

### Code Quality

- **No external dependencies** → Pure browser APIs and Node.js standard library (tests only).
- **Property-based testing** → Tests use varied inputs (lengths, Unicode, special chars).
- **Accessible** → WCAG AA color contrast, keyboard navigation, semantic HTML.
- **Responsive** → Works on 320px (mobile) to 1024px+ (desktop) viewports.

### Security Checklist

Before deploying:

- [ ] No plaintext secrets in code
- [ ] No external dependencies
- [ ] All crypto functions tested
- [ ] Wrong passphrase decryption fails
- [ ] Passphrases never logged
- [ ] Keys cleared from memory on lock
- [ ] Decrypted data not persisted to localStorage
- [ ] No network requests (except file download/import)
- [ ] Console clean of errors

## Limitations & Future Work

### v1 Scope (This Release)

- ✓ Client-side AES-GCM encryption
- ✓ PBKDF2 key derivation
- ✓ Entry management (CRUD)
- ✓ Heir designation & check-in timer
- ✓ Demo fast-forward (simulated)
- ✓ Export/import backups
- ✓ Passphrase change
- ✓ Spooky dark theme

### v2+ Possibilities

- Cloud sync with end-to-end encryption
- Multi-device support
- Second-factor authentication (TOTP, security keys)
- Entry search and categorization
- Real email delivery to heir (requires backend)
- Multiple heirs with permission levels
- Timed message delivery
- Dark/light theme toggle
- Internationalization (i18n)
- Mobile native apps

## License

MIT License. See LICENSE file.

## Disclaimer

**Crypt Keeper is a Kiroween 2026 hackathon project.** For production use of digital legacy planning, consult legal and estate planning professionals. This tool is provided "as is" without warranty.

---

**Built with ❤️ by Kiro for Kiroween 2026**

Respectful, secure, and Halloween-themed. Your digital legacy, your control.
