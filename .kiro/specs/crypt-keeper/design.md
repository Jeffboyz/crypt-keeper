# Crypt Keeper Design Document

## Architecture Overview

Crypt Keeper is a client-side, static single-page application with no backend or build step. All state is persisted in the browser's localStorage. The app operates in discrete states:

1. **Initial State**: No vault exists; user sees vault creation screen.
2. **Locked State**: Vault exists; user must enter passphrase to proceed.
3. **Unlocked State**: User has successfully authenticated; can view, add, edit, delete entries, manage heir settings, and check in.
4. **Released State**: Timer has elapsed; vault is "released" to heir (simulated client-side; displays heir contact info and message).

The app maintains minimal in-memory state (decrypted entries, current passphrase for the session) and clears it on lock or unload.

## Cryptographic Design

### Key Derivation

- **Algorithm**: PBKDF2-SHA-256
- **Iterations**: 250,000 (NIST recommendation for interactive use)
- **Salt**: Random 32 bytes (256 bits), generated once per vault, stored unencrypted in localStorage
- **Output**: 256-bit key for AES-GCM
- **Timing**: Derivation occurs at unlock time; takes ~100-300ms on modern devices (user sees loading indicator)

### Encryption

- **Algorithm**: AES-GCM (Advanced Encryption Standard in Galois/Counter Mode)
- **Key Size**: 256 bits (derived from passphrase)
- **IV (Initialization Vector)**: Random 96 bits (12 bytes), generated per encryption operation, stored with ciphertext
- **Auth Tag**: 128 bits (automatic with AES-GCM; ensures authenticity and integrity)
- **Plaintext Format**: JSON string (title, type, secret text, timestamps)
- **Ciphertext Storage**: Base64-encoded in localStorage alongside IV

### Security Rationale

- **PBKDF2 with 250k iterations** defends against brute-force attacks on the passphrase.
- **Random salt per vault** prevents rainbow table attacks and distinguishes vaults.
- **Random IV per entry** ensures identical plaintexts produce different ciphertexts.
- **AES-GCM authentication tag** detects tampering; decryption fails if ciphertext is modified or wrong key is used.
- **Passphrase never stored** means loss of passphrase = loss of access (intentional; no backdoor recovery).

## Data Model

### Vault Metadata (localStorage key: "cryptKeeperMeta")

```json
{
  "version": "1.0",
  "salt": "base64-encoded-32-bytes",
  "createdAt": "2026-01-15T10:30:00Z",
  "heir": {
    "name": "Alice Smith",
    "contact": "alice@example.com",
    "addedAt": "2026-01-15T10:35:00Z"
  },
  "checkInInterval": 14,
  "lastCheckIn": "2026-01-15T10:35:00Z",
  "isReleased": false,
  "releasedAt": null
}
```

### Entry Structure (localStorage key: "cryptKeeperEntries", array)

Each entry in the array:

```json
{
  "id": "uuid-v4-string",
  "title": "My Bank Password",
  "type": "password",
  "ciphertext": "base64-encoded-aes-gcm-ciphertext",
  "iv": "base64-encoded-96-bit-iv",
  "createdAt": "2026-01-15T10:40:00Z",
  "modifiedAt": "2026-01-15T10:40:00Z"
}
```

### Exported Vault File Format

```json
{
  "version": "1.0",
  "exportedAt": "2026-01-15T10:45:00Z",
  "meta": { ... },
  "entries": [ ... ]
}
```

## UI Structure

### Key Screens

1. **Vault Creation Screen**
   - Logo / Title ("Crypt Keeper")
   - Passphrase input (password field)
   - Confirm passphrase input
   - Strength indicator (real-time)
   - Create button (disabled until strength >= "fair")
   - Footer: disclaimer about passphrase being non-recoverable

2. **Locked Screen**
   - Logo / Title
   - Passphrase input
   - Unlock button
   - Error message area (if unlock fails)
   - Import button (to restore from backup)
   - "No vault? Create one" link (if applicable)

3. **Vault Home (Unlocked)**
   - Header: "Vault Unlocked" badge, Lock button, Settings button
   - Check-In Status Panel (if heir is set)
     - Status: "14 days remaining" or "Released to heir"
     - Check-In button
     - Days-remaining progress indicator
   - Entry List
     - Add Entry button
     - List of entries: [Icon | Title | Type | Modified Date | Menu (edit/delete)]
   - Entry Detail View (modal or side panel)
     - Title, Type, Secret text (displayed)
     - Edit / Delete buttons

4. **Settings Screen (Unlocked)**
   - Heir Configuration Form
     - Heir name input
     - Heir contact input (email/phone/address)
     - Save button
   - Check-In Interval Configuration
     - Radio buttons: 7 / 14 / 30 days
     - Initialize button
   - Demo Timer Fast-Forward Section
     - Disclaimer: "Simulated client-side only"
     - Number input (days to fast-forward)
     - Fast-Forward button
   - Change Passphrase Form
     - Current passphrase input
     - New passphrase input
     - Confirm new passphrase input
     - Strength indicator
     - Change button (with loading state for PBKDF2)
   - Export button
   - Back to vault button

5. **Released State Screen**
   - "Vault Released to Heir" heading
   - Heir name and contact information
   - Message: "Your final wishes and legacy have been released to [heir name]. You can contact them at: [contact]"
   - Message: "You may continue to access your vault by entering your passphrase."

### Visual Language

- **Color Palette**:
  - Primary background: Deep purple-black (#1a0f2e or similar)
  - Accent (buttons, highlights): Gold/amber (#d4af37 or similar)
  - Text: Light gray/white (#e8e8e8)
  - Error: Warm red/crimson (#dc143c)
  - Success: Sage green (#6b8e23)

- **Typography**:
  - Heading font: Serif (e.g., Georgia, serif) for gravitas
  - Body font: Sans-serif (e.g., -apple-system, sans-serif) for readability
  - Font sizes: Responsive; scale down on mobile

- **Iconography**:
  - Password entry type: Key icon
  - Message entry type: Envelope icon
  - Wish entry type: Candle/Star icon
  - Check-in: Clock/Hourglass icon
  - Settings: Gear icon
  - Lock/Unlock: Lock/Open lock icon

- **Animations & Effects**:
  - Candle flicker effect (CSS animation) on background or header
  - Subtle fade-in for modal dialogs
  - Smooth color transitions on hover/focus
  - No excessive animations; respect prefers-reduced-motion

## File Layout

```
crypt-keeper/
├── index.html           (single HTML file with embedded CSS and JS)
├── app.js               (main application logic, separate for maintainability)
├── style.css            (stylesheets, separate for maintainability)
├── tests/
│   └── test.js          (Node.js test suite using node:test)
├── .kiro/
│   ├── specs/
│   │   └── crypt-keeper/
│   │       ├── requirements.md
│   │       ├── design.md
│   │       └── tasks.md
│   ├── steering/
│   │   ├── product.md
│   │   ├── tech.md
│   │   └── structure.md
│   ├── hooks/
│   │   └── on-file-change.sh (runs tests on source file changes)
├── LICENSE
└── .gitignore
```

Note: For the hackathon, index.html may embed app.js and style.css inline to be truly "single file," or the HTML may link to separate files depending on submission requirements. The spec accommodates both.

## Testing Strategy

### Unit Tests (Node.js, node:test, no dependencies)

1. **Encryption Round-Trip Tests** (property-based)
   - Test: `encrypt(plaintext) -> decrypt(ciphertext) === plaintext`
   - Input variations: empty strings, long strings, special chars, Unicode (emoji, accents)
   - Run 100+ random iterations

2. **Key Derivation Tests**
   - Test: PBKDF2 produces consistent 256-bit key from passphrase + salt
   - Test: Same passphrase + salt = same key (deterministic)
   - Test: Different passphrase = different key

3. **Decryption Failure Tests**
   - Test: Decrypt with wrong key fails (AES-GCM auth tag fails)
   - Test: Decrypt with wrong IV fails
   - Test: Tampered ciphertext fails

4. **Vault State Management**
   - Test: Lock clears decrypted data from memory
   - Test: Unlock re-derives key and decrypts entries
   - Test: Entry add/edit/delete updates localStorage correctly

5. **Timer & Release Logic**
   - Test: Check-in resets lastCheckIn to now
   - Test: Days remaining calculated correctly (now - lastCheckIn vs interval)
   - Test: Release condition triggers when elapsed > interval
   - Test: Demo fast-forward correctly advances lastCheckIn

6. **Export/Import**
   - Test: Export generates valid JSON with all entries and metadata
   - Test: Import restores vault state from JSON file
   - Test: Import with corrupted JSON fails gracefully

7. **Passphrase Change**
   - Test: Old passphrase no longer works after change
   - Test: New passphrase unlocks vault
   - Test: Entries still decrypt correctly after passphrase change

### Integration Tests

- Test: Full flow from creation → unlock → add entry → check-in → release
- Test: Export → lock → import → unlock with original passphrase

### Manual Testing Checklist

- [ ] Vault creation with weak passphrase prevented
- [ ] Unlock with correct passphrase succeeds
- [ ] Unlock with incorrect passphrase shows error
- [ ] Add/edit/delete entries work and persist
- [ ] Heir configuration saves
- [ ] Check-in resets timer
- [ ] Demo fast-forward advances timer
- [ ] Export produces valid JSON file
- [ ] Import from exported file restores state
- [ ] Change passphrase works
- [ ] UI responsive on mobile (320px) and desktop (1024px+)
- [ ] Spooky theme applied correctly
- [ ] All text respects accessibility (contrast, font size)
- [ ] Browser console clean (no errors or warnings)

## Security Considerations

1. **Passphrase Brute-Force Protection**: PBKDF2 with 250k iterations and random salt make brute-force attacks slow and uneconomical.

2. **localStorage Compromise**: If the device is compromised and an attacker gains read access to localStorage, encrypted entries are still protected by the passphrase-derived key. Metadata (heir info, timestamps) is exposed but non-sensitive.

3. **Memory Dumps**: If the attacker can dump process memory while the vault is unlocked, decrypted entries and the derived key may be extractable. The app mitigates by:
   - Clearing decrypted data from memory on lock
   - Not persisting decrypted text to localStorage
   - Using sessionStorage or in-memory variables (cleared on close)

4. **Demo Timer Assurance**: The demo timer is clearly labelled and only modifies client-side localStorage; no actual emails or backend operations occur, eliminating accidental harm.

5. **No Passphrase Recovery**: Design decision: passphrase is intentionally non-recoverable. If forgotten, the vault is inaccessible (unless backed up externally). This prevents backdoor access and ensures user control.

6. **Export File Security**: Exported JSON contains encrypted entries (ciphertext) but also vault metadata and salt. An attacker with the export file and the passphrase could decrypt it. Users are responsible for securing backup files.

## Performance Notes

- **Key Derivation**: ~100-300ms per PBKDF2-SHA-256 with 250k iterations on modern hardware. UI shall show a loading spinner.
- **Encryption/Decryption**: ~1-5ms per entry (WebCrypto is fast).
- **localStorage Size**: Typical encrypted entry ~500-2000 bytes. Most browsers allow 5-10MB, supporting 1000s of entries.
- **No Indexing**: Linear search through entries (acceptable for small to medium vaults; optimizable with indexing if needed in v2).

## Accessibility

- **Keyboard Navigation**: All interactive elements accessible via Tab/Enter/Escape.
- **Screen Reader Support**: Semantic HTML, ARIA labels for form inputs, icon tooltips.
- **Color Contrast**: WCAG AA minimum (4.5:1 for text).
- **Responsive Text**: Minimum 16px on mobile, scalable.
- **Focus Indicators**: Clear, visible focus outlines on interactive elements.
- **Reduced Motion**: Respect `prefers-reduced-motion` media query; disable animations for users who request it.

## Error Handling

- **Invalid Passphrase**: Display error message "Passphrase incorrect" without logging the attempt.
- **Corrupted localStorage**: Attempt recovery; if unrecoverable, prompt user to clear data or import backup.
- **Corrupted Encrypted Entry**: Skip the entry and display a warning; allow user to delete it.
- **Import Failure**: Display specific error (e.g., "Invalid file format", "Version mismatch") and suggest re-exporting or contacting support (if applicable).
- **WebCrypto Not Supported**: Display banner warning and prevent app use (graceful degradation).

## Future Enhancements (v2+)

- Cloud sync (with server-side encrypted backups)
- Multi-device support (sync across devices with end-to-end encryption)
- Second factor auth (TOTP, security key)
- Entry categories and search
- Timed message delivery (send email to heir on date X)
- Multi-heir support
- Advanced permissions (read-only access to heir before death)
- Dark/light theme toggle
- Internationalization (i18n)
