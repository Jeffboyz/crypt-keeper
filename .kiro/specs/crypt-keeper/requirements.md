# Crypt Keeper Requirements

## EARS-Style Functional Requirements

### Vault Creation & Authentication

1. **REQ-001 Create Vault**: WHEN the user opens the app for the first time AND no vault exists in localStorage, THEN the app SHALL display a vault creation form requesting a master passphrase (minimum 8 characters) AND confirm passphrase re-entry, AND GIVEN valid input, WHEN the user submits, THEN the app SHALL store an empty vault with metadata (salt, derived key hint) in localStorage AND transition to the locked state.

2. **REQ-002 Passphrase Strength Validation**: WHEN the user enters a passphrase during vault creation, THEN the app SHALL validate minimum length (8 characters) AND provide real-time feedback on passphrase strength (weak/fair/strong based on entropy), AND prevent vault creation with weak passphrases (minimum "fair").

3. **REQ-003 Unlock Vault**: GIVEN a vault exists in localStorage, WHEN the user enters a passphrase on the locked screen, THEN the app SHALL derive the key using PBKDF2-SHA-256 (250,000 iterations, stored salt) AND attempt to decrypt a test entry or verify key derivation, AND IF the passphrase is correct, THEN the app SHALL transition to unlocked state displaying all decrypted entries, AND IF incorrect, THEN the app SHALL display an error message WITHOUT logging the attempt.

4. **REQ-004 Lock Vault**: WHEN the vault is unlocked, THEN the app SHALL display a "Lock" button, AND GIVEN the user clicks it, THEN the app SHALL clear all decrypted data from memory AND return to the locked state.

### Entry Management

5. **REQ-005 Add Entry**: WHEN the vault is unlocked AND the user clicks "Add Entry", THEN the app SHALL display a form with fields: title (text, required), type (dropdown: password/message/wish, required), secret text (textarea, required), AND GIVEN valid input, WHEN the user submits, THEN the app SHALL: (a) generate a random 96-bit IV, (b) encrypt the entry using AES-GCM with the derived key and IV, (c) store the encrypted entry with metadata (IV, title type, createdAt timestamp) in localStorage, (d) display the entry in the vault list.

6. **REQ-006 View Entry**: WHEN the vault is unlocked AND the user selects an entry from the list, THEN the app SHALL: (a) retrieve the encrypted entry AND IV from localStorage, (b) decrypt using AES-GCM with the derived key, (c) display the decrypted title, type, and secret text in a detail view, (d) NOT store decrypted text in localStorage beyond the active session.

7. **REQ-007 Edit Entry**: WHEN the vault is unlocked AND the user clicks "Edit" on an entry, THEN the app SHALL display the entry form pre-populated with current (decrypted) values, AND GIVEN modified input, WHEN the user submits, THEN the app SHALL re-encrypt the entry with a new random IV AND update the stored encrypted entry AND update the modifiedAt timestamp.

8. **REQ-008 Delete Entry**: WHEN the vault is unlocked AND the user clicks "Delete" on an entry, THEN the app SHALL display a confirmation dialog (due to irreversible deletion), AND GIVEN confirmation, THEN the app SHALL remove the entry from localStorage AND update the vault list.

9. **REQ-009 Entry List Display**: WHEN the vault is unlocked, THEN the app SHALL display all entries in a list showing: title, type icon, and a last modified timestamp, sorted by most recent first, AND the list SHALL be updated in real-time as entries are added/edited/deleted.

### Heir & Check-In System

10. **REQ-010 Set Trusted Heir**: WHEN the vault is unlocked AND the user navigates to Settings, THEN the app SHALL display a form to configure: heir name (text, required), heir contact note (text: email/phone/address, required), AND GIVEN valid input, WHEN the user submits, THEN the app SHALL store the heir metadata in localStorage (unencrypted, as it is metadata) with createdAt timestamp.

11. **REQ-011 Set Check-In Interval**: WHEN the vault is unlocked AND heir information is configured, THEN the app SHALL display options to set a check-in interval (7, 14, or 30 days), AND GIVEN a selection, WHEN the user submits, THEN the app SHALL store the interval in localStorage AND initialize a lastCheckIn timestamp to now.

12. **REQ-012 Check-In Button & Timer Display**: WHEN the vault is unlocked AND a check-in interval is configured, THEN the app SHALL: (a) display a "Check In" button prominently, (b) display a status showing days remaining until release (e.g., "14 days remaining"), (c) update the display to reflect elapsed time since lastCheckIn, AND GIVEN the user clicks "Check In", THEN the app SHALL update lastCheckIn to the current timestamp AND reset the days remaining.

13. **REQ-013 Release Condition**: WHEN the check-in interval is configured AND the elapsed time since lastCheckIn exceeds the interval duration, THEN the vault SHALL transition to "released" state AND the app SHALL display a message indicating the vault has been released to the heir with heir contact information (honoring the heir's right to the legacy).

### Demo Simulation

14. **REQ-014 Demo Simulation Control**: WHEN the vault is unlocked AND the user navigates to Settings, THEN the app SHALL display a clearly-labelled "DEMO: Fast-Forward Timer" section (with a disclaimer: "Simulated client-side only, no actual emails sent"), AND the user MAY select a number of days to fast-forward, AND GIVEN submission, THEN the app SHALL advance the lastCheckIn timestamp by that many days in localStorage AND immediately update the days-remaining display to reflect the new elapsed time, allowing the user to demonstrate the release-to-heir flow without waiting.

### Vault Export & Import

15. **REQ-015 Export Vault**: WHEN the vault is unlocked AND the user clicks "Export", THEN the app SHALL generate a JSON file containing: (a) all encrypted entries (with IVs and metadata), (b) vault metadata (salt, heir info if set, check-in interval, lastCheckIn), (c) a version number (e.g., "1.0"), AND the file SHALL be downloaded to the user's device with filename format "crypt-keeper-backup-YYYY-MM-DD.json", AND the user SHALL be able to transfer this file securely offline.

16. **REQ-016 Import Vault**: WHEN the user opens the app, the vault is locked, AND the user clicks "Import", THEN the app SHALL accept a previously exported JSON file, AND GIVEN the file is valid, THEN the app SHALL: (a) validate the version number, (b) restore all encrypted entries, vault metadata, heir info, and check-in state to localStorage, (c) transition to locked state ready for unlock with the original passphrase, AND IF the file is invalid or corrupted, THEN display an error message.

### Passphrase Management

17. **REQ-017 Change Passphrase**: WHEN the vault is unlocked AND the user navigates to Settings, THEN the app SHALL display a "Change Passphrase" form requesting: current passphrase (for verification), new passphrase (with strength validation), and confirm new passphrase, AND GIVEN all fields are valid, WHEN the user submits, THEN the app SHALL: (a) verify the current passphrase is correct, (b) generate a new salt, (c) derive a new key from the new passphrase, (d) decrypt all entries with the old key, (e) re-encrypt all entries with the new key and new random IVs, (f) update the stored salt in localStorage, (g) display a success message.

### UI & UX

18. **REQ-018 Spooky Dark Theme**: The app's visual design SHALL employ a candle-lit, graveyard-polished dark theme with a color palette of dark purples/blacks and gold/amber accents, creating a respectful, Halloween-appropriate aesthetic that honors the purpose of the digital legacy vault. All text SHALL be accessible with sufficient contrast (WCAG AA minimum).

19. **REQ-019 Responsive Design**: The app SHALL be fully responsive on desktop (1024px+) and mobile (320px+) viewports, with touch-friendly button sizes (minimum 44px) on mobile, adapted layouts for small screens, and readable text sizing.

20. **REQ-020 Respectful Tone**: All user-facing text (labels, messages, buttons, help text) SHALL use a respectful, empathetic tone acknowledging the app's purpose as a legacy planning tool, avoiding flippant language or irreverent humor.

### Technical Constraints

21. **REQ-021 Static Single-Page App**: The app SHALL be delivered as a single HTML file (index.html) with embedded or linked CSS (style.css) and JavaScript (app.js), require NO build step, NO backend, NO dependencies, and rely only on browser APIs (WebCrypto, localStorage, fetch for file I/O).

22. **REQ-022 Zero Network**: The app SHALL NOT make any outbound network requests; all operations are client-side only. In particular, the demo timer fast-forward SHALL NOT trigger any email sends or backend state changes.

23. **REQ-023 WebCrypto Encryption**: All encryption and key derivation SHALL use only browser WebCrypto APIs: AES-GCM (256-bit key, 96-bit random IV per entry, 128-bit auth tag) for encryption, PBKDF2-SHA-256 (250,000 iterations, random salt per vault) for key derivation, and Crypto.getRandomValues() for random salt and IV generation.

### Data Persistence & Privacy

24. **REQ-024 Passphrase Never Stored**: The master passphrase SHALL never be stored in localStorage, memory caches, or any other persistent storage; only the derived key (computed at unlock time) and salt SHALL be stored.

25. **REQ-025 localStorage Encryption**: All entry data stored in localStorage (secrets) SHALL be encrypted with AES-GCM; only metadata (timestamps, vault version, heir name/contact, check-in interval, salt) SHALL be stored unencrypted to enable app functionality.

26. **REQ-026 Session Cleanup**: WHEN the user locks the vault or closes the app, THEN all decrypted entry data SHALL be cleared from memory; decrypted text SHALL NOT persist in browser memory after lock.

### Testing

27. **REQ-027 Round-Trip Encryption**: All encryption and decryption paths SHALL be tested with property-based tests: encrypt(plaintext) then decrypt(ciphertext, key, iv) SHALL return plaintext, tested over many random inputs (various string lengths, special characters, Unicode).

28. **REQ-028 Wrong Passphrase Decryption Failure**: GIVEN a vault encrypted with passphrase A, WHEN attempting to decrypt with passphrase B (different), THEN decryption SHALL fail (AES-GCM authentication tag verification fails) and the app SHALL not display decrypted content.

29. **REQ-029 Timer Logic**: Test that: (a) check-in resets lastCheckIn to now, (b) days remaining decreases over time (mocked time), (c) release condition triggers when elapsed time > interval, (d) demo fast-forward correctly advances lastCheckIn by the specified days.

## Non-Functional Requirements

30. **REQ-030 Performance**: Key derivation (PBKDF2 with 250k iterations) MAY take 100-300ms on modern devices; the app SHALL display a loading indicator during this operation. Encryption/decryption of a single entry SHALL complete in <50ms.

31. **REQ-031 Browser Compatibility**: The app SHALL work on modern browsers supporting WebCrypto API (Chrome 37+, Firefox 34+, Safari 11+, Edge 79+); older browsers SHALL see a compatibility warning.

32. **REQ-032 No Third-Party Services**: The app SHALL NOT rely on CDNs, analytics, trackers, or third-party service integrations; all code and assets SHALL be self-contained.
