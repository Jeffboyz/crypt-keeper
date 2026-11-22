# Crypt Keeper Project Structure

## Directory Layout

```
crypt-keeper/
├── index.html                      # Main HTML file (entry point)
├── app.js                          # Application logic (separate or embedded)
├── style.css                       # Stylesheets (separate or embedded)
├── tests/
│   └── test.js                     # Node.js test suite (node:test)
├── .kiro/
│   ├── specs/
│   │   └── crypt-keeper/
│   │       ├── requirements.md     # EARS-style functional requirements
│   │       ├── design.md           # Architecture, crypto design, data model
│   │       └── tasks.md            # Numbered implementation tasks
│   ├── steering/
│   │   ├── product.md              # Product vision, goals, tone
│   │   ├── tech.md                 # Tech stack, security rules, conventions
│   │   └── structure.md            # This file
│   └── hooks/
│       └── on-file-change.sh       # Auto-run tests on source file changes
├── .gitignore                      # Git ignore rules
└── LICENSE                         # License (MIT or similar)
```

## File Purposes

### Core Application Files

#### index.html
- **Purpose**: Single entry point; contains (or links to) all HTML, CSS, and JS.
- **Scope**: Semantic HTML structure, meta tags, accessibility attributes.
- **Size**: For hackathon, may embed app.js and style.css inline to create a single-file distribution.
- **Linked resources**: None (no external CDNs or assets).
- **Example structure**:
  ```html
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Crypt Keeper - Digital Legacy Vault</title>
    <style>/* app.css embedded or linked */</style>
  </head>
  <body>
    <div id="app"></div>
    <script>/* app.js embedded or linked */</script>
  </body>
  </html>
  ```

#### app.js
- **Purpose**: Main application logic, state management, event handlers.
- **Responsibilities**:
  - Crypto utilities (key derivation, encryption, decryption)
  - State machine (Initial → Locked → Unlocked → Released)
  - Entry management (CRUD operations)
  - Heir & timer logic
  - UI rendering and event binding
  - localStorage interaction
- **Modules/Sections** (suggested organization within file or as separate files if not embedded):
  - `CryptoUtil` - AES-GCM, PBKDF2, random generation
  - `VaultState` - vault metadata, entries, state transitions
  - `UI` - rendering screens, form handlers
  - `Timer` - check-in logic, release condition
- **Exports**: None (single entry point); all logic contained within file scope.

#### style.css
- **Purpose**: All visual styling; no preprocessor.
- **Features**:
  - CSS variables for colors, spacing, fonts
  - Mobile-first responsive design
  - Dark theme (purple-black, gold accents)
  - Accessibility features (contrast, focus indicators)
  - Animations (candle flicker, fade-in)
  - Print styles (optional; export readability)
- **No imports** from external sources.

### Testing Files

#### tests/test.js
- **Purpose**: Node.js test suite using `node:test` (no external dependencies).
- **Scope**: Unit tests for crypto, state management, timer logic, export/import.
- **Running**: `node tests/test.js`
- **Output**: Pass/fail summary, coverage reporting (manual or via V8).
- **Structure**:
  ```javascript
  import test from 'node:test';
  import assert from 'node:assert';
  // Import app functions (if modular) or copy crypto utils
  
  test('crypto: encrypt then decrypt returns plaintext', async (t) => {
    // Test implementation
  });
  ```

### Kiro Configuration Files

#### .kiro/specs/crypt-keeper/requirements.md
- **Purpose**: EARS-style functional requirements (32 total).
- **Format**: Numbered, testable, requirement-specific (not design-specific).
- **Usage**: Reference during implementation; link tests to requirement numbers.

#### .kiro/specs/crypt-keeper/design.md
- **Purpose**: Architecture, cryptographic design, data model, UI structure, testing strategy.
- **Format**: Prose with diagrams (ASCII or markdown tables).
- **Usage**: Design review, architectural decisions, future reference.

#### .kiro/specs/crypt-keeper/tasks.md
- **Purpose**: Implementation roadmap with 28 numbered tasks, organized by phase.
- **Format**: Checklist-style; each task has subtasks and references to requirements.
- **Usage**: Track progress, assign work, verify completion.

#### .kiro/steering/product.md
- **Purpose**: Product vision, goals, user journeys, tone, target audience.
- **Format**: Prose with examples and scenario descriptions.
- **Usage**: Maintain product focus; guide feature prioritization and messaging.

#### .kiro/steering/tech.md
- **Purpose**: Tech stack, security rules (30+ rules), code conventions, testing strategy.
- **Format**: Numbered rules with rationale, examples, and testing instructions.
- **Usage**: Code review checklist, security verification, onboarding new contributors.

#### .kiro/steering/structure.md
- **Purpose**: This file; project structure, file purposes, conventions, workflows.
- **Format**: Structured reference with examples.
- **Usage**: Navigation and understanding project organization.

#### .kiro/hooks/on-file-change.sh
- **Purpose**: Kiro hook to auto-run tests whenever source files change.
- **Trigger**: File save in app.js or tests/test.js.
- **Action**: Run `node tests/test.js` and report results.
- **Format**: Native Kiro hook syntax (kiro-cli 3.5.0+).

### Repo & License

#### .gitignore
- **Purpose**: Ignore non-essential files from version control.
- **Typical entries**:
  ```
  node_modules/
  .DS_Store
  *.log
  dist/
  .env
  *.swp
  .vscode/
  ```
- **Note**: No build artifacts should be generated (zero build step).

#### LICENSE
- **Purpose**: Legal license for code distribution.
- **Recommendation**: MIT (permissive, hackathon-friendly) or Apache 2.0.

---

## Code Organization Conventions

### JavaScript Structure (Within app.js or modular sections)

#### 1. Crypto Module
```javascript
const CryptoUtil = {
  // PBKDF2-SHA-256 key derivation
  deriveKey: async (passphrase, salt, iterations = 250000) => { ... },
  
  // AES-GCM encryption
  encrypt: async (plaintext, key) => { ... },
  
  // AES-GCM decryption
  decrypt: async (ciphertext, iv, key) => { ... },
  
  // Random generation
  generateSalt: (length = 32) => { ... },
  generateIV: () => { ... }
};
```

#### 2. Vault State Module
```javascript
const VaultState = {
  // Initialize empty vault
  createVault: () => { ... },
  
  // Read/write metadata
  getMeta: () => { ... },
  setMeta: (meta) => { ... },
  
  // Read/write entries
  getEntries: () => { ... },
  setEntries: (entries) => { ... },
  
  // Entry CRUD
  addEntry: (entry) => { ... },
  updateEntry: (id, updates) => { ... },
  deleteEntry: (id) => { ... },
  
  // Clear sensitive data
  clearDecrypted: () => { ... }
};
```

#### 3. UI Module
```javascript
const UI = {
  // Screen rendering
  renderVaultCreation: () => { ... },
  renderLocked: () => { ... },
  renderUnlocked: () => { ... },
  renderReleased: () => { ... },
  
  // Form handlers
  onCreateVault: (passphrase, confirm) => { ... },
  onUnlock: (passphrase) => { ... },
  onAddEntry: (title, type, secret) => { ... },
  
  // Utilities
  showError: (message) => { ... },
  showSuccess: (message) => { ... },
  showLoading: (show) => { ... }
};
```

#### 4. Timer Module
```javascript
const Timer = {
  // Get days remaining
  getDaysRemaining: () => { ... },
  
  // Check-in handler
  checkIn: () => { ... },
  
  // Release condition
  shouldRelease: () => { ... },
  
  // Demo fast-forward
  fastForward: (days) => { ... }
};
```

#### 5. App Initialization
```javascript
const App = {
  init: () => {
    // Detect if vault exists
    // Route to appropriate screen
    // Bind event listeners
  }
};

// Entry point
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
```

### CSS Class Naming Convention

**BEM (Block Element Modifier) Style**:
```css
/* Blocks (main component) */
.vault-container { ... }
.entry-list { ... }
.settings-form { ... }

/* Elements (parts of block) */
.entry-list__item { ... }
.entry-list__item-title { ... }
.settings-form__input { ... }

/* Modifiers (state or variant) */
.entry-list__item--selected { ... }
.settings-form__input--error { ... }
.vault-container--released { ... }
```

**Alternative (Simpler) Style** (acceptable for small projects):
```css
.vault-header { ... }
.vault-header-title { ... }
.vault-header.unlocked { ... }

.entry-item { ... }
.entry-item.selected { ... }
```

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Functions | camelCase, verb-first | `deriveKey()`, `encryptEntry()`, `onCheckIn()` |
| Constants | UPPER_SNAKE_CASE | `PBKDF2_ITERATIONS`, `AUTH_TAG_LENGTH` |
| Variables | camelCase | `vaultMeta`, `decryptedEntries`, `isLocked` |
| CSS classes | kebab-case | `.vault-header`, `.entry-list`, `.demo-control` |
| HTML IDs | kebab-case | `#passphrase-input`, `#check-in-button` |
| Booleans | is/has prefix | `isLocked`, `hasHeir`, `canRelease` |

---

## Workflow & Development Process

### Adding a Feature

1. **Spec Phase**:
   - Update `.kiro/specs/crypt-keeper/requirements.md` with new requirement(s).
   - Update `.kiro/specs/crypt-keeper/design.md` if architecture changes.
   - Add task(s) to `.kiro/specs/crypt-keeper/tasks.md`.

2. **Design Phase**:
   - Review requirements and design with the team.
   - Identify which module(s) need changes.
   - Plan test cases.

3. **Implementation Phase**:
   - Write test(s) first (TDD approach).
   - Implement feature in app.js.
   - Ensure tests pass: `node tests/test.js`.
   - Update UI if needed.

4. **Review Phase**:
   - Manual testing on browser (desktop and mobile).
   - Verify accessibility (keyboard, screen reader, contrast).
   - Run security checklist from `.kiro/steering/tech.md`.
   - Code review for naming, comments, organization.

5. **Completion Phase**:
   - Mark task checkbox in `tasks.md`.
   - Commit changes with descriptive message.
   - Verify no temporary files are left.

### Debugging & Testing Locally

```bash
# Run all tests
node tests/test.js

# Run tests and watch for changes (requires nodemon or similar)
# For this project, rely on .kiro/hooks/on-file-change.sh

# Open app in browser
open index.html
# or
firefox index.html
# or navigate to local file in any browser

# Inspect localStorage
# Browser DevTools > Application > localStorage > crypt-keeper

# Check for console errors
# Browser DevTools > Console
```

### Git Workflow

- **Branch**: Create feature branch: `git checkout -b feat/add-passphrase-change`
- **Commit**: Descriptive messages: `git commit -m "feat: implement passphrase change with re-encryption"`
- **Push**: `git push -u origin feat/add-passphrase-change`
- **PR**: Create pull request with description referencing requirements.
- **Merge**: After review and tests pass.

---

## Documentation Standards

### JSDoc Comments

All functions SHALL have JSDoc headers:

```javascript
/**
 * Derives a cryptographic key from a user passphrase using PBKDF2-SHA-256.
 * 
 * @param {string} passphrase - The user's master passphrase (not stored).
 * @param {Uint8Array|null} salt - Random salt (32 bytes); if null, generates new.
 * @param {number} [iterations=250000] - Number of PBKDF2 iterations.
 * @returns {Promise<{key: CryptoKey, salt: Uint8Array}>} Derived key and salt.
 * @throws {Error} If passphrase is empty or derivation fails.
 * 
 * @example
 * const { key, salt } = await CryptoUtil.deriveKey('MyPassphrase123!');
 * // Store salt; reuse for subsequent unlocks.
 */
async function deriveKey(passphrase, salt = null, iterations = 250000) {
  // Implementation...
}
```

### Inline Comments

Use sparingly; code should be self-documenting. Comment complex logic:

```javascript
// Generate random 96-bit IV for AES-GCM (required for each encryption)
const iv = crypto.getRandomValues(new Uint8Array(12));

// Verify passphrase by attempting to decrypt a known entry or metadata test
const testEntry = /* ... */;
try {
  await CryptoUtil.decrypt(testEntry.ciphertext, testEntry.iv, derivedKey);
  // Passphrase correct; proceed
} catch {
  // Passphrase incorrect; show error
}
```

### README (Optional but Recommended)

Create a `README.md` at project root:

```markdown
# Crypt Keeper

A client-side, encrypted digital legacy vault. Store passwords, messages, and wishes 
protected by a master passphrase. Designed to be released to a trusted heir if you 
don't check in after a specified interval.

## Features

- AES-GCM encryption (client-side only)
- No backend, no dependencies, no build step
- Heir designation and check-in timer
- Export/import encrypted backups
- Spooky dark theme

## Getting Started

1. Open `index.html` in a modern browser.
2. Create a vault with a strong passphrase.
3. Add entries (passwords, messages, wishes).
4. Set a trusted heir and check-in interval.

## Security

- All encryption happens in the browser using WebCrypto APIs.
- Passphrases are never stored or transmitted.
- See `tech.md` for detailed security analysis.

## Testing

```bash
node tests/test.js
```

## License

MIT

## Disclaimer

This is a hackathon project. For production use of digital legacy planning, 
consult legal and estate planning professionals.
```

---

## Quality Gates & Checklists

### Pre-Commit Checklist

- [ ] All tests pass: `node tests/test.js`
- [ ] No console errors (manual browser inspection)
- [ ] No temporary files left (*.tmp, debug logs, etc.)
- [ ] Code follows naming and style conventions
- [ ] JSDoc comments added or updated
- [ ] Commit message is descriptive and references requirement(s)

### Pre-Release Checklist (Before Hackathon Submission)

- [ ] All 32 requirements implemented and tested
- [ ] All 28 implementation tasks completed
- [ ] Manual QA checklist from design.md completed
- [ ] Security checklist from tech.md passed
- [ ] No build step required; app loads with `open index.html`
- [ ] Responsive on mobile (320px) and desktop (1024px+)
- [ ] Accessibility verified (keyboard nav, screen reader, contrast)
- [ ] Browser console clean (no errors or warnings)
- [ ] README or submission documentation complete
- [ ] Code is well-commented and maintainable
- [ ] Demo scenarios tested (create vault → check-in → release)

---

## File Size Guidelines

| File | Target Size | Rationale |
|------|-------------|-----------|
| index.html | <50 KB | Single entry point; keep lean |
| app.js | <50 KB | Single-page logic; modular organization |
| style.css | <20 KB | No image assets; CSS variables for theming |
| tests/test.js | <30 KB | Comprehensive but focused unit tests |
| Total (embedded) | <100 KB | Reasonable for a single-file distribution |

---

## Future Extensibility

### Adding a New Entry Type (v2)

1. Update `requirements.md` with new type (e.g., "document").
2. Add type to entry type enum in `design.md`.
3. Add CSS styling for new icon in `style.css`.
4. Update `UI.renderEntryForm()` if type has special handling.
5. Add tests for round-trip encryption of new type.
6. Update export/import to handle new type.

### Adding Multi-Heir Support (v2)

1. Update `VaultState` to manage `heirs[]` array instead of single heir.
2. Update UI to add/remove/edit multiple heirs.
3. Update timer logic to release to each heir independently.
4. Add tests for multi-heir release scenarios.
5. Update export/import schema.

### Migrating to a Build Step (v2+, if needed)

1. Introduce a build tool (Vite, esbuild) to bundle and minify.
2. Move to TypeScript for type safety.
3. Add linting (ESLint, Prettier).
4. Update test runner and CI/CD.
5. Maintain zero external runtime dependencies (only dev dependencies).

---

## Summary

Crypt Keeper's project structure is intentionally flat and transparent: all code is reviewable, all tests are runnable, and all configuration is explicit. The organization prioritizes clarity and security over abstraction. Contributors should follow naming conventions, add documentation, and verify tests pass before committing.
