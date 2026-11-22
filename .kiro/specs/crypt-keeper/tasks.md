# Crypt Keeper Implementation Tasks

## Phase 1: Core Infrastructure & Cryptography

### Task 1: Set up project files
- [ ] Create `index.html` with HTML scaffold, meta tags (viewport, charset), and placeholder for app
- [ ] Create `app.js` with app state object and initialization function
- [ ] Create `style.css` with base styles, color variables, and responsive media queries
- [ ] Create `tests/test.js` with Node.js test harness using node:test
- [ ] Verify all files are reachable and basic structure loads
- **References**: REQ-021, REQ-032

### Task 2: Implement WebCrypto utilities module
- [ ] Create crypto utilities for PBKDF2-SHA-256 key derivation
  - [ ] Function: `deriveKey(passphrase, salt, iterations)` returns Promise<CryptoKey>
  - [ ] Generate random salt if not provided (32 bytes)
  - [ ] Return both key and salt for storage
- [ ] Create crypto utilities for AES-GCM encryption
  - [ ] Function: `encryptEntry(plaintext, key)` returns Promise<{ciphertext, iv}>
  - [ ] Generate random 96-bit IV per call
  - [ ] Return Base64-encoded ciphertext and IV
- [ ] Create crypto utilities for AES-GCM decryption
  - [ ] Function: `decryptEntry(ciphertext, iv, key)` returns Promise<plaintext>
  - [ ] Handle decryption errors (wrong key/IV/tampered ciphertext)
- [ ] Write unit tests
  - [ ] Test: `encryptEntry` → `decryptEntry` returns original plaintext (round-trip)
  - [ ] Test: Round-trip with various inputs (empty, long, special chars, Unicode)
  - [ ] Test: `decryptEntry` fails with wrong key
  - [ ] Test: `decryptEntry` fails with wrong IV
  - [ ] Test: Key derivation is deterministic (same passphrase + salt = same key)
- **References**: REQ-023, REQ-027, REQ-028

### Task 3: Implement localStorage schema and state management
- [ ] Define and document localStorage structure (cryptKeeperMeta, cryptKeeperEntries)
- [ ] Create functions to read/write vault metadata
- [ ] Create functions to read/write entries (encrypted)
- [ ] Create function to clear sensitive data from memory
- [ ] Initialize vault state object with defaults
- [ ] Write tests
  - [ ] Test: Metadata persists and reads back correctly
  - [ ] Test: Entries persist and read back correctly
  - [ ] Test: Sensitive data clears from memory on lock
- **References**: REQ-024, REQ-025, REQ-026

## Phase 2: Vault Creation & Authentication

### Task 4: Implement vault creation flow
- [ ] Build vault creation screen UI (HTML structure)
- [ ] Add form inputs: passphrase, confirm passphrase
- [ ] Implement passphrase strength validator
  - [ ] Minimum 8 characters
  - [ ] Calculate entropy (weak/fair/strong based on character types and length)
  - [ ] Disable "Create" button until strength >= "fair"
  - [ ] Show real-time strength indicator
- [ ] Implement form submission
  - [ ] Verify passphrases match
  - [ ] Call PBKDF2 to derive key and generate salt
  - [ ] Store salt in cryptKeeperMeta
  - [ ] Create empty vault (cryptKeeperEntries = [])
  - [ ] Transition to unlocked state
- [ ] Add loading indicator during key derivation
- [ ] Write tests
  - [ ] Test: Weak passphrase rejects creation
  - [ ] Test: Non-matching passphrases reject creation
  - [ ] Test: Valid passphrase creates vault and transitions to unlocked state
- **References**: REQ-001, REQ-002, REQ-030

### Task 5: Implement unlock flow
- [ ] Build locked screen UI
  - [ ] Display passphrase input
  - [ ] Unlock button
  - [ ] Error message area
  - [ ] Import button (for later)
- [ ] Implement unlock handler
  - [ ] Read salt from cryptKeeperMeta
  - [ ] Derive key from entered passphrase + salt
  - [ ] Decrypt all entries (verify at least one succeeds or all are empty)
  - [ ] Store decrypted entries in memory (NOT localStorage)
  - [ ] Transition to unlocked state
- [ ] Implement error handling: wrong passphrase shows "Passphrase incorrect" (no logging)
- [ ] Add loading indicator during key derivation
- [ ] Write tests
  - [ ] Test: Correct passphrase unlocks vault
  - [ ] Test: Wrong passphrase shows error and stays locked
  - [ ] Test: Decrypted entries are in memory, not localStorage
- **References**: REQ-003, REQ-030

### Task 6: Implement lock flow
- [ ] Add "Lock" button to unlocked state UI
- [ ] Implement lock handler
  - [ ] Clear all decrypted entry data from memory
  - [ ] Clear derived key from memory
  - [ ] Transition to locked state
  - [ ] Clear any session variables
- [ ] Write tests
  - [ ] Test: Lock clears decrypted data
  - [ ] Test: Lock transitions to locked screen
- **References**: REQ-004, REQ-026

## Phase 3: Entry Management

### Task 7: Implement add entry flow
- [ ] Build entry form UI (title, type dropdown, secret text textarea)
- [ ] Add "Add Entry" button to vault home screen
- [ ] Implement form submission
  - [ ] Validate inputs (all required)
  - [ ] Generate random IV (handled by crypto utils)
  - [ ] Encrypt entry with AES-GCM
  - [ ] Generate UUID for entry
  - [ ] Create entry object with metadata (createdAt, modifiedAt)
  - [ ] Add to cryptKeeperEntries in localStorage
  - [ ] Add to in-memory decrypted entries list
  - [ ] Close form, refresh entry list display
- [ ] Write tests
  - [ ] Test: Entry added to localStorage encrypted
  - [ ] Test: Entry appears in decrypted list in memory
  - [ ] Test: Each encryption gets unique IV
- **References**: REQ-005, REQ-009

### Task 8: Implement view entry flow
- [ ] Build entry detail view UI (read-only display of title, type, secret)
- [ ] Implement entry selection handler
  - [ ] Decrypt entry from stored ciphertext
  - [ ] Display in detail view modal or side panel
  - [ ] Do NOT store decrypted text in localStorage
- [ ] Write tests
  - [ ] Test: Entry decrypts correctly when viewed
  - [ ] Test: Decrypted text not in localStorage
- **References**: REQ-006

### Task 9: Implement edit entry flow
- [ ] Add "Edit" button to entry view
- [ ] Build entry edit form (pre-populate with decrypted values)
- [ ] Implement form submission
  - [ ] Validate inputs
  - [ ] Encrypt new values with new random IV
  - [ ] Update entry in cryptKeeperEntries
  - [ ] Update modifiedAt timestamp
  - [ ] Refresh entry list display
- [ ] Write tests
  - [ ] Test: Entry edits and re-encrypts correctly
  - [ ] Test: New IV generated for edited entry
  - [ ] Test: modifiedAt timestamp updates
- **References**: REQ-007

### Task 10: Implement delete entry flow
- [ ] Add "Delete" button to entry view
- [ ] Show confirmation dialog before deletion
- [ ] Implement deletion handler
  - [ ] Remove entry from cryptKeeperEntries
  - [ ] Remove from in-memory decrypted list
  - [ ] Refresh entry list display
- [ ] Write tests
  - [ ] Test: Entry deleted from localStorage
  - [ ] Test: Entry removed from displayed list
- **References**: REQ-008

### Task 11: Implement entry list display
- [ ] Build entry list UI showing: title, type icon, modified date
- [ ] Sort entries by most recent first
- [ ] Implement real-time update (on add/edit/delete)
- [ ] Add type icons (key for password, envelope for message, candle for wish)
- [ ] Write tests
  - [ ] Test: Entries display in correct order
  - [ ] Test: List updates when entries change
- **References**: REQ-009

## Phase 4: Heir & Check-In System

### Task 12: Implement heir configuration
- [ ] Build heir settings form (name, contact)
- [ ] Add form to Settings screen
- [ ] Implement form submission
  - [ ] Validate inputs
  - [ ] Store heir metadata in cryptKeeperMeta (unencrypted)
  - [ ] Store createdAt timestamp
  - [ ] Show confirmation message
- [ ] Add button to view/edit existing heir info
- [ ] Write tests
  - [ ] Test: Heir data persists to localStorage
  - [ ] Test: Heir data reads back correctly
- **References**: REQ-010

### Task 13: Implement check-in interval configuration
- [ ] Build interval selector UI (radio buttons: 7/14/30 days)
- [ ] Add to Settings screen
- [ ] Implement selection handler
  - [ ] Store interval in cryptKeeperMeta
  - [ ] Initialize lastCheckIn to now
  - [ ] Show confirmation message
- [ ] Prevent interval change if heir not set (show prompt)
- [ ] Write tests
  - [ ] Test: Interval stores correctly
  - [ ] Test: lastCheckIn initialized to now
- **References**: REQ-011

### Task 14: Implement check-in button and timer display
- [ ] Build check-in status panel UI
  - [ ] Display "X days remaining" message
  - [ ] Progress indicator (visual bar or text)
  - [ ] "Check In" button
- [ ] Add panel to vault home screen (only if heir + interval configured)
- [ ] Implement days-remaining calculation
  - [ ] Calculate elapsed time: now - lastCheckIn
  - [ ] Calculate days remaining: interval - (elapsed / 86400000)
  - [ ] Update display real-time (or on page load)
- [ ] Implement check-in handler
  - [ ] Update lastCheckIn to now
  - [ ] Recalculate and update display
  - [ ] Store to cryptKeeperMeta
- [ ] Write tests
  - [ ] Test: Days remaining calculated correctly
  - [ ] Test: Check-in resets lastCheckIn to now
  - [ ] Test: Display updates after check-in
- **References**: REQ-012

### Task 15: Implement release condition and released state
- [ ] Add release check on app initialization and periodically
  - [ ] Check if heir + interval configured
  - [ ] Check if elapsed time > interval
  - [ ] If true, set isReleased = true and releasedAt = now in cryptKeeperMeta
- [ ] Build released state screen
  - [ ] Display "Vault Released to Heir" message
  - [ ] Display heir name and contact information
  - [ ] Allow continuing to use vault with passphrase
- [ ] Update app routing to show released screen when applicable
- [ ] Write tests
  - [ ] Test: Release condition triggers when elapsed > interval
  - [ ] Test: Released state persists (isReleased = true)
- **References**: REQ-013

### Task 16: Implement demo timer fast-forward
- [ ] Build demo control UI in Settings
  - [ ] Clearly labelled "DEMO: Fast-Forward Timer"
  - [ ] Disclaimer: "Simulated client-side only, no actual emails sent"
  - [ ] Number input (days to advance)
  - [ ] "Fast-Forward" button
- [ ] Implement fast-forward handler
  - [ ] Read current lastCheckIn
  - [ ] Subtract the input days (convert to milliseconds)
  - [ ] Update lastCheckIn in cryptKeeperMeta
  - [ ] Recalculate days remaining and update display
  - [ ] If new elapsed > interval, trigger release state
- [ ] Write tests
  - [ ] Test: Fast-forward advances lastCheckIn by specified days
  - [ ] Test: Release condition triggers after fast-forward
  - [ ] Test: No network requests made (demo is client-side only)
- **References**: REQ-014, REQ-022

## Phase 5: Export, Import & Passphrase Management

### Task 17: Implement vault export
- [ ] Build export UI button in Settings
- [ ] Implement export handler
  - [ ] Gather all encrypted entries from localStorage
  - [ ] Gather vault metadata
  - [ ] Create export object with version, exportedAt, meta, entries
  - [ ] Serialize to JSON
  - [ ] Generate filename: "crypt-keeper-backup-YYYY-MM-DD.json"
  - [ ] Trigger browser download
- [ ] Write tests
  - [ ] Test: Export generates valid JSON
  - [ ] Test: All entries included in export
  - [ ] Test: Export can be serialized and deserialized
- **References**: REQ-015

### Task 18: Implement vault import
- [ ] Build import UI button on locked screen
- [ ] Implement file picker and import handler
  - [ ] Accept JSON file upload
  - [ ] Parse JSON
  - [ ] Validate version number
  - [ ] Restore metadata to cryptKeeperMeta
  - [ ] Restore entries to cryptKeeperEntries
  - [ ] Show success message
  - [ ] Transition to locked state
- [ ] Implement error handling for invalid files
  - [ ] Show error message with details
  - [ ] Suggest re-exporting or troubleshooting
- [ ] Write tests
  - [ ] Test: Valid export file imports successfully
  - [ ] Test: Invalid JSON fails gracefully
  - [ ] Test: Version mismatch fails gracefully
  - [ ] Test: Imported vault can be unlocked with original passphrase
- **References**: REQ-016

### Task 19: Implement passphrase change
- [ ] Build "Change Passphrase" form in Settings
  - [ ] Current passphrase input
  - [ ] New passphrase input (with strength indicator)
  - [ ] Confirm new passphrase input
  - [ ] "Change" button
- [ ] Implement form submission
  - [ ] Verify current passphrase (derive key, attempt to decrypt test entry)
  - [ ] If verification fails, show error and stop
  - [ ] Generate new salt
  - [ ] Derive new key from new passphrase + new salt
  - [ ] Decrypt all entries with old key
  - [ ] Re-encrypt all entries with new key and new random IVs
  - [ ] Update salt in cryptKeeperMeta
  - [ ] Show success message
- [ ] Add loading indicator during re-encryption
- [ ] Write tests
  - [ ] Test: Old passphrase fails after change
  - [ ] Test: New passphrase unlocks vault
  - [ ] Test: Entries still decrypt correctly after change
  - [ ] Test: Each re-encrypted entry gets new IV
- **References**: REQ-017, REQ-030

## Phase 6: UI & Styling

### Task 20: Implement responsive layout
- [ ] Define responsive breakpoints (mobile <640px, tablet 640-1024px, desktop >1024px)
- [ ] Build mobile-first CSS with media queries
- [ ] Ensure touch-friendly button sizes (44px minimum on mobile)
- [ ] Adapt layouts for small screens (stack vertically, reduce padding)
- [ ] Test on mobile (320px) and desktop (1024px+) viewports
- [ ] Write manual tests
  - [ ] Test: Buttons easily tappable on mobile
  - [ ] Test: Layout doesn't overflow on 320px screens
  - [ ] Test: Text readable on all screen sizes
- **References**: REQ-019

### Task 21: Implement spooky dark theme
- [ ] Define CSS color variables for theme
  - [ ] Primary background: deep purple-black
  - [ ] Accent: gold/amber
  - [ ] Text: light gray/white
  - [ ] Error: crimson
  - [ ] Success: sage green
- [ ] Apply theme to all UI elements
- [ ] Add candle flicker animation (CSS keyframes)
- [ ] Style inputs, buttons, modals with theme
- [ ] Ensure sufficient color contrast (WCAG AA)
- [ ] Add subtle shadows and gradients for depth
- [ ] Write manual tests
  - [ ] Test: Theme applied consistently
  - [ ] Test: Color contrast meets WCAG AA
- **References**: REQ-018, REQ-031

### Task 22: Implement accessibility features
- [ ] Add semantic HTML structure (nav, main, section, form, etc.)
- [ ] Add ARIA labels to inputs and interactive elements
- [ ] Implement keyboard navigation (Tab through all interactive elements)
- [ ] Add visible focus indicators on all focusable elements
- [ ] Respect `prefers-reduced-motion` media query (disable animations)
- [ ] Ensure minimum font size 16px on mobile
- [ ] Add icon tooltips for screen reader users
- [ ] Write manual tests
  - [ ] Test: Tab through all elements
  - [ ] Test: Screen reader reads labels correctly
  - [ ] Test: Animations disabled with prefers-reduced-motion
- **References**: REQ-020

### Task 23: Implement respectful tone and messaging
- [ ] Review all user-facing text (labels, buttons, messages, help text)
- [ ] Ensure tone is empathetic, respectful, and appropriate for a legacy planning tool
- [ ] Remove any flippant or irreverent language
- [ ] Add help text explaining the purpose of each feature
- [ ] Test readability and appropriateness
- **References**: REQ-020

## Phase 7: Testing & Quality Assurance

### Task 24: Complete unit test suite
- [ ] Ensure all crypto functions have comprehensive tests
- [ ] Ensure all vault state management has tests
- [ ] Ensure all timer/release logic has tests
- [ ] Ensure all export/import logic has tests
- [ ] Run test suite with Node.js
- [ ] Target: >90% code coverage (excluding UI rendering)
- **References**: REQ-027, REQ-028, REQ-029

### Task 25: Manual QA and browser testing
- [ ] Create QA checklist (see Design Document for full list)
- [ ] Test on Chrome, Firefox, Safari (if available)
- [ ] Test on desktop and mobile viewports
- [ ] Verify no console errors or warnings
- [ ] Test edge cases (empty vault, very long entry text, rapid operations)
- [ ] Verify performance (PBKDF2 timing, encryption/decryption speed)
- **References**: REQ-030, REQ-031

### Task 26: Documentation and comments
- [ ] Add JSDoc comments to all functions
- [ ] Document crypto design and security considerations
- [ ] Add inline comments for complex logic
- [ ] Create README with usage instructions and security notes
- **References**: N/A

## Phase 8: Finalization

### Task 27: Clean up and optimization
- [ ] Remove console.log statements (except error logging)
- [ ] Minify CSS and JS (optional for hackathon; may embed in HTML)
- [ ] Optimize images/assets for size
- [ ] Verify localStorage data is clean and minimal
- [ ] Test performance on lower-end devices (if possible)

### Task 28: Final verification and submission prep
- [ ] Verify all requirements (REQ-001 through REQ-032) are implemented
- [ ] Ensure no build step required (pure HTML/CSS/JS)
- [ ] Verify no external dependencies or network requests
- [ ] Create installation/setup instructions
- [ ] Prepare demo scenarios (vault creation, check-in, release, export/import)
- [ ] Test demo timer fast-forward to show release flow
- [ ] Final code review
- [ ] Commit and prepare for submission

---

## Notes

- **Task interdependencies**: Later phases depend on earlier ones. E.g., Task 7-11 depend on Tasks 2-3.
- **Parallel work**: UI tasks (Task 20-23) can be started earlier alongside core functionality.
- **Test-driven approach**: Tests are referenced in each task; writing tests alongside implementation is encouraged.
- **Checkboxes**: Tick off subtasks as they are completed to track progress.
