/**
 * Crypt Keeper - Main Application Logic
 * Client-side encrypted digital legacy vault
 */

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const AppState = {
  // Vault state: 'initial', 'locked', 'unlocked', 'released'
  currentState: 'initial',

  // In-memory decrypted entries (cleared on lock)
  decryptedEntries: [],

  // Derived key (cleared on lock)
  derivedKey: null,

  // Current vault metadata
  vaultMeta: null,

  // Show/hide loading indicator
  isLoading: false,

  // Current screen
  currentScreen: null
};

// localStorage keys
const STORAGE_KEYS = {
  META: 'cryptKeeperMeta',
  ENTRIES: 'cryptKeeperEntries',
  CANARY_CIPHERTEXT: 'cryptKeeperCanary',
  CANARY_IV: 'cryptKeeperCanaryIV'
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate a UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Format date to ISO string
 */
function now() {
  return new Date().toISOString();
}

/**
 * Format date to readable string
 */
function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Calculate passphrase strength (weak/fair/strong)
 */
function calculateStrength(passphrase) {
  let score = 0;
  const length = passphrase.length;

  if (length >= 8) score += 1;
  if (length >= 12) score += 1;
  if (length >= 16) score += 1;

  if (/[a-z]/.test(passphrase)) score += 1;
  if (/[A-Z]/.test(passphrase)) score += 1;
  if (/[0-9]/.test(passphrase)) score += 1;
  if (/[^a-zA-Z0-9]/.test(passphrase)) score += 1;

  if (score >= 4) return 'strong';
  if (score >= 2) return 'fair';
  return 'weak';
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Calculate days remaining
 */
function daysRemaining() {
  const meta = AppState.vaultMeta;
  if (!meta || !meta.checkInInterval || !meta.lastCheckIn) {
    return null;
  }

  const elapsed = Date.now() - new Date(meta.lastCheckIn).getTime();
  const intervalMs = meta.checkInInterval * 24 * 60 * 60 * 1000;
  const remaining = Math.max(0, Math.ceil((intervalMs - elapsed) / (24 * 60 * 60 * 1000)));
  return remaining;
}

/**
 * Check if vault should be released
 */
function shouldRelease() {
  const meta = AppState.vaultMeta;
  if (!meta || !meta.heir || !meta.checkInInterval) {
    return false;
  }

  if (meta.isReleased) {
    return true;
  }

  const elapsed = Date.now() - new Date(meta.lastCheckIn).getTime();
  const intervalMs = meta.checkInInterval * 24 * 60 * 60 * 1000;
  return elapsed > intervalMs;
}

// ============================================================================
// INITIALIZATION & STATE ROUTING
// ============================================================================

/**
 * Initialize app state from localStorage
 */
function initializeApp() {
  const metaJson = localStorage.getItem(STORAGE_KEYS.META);

  if (!metaJson) {
    // No vault exists
    AppState.currentState = 'initial';
    renderVaultCreation();
  } else {
    // Vault exists
    AppState.vaultMeta = JSON.parse(metaJson);

    // Check if vault should be released
    if (shouldRelease()) {
      AppState.currentState = 'released';
      if (!AppState.vaultMeta.isReleased) {
        AppState.vaultMeta.isReleased = true;
        AppState.vaultMeta.releasedAt = now();
        localStorage.setItem(STORAGE_KEYS.META, JSON.stringify(AppState.vaultMeta));
      }
      renderReleased();
    } else {
      AppState.currentState = 'locked';
      renderLocked();
    }
  }
}

/**
 * Transition to a new state and render
 */
function transitionTo(newState) {
  AppState.currentState = newState;

  switch (newState) {
    case 'initial':
      renderVaultCreation();
      break;
    case 'locked':
      renderLocked();
      break;
    case 'unlocked':
      renderUnlocked();
      break;
    case 'released':
      renderReleased();
      break;
  }
}

// ============================================================================
// VAULT CREATION
// ============================================================================

/**
 * Render vault creation screen
 */
function renderVaultCreation() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="vault-container vault-container--creation">
      <header class="vault-header">
        <h1 class="vault-title">🔐 Crypt Keeper</h1>
        <p class="vault-subtitle">Your Digital Legacy Vault</p>
      </header>

      <main class="vault-main">
        <section class="vault-card">
          <h2>Create Your Vault</h2>
          <p class="vault-description">
            Protect your digital legacy with a master passphrase. This passphrase cannot be recovered if forgotten, so choose one you'll remember.
          </p>

          <form id="creation-form" class="vault-form">
            <div class="form-group">
              <label for="creation-passphrase">Master Passphrase</label>
              <input
                type="password"
                id="creation-passphrase"
                placeholder="Enter a strong passphrase"
                required
                minlength="8"
              />
              <small>Minimum 8 characters</small>
            </div>

            <div class="form-group">
              <div class="strength-indicator">
                <span class="strength-label">Strength:</span>
                <div class="strength-bar">
                  <div id="strength-fill" class="strength-fill strength-fill--weak"></div>
                </div>
                <span id="strength-text" class="strength-text">Weak</span>
              </div>
            </div>

            <div class="form-group">
              <label for="creation-confirm">Confirm Passphrase</label>
              <input
                type="password"
                id="creation-confirm"
                placeholder="Re-enter your passphrase"
                required
              />
            </div>

            <button type="submit" id="creation-submit" class="btn btn--primary" disabled>
              Create Vault
            </button>
          </form>

          <div id="creation-error" class="error-message" style="display: none;"></div>
          <div id="creation-loading" class="loading-message" style="display: none;">
            <div class="spinner"></div>
            Deriving key... This may take a moment.
          </div>
        </section>

        <div class="vault-footer">
          <p><strong>Important:</strong> Your passphrase is never stored. If you forget it, your vault will be inaccessible.</p>
        </div>
      </main>
    </div>
  `;

  // Bind events
  const passphraseInput = document.getElementById('creation-passphrase');
  const confirmInput = document.getElementById('creation-confirm');
  const submitBtn = document.getElementById('creation-submit');
  const form = document.getElementById('creation-form');

  const updateStrength = () => {
    const passphrase = passphraseInput.value;
    const strength = calculateStrength(passphrase);
    const fill = document.getElementById('strength-fill');
    const text = document.getElementById('strength-text');

    fill.className = `strength-fill strength-fill--${strength}`;
    text.textContent = strength.charAt(0).toUpperCase() + strength.slice(1);

    // Enable submit only if strength >= fair and passphrases match
    const match = passphrase && passphrase === confirmInput.value;
    const valid = strength !== 'weak' && match && passphrase.length >= 8;
    submitBtn.disabled = !valid;
  };

  passphraseInput.addEventListener('input', updateStrength);
  confirmInput.addEventListener('input', updateStrength);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const passphrase = passphraseInput.value;
    const confirm = confirmInput.value;

    if (passphrase !== confirm) {
      showErrorInElement('Passphrases do not match', 'creation-error');
      return;
    }

    if (calculateStrength(passphrase) === 'weak') {
      showErrorInElement('Passphrase is too weak. Use at least 8 characters with mixed types.', 'creation-error');
      return;
    }

    await createVault(passphrase);
  });
}

/**
 * Create vault: derive key, store salt, create canary
 */
async function createVault(passphrase) {
  const form = document.getElementById('creation-form');
  const errorEl = document.getElementById('creation-error');
  const loadingEl = document.getElementById('creation-loading');

  form.style.display = 'none';
  loadingEl.style.display = 'block';
  errorEl.style.display = 'none';

  try {
    // Derive key from passphrase
    const { key, salt } = await CryptoUtil.deriveKey(passphrase, null, 250000);

    // Create canary
    const { ciphertext: canaryCtx, iv: canaryIV } = await CryptoUtil.encryptCanary(key);

    // Initialize metadata
    const meta = {
      version: '1.0',
      salt: CryptoUtil.uint8ToBase64(salt),
      canary: canaryCtx,
      canaryIV: canaryIV,
      createdAt: now(),
      heir: null,
      checkInInterval: null,
      lastCheckIn: null,
      isReleased: false,
      releasedAt: null
    };

    // Store to localStorage
    localStorage.setItem(STORAGE_KEYS.META, JSON.stringify(meta));
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify([]));

    AppState.vaultMeta = meta;
    AppState.derivedKey = key;
    AppState.decryptedEntries = [];

    transitionTo('unlocked');
  } catch (error) {
    console.error('Vault creation failed:', error);
    showErrorInElement('Vault creation failed. Please try again.', 'creation-error');
    form.style.display = 'block';
    loadingEl.style.display = 'none';
  }
}

// ============================================================================
// UNLOCK
// ============================================================================

/**
 * Render locked screen
 */
function renderLocked() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="vault-container vault-container--locked">
      <header class="vault-header">
        <h1 class="vault-title">🔐 Crypt Keeper</h1>
        <p class="vault-subtitle">Locked</p>
      </header>

      <main class="vault-main">
        <section class="vault-card">
          <h2>Unlock Your Vault</h2>
          <p class="vault-description">
            Enter your master passphrase to access your digital legacy.
          </p>

          <form id="unlock-form" class="vault-form">
            <div class="form-group">
              <label for="unlock-passphrase">Master Passphrase</label>
              <input
                type="password"
                id="unlock-passphrase"
                placeholder="Enter your passphrase"
                required
                autofocus
              />
            </div>

            <button type="submit" id="unlock-submit" class="btn btn--primary">
              Unlock Vault
            </button>
          </form>

          <div id="unlock-error" class="error-message" style="display: none;"></div>
          <div id="unlock-loading" class="loading-message" style="display: none;">
            <div class="spinner"></div>
            Deriving key... This may take a moment.
          </div>

          <div class="vault-actions">
            <button type="button" id="import-btn" class="btn btn--secondary">Import Backup</button>
          </div>
        </section>

        <div class="vault-footer">
          <p>Don't have a vault? <a href="#" id="create-new-link">Create a new one</a></p>
        </div>
      </main>
    </div>
  `;

  // Bind events
  const form = document.getElementById('unlock-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const passphrase = document.getElementById('unlock-passphrase').value;
    await unlockVault(passphrase);
  });

  document.getElementById('import-btn').addEventListener('click', () => {
    importVault();
  });

  document.getElementById('create-new-link').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem(STORAGE_KEYS.META);
    localStorage.removeItem(STORAGE_KEYS.ENTRIES);
    initializeApp();
  });
}

/**
 * Unlock vault: derive key from passphrase and verify with canary
 */
async function unlockVault(passphrase) {
  // Works from both the locked screen ('unlock-form') and the released
  // screen ('unlock-released-form'); the released screen has no loading
  // element, so every element access below is null-guarded.
  const form = document.getElementById('unlock-form') || document.getElementById('unlock-released-form');
  const errorEl = document.getElementById('unlock-error') || document.getElementById('unlock-released-error');
  const loadingEl = document.getElementById('unlock-loading');
  const errorId = errorEl ? errorEl.id : 'unlock-error';

  if (form) form.style.display = 'none';
  if (loadingEl) loadingEl.style.display = 'block';
  if (errorEl) errorEl.style.display = 'none';

  try {
    if (!AppState.vaultMeta) {
      throw new Error('Vault metadata not found');
    }

    // Derive key from passphrase + stored salt
    const saltBase64 = AppState.vaultMeta.salt;
    const salt = CryptoUtil.base64ToUint8(saltBase64);
    const { key } = await CryptoUtil.deriveKey(passphrase, salt, 250000);

    // Verify canary
    const isValid = await CryptoUtil.verifyCanary(
      AppState.vaultMeta.canary,
      AppState.vaultMeta.canaryIV,
      key
    );

    if (!isValid) {
      throw new Error('Passphrase incorrect');
    }

    // Decrypt all entries
    const entriesJson = localStorage.getItem(STORAGE_KEYS.ENTRIES) || '[]';
    const encryptedEntries = JSON.parse(entriesJson);

    const decrypted = [];
    for (const entry of encryptedEntries) {
      try {
        const secret = await CryptoUtil.decryptEntry(entry.ciphertext, entry.iv, key);
        decrypted.push({
          ...entry,
          secret: secret
        });
      } catch (err) {
        console.warn('Failed to decrypt entry:', err);
        // Skip corrupted entries
      }
    }

    // Update app state
    AppState.derivedKey = key;
    AppState.decryptedEntries = decrypted;

    transitionTo('unlocked');
  } catch (error) {
    console.error('Unlock failed:', error);
    showErrorInElement('Passphrase incorrect. Please try again.', errorId);
    if (form) form.style.display = 'block';
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

// ============================================================================
// UNLOCKED STATE
// ============================================================================

/**
 * Render unlocked vault screen
 */
function renderUnlocked() {
  const app = document.getElementById('app');

  const days = daysRemaining();
  const hasCheckIn = AppState.vaultMeta && AppState.vaultMeta.heir && AppState.vaultMeta.checkInInterval;

  let checkInHTML = '';
  if (hasCheckIn) {
    checkInHTML = `
      <section class="check-in-panel">
        <h3>Check-In Status</h3>
        <p class="status-message">${days} days remaining</p>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${Math.min(100, (1 - days / AppState.vaultMeta.checkInInterval) * 100)}%"></div>
        </div>
        <button type="button" id="check-in-btn" class="btn btn--secondary">Check In</button>
      </section>
    `;
  }

  app.innerHTML = `
    <div class="vault-container vault-container--unlocked">
      <header class="vault-header">
        <div class="header-left">
          <h1 class="vault-title">🔐 Crypt Keeper</h1>
          <p class="vault-subtitle">Unlocked</p>
        </div>
        <div class="header-right">
          <button type="button" id="settings-btn" class="btn btn--icon" title="Settings">⚙️</button>
          <button type="button" id="lock-btn" class="btn btn--icon" title="Lock">🔒</button>
        </div>
      </header>

      <main class="vault-main">
        ${checkInHTML}

        <section class="entries-panel">
          <div class="entries-header">
            <h2>Your Entries</h2>
            <button type="button" id="add-entry-btn" class="btn btn--primary">+ Add Entry</button>
          </div>

          <div id="entries-list" class="entries-list">
            <!-- Entries will be inserted here -->
          </div>
        </section>
      </main>
    </div>
  `;

  // Render entries list
  renderEntriesList();

  // Bind events
  document.getElementById('lock-btn').addEventListener('click', () => {
    lockVault();
  });

  document.getElementById('settings-btn').addEventListener('click', () => {
    renderSettings();
  });

  document.getElementById('add-entry-btn').addEventListener('click', () => {
    renderAddEntryForm();
  });

  if (hasCheckIn) {
    document.getElementById('check-in-btn').addEventListener('click', () => {
      performCheckIn();
    });
  }
}

/**
 * Render entries list
 */
function renderEntriesList() {
  const listEl = document.getElementById('entries-list');

  if (AppState.decryptedEntries.length === 0) {
    listEl.innerHTML = '<p class="empty-message">No entries yet. Add one to get started.</p>';
    return;
  }

  // Sort by most recent first
  const sorted = [...AppState.decryptedEntries].sort(
    (a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt)
  );

  const html = sorted.map(entry => {
    const icon = {
      password: '🔑',
      message: '💌',
      wish: '✨'
    }[entry.type] || '📝';

    return `
      <div class="entry-item" data-id="${entry.id}">
        <div class="entry-icon">${icon}</div>
        <div class="entry-info">
          <div class="entry-title">${escapeHtml(entry.title)}</div>
          <div class="entry-type">${entry.type}</div>
          <div class="entry-date">${formatDate(entry.modifiedAt)}</div>
        </div>
        <div class="entry-actions">
          <button type="button" class="entry-view-btn btn btn--tertiary" data-id="${entry.id}">View</button>
          <button type="button" class="entry-delete-btn btn btn--tertiary" data-id="${entry.id}">Delete</button>
        </div>
      </div>
    `;
  }).join('');

  listEl.innerHTML = html;

  // Bind event listeners
  document.querySelectorAll('.entry-view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      renderViewEntry(id);
    });
  });

  document.querySelectorAll('.entry-delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      await deleteEntry(id);
    });
  });
}

/**
 * Render view entry modal
 */
function renderViewEntry(id) {
  const entry = AppState.decryptedEntries.find(e => e.id === id);
  if (!entry) return;

  showModal(`
    <div class="modal-header">
      <h2>${escapeHtml(entry.title)}</h2>
      <button type="button" class="modal-close-btn btn btn--icon">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Type</label>
        <p>${entry.type}</p>
      </div>
      <div class="form-group">
        <label>Secret Text</label>
        <div class="secret-display" id="secret-display">${escapeHtml(entry.secret)}</div>
        <button type="button" id="copy-btn" class="btn btn--secondary">Copy to Clipboard</button>
      </div>
      <div class="form-group">
        <label>Created</label>
        <p>${formatDate(entry.createdAt)}</p>
      </div>
      <div class="form-group">
        <label>Last Modified</label>
        <p>${formatDate(entry.modifiedAt)}</p>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" id="edit-entry-btn" class="btn btn--primary" data-id="${id}">Edit</button>
      <button type="button" class="modal-close-btn btn btn--secondary">Close</button>
    </div>
  `);

  document.getElementById('copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(entry.secret).then(() => {
      showNotification('Copied to clipboard');
    });
  });

  document.getElementById('edit-entry-btn').addEventListener('click', () => {
    closeModal();
    renderEditEntryForm(id);
  });
}

/**
 * Render add entry form
 */
function renderAddEntryForm() {
  showModal(`
    <div class="modal-header">
      <h2>Add Entry</h2>
      <button type="button" class="modal-close-btn btn btn--icon">✕</button>
    </div>
    <form id="add-entry-form" class="modal-body">
      <div class="form-group">
        <label for="entry-title">Title</label>
        <input type="text" id="entry-title" placeholder="e.g., Bank Password" required />
      </div>
      <div class="form-group">
        <label for="entry-type">Type</label>
        <select id="entry-type" required>
          <option value="password">Password</option>
          <option value="message">Final Message</option>
          <option value="wish">Wish</option>
        </select>
      </div>
      <div class="form-group">
        <label for="entry-secret">Secret Text</label>
        <textarea id="entry-secret" placeholder="Enter the secret content" rows="6" required></textarea>
      </div>
    </form>
    <div class="modal-footer">
      <button type="button" id="add-entry-submit" class="btn btn--primary">Add Entry</button>
      <button type="button" class="modal-close-btn btn btn--secondary">Cancel</button>
    </div>
  `);

  document.getElementById('add-entry-submit').addEventListener('click', async () => {
    const title = document.getElementById('entry-title').value;
    const type = document.getElementById('entry-type').value;
    const secret = document.getElementById('entry-secret').value;

    if (!title || !secret) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    await addEntry(title, type, secret);
    closeModal();
  });
}

/**
 * Add entry to vault
 */
async function addEntry(title, type, secret) {
  try {
    const { ciphertext, iv } = await CryptoUtil.encryptEntry(secret, AppState.derivedKey);

    const entry = {
      id: generateUUID(),
      title,
      type,
      ciphertext,
      iv,
      createdAt: now(),
      modifiedAt: now()
    };

    // Store encrypted entry
    const entries = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENTRIES) || '[]');
    entries.push(entry);
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));

    // Add to decrypted list
    AppState.decryptedEntries.push({ ...entry, secret });

    renderEntriesList();
    showNotification('Entry added successfully');
  } catch (error) {
    console.error('Add entry failed:', error);
    showNotification('Failed to add entry', 'error');
  }
}

/**
 * Render edit entry form
 */
function renderEditEntryForm(id) {
  const entry = AppState.decryptedEntries.find(e => e.id === id);
  if (!entry) return;

  showModal(`
    <div class="modal-header">
      <h2>Edit Entry</h2>
      <button type="button" class="modal-close-btn btn btn--icon">✕</button>
    </div>
    <form id="edit-entry-form" class="modal-body">
      <div class="form-group">
        <label for="edit-entry-title">Title</label>
        <input type="text" id="edit-entry-title" value="${escapeHtml(entry.title)}" required />
      </div>
      <div class="form-group">
        <label for="edit-entry-type">Type</label>
        <select id="edit-entry-type" required>
          <option value="password" ${entry.type === 'password' ? 'selected' : ''}>Password</option>
          <option value="message" ${entry.type === 'message' ? 'selected' : ''}>Final Message</option>
          <option value="wish" ${entry.type === 'wish' ? 'selected' : ''}>Wish</option>
        </select>
      </div>
      <div class="form-group">
        <label for="edit-entry-secret">Secret Text</label>
        <textarea id="edit-entry-secret" rows="6" required>${escapeHtml(entry.secret)}</textarea>
      </div>
    </form>
    <div class="modal-footer">
      <button type="button" id="edit-entry-submit" class="btn btn--primary" data-id="${id}">Save Changes</button>
      <button type="button" class="modal-close-btn btn btn--secondary">Cancel</button>
    </div>
  `);

  document.getElementById('edit-entry-submit').addEventListener('click', async () => {
    const title = document.getElementById('edit-entry-title').value;
    const type = document.getElementById('edit-entry-type').value;
    const secret = document.getElementById('edit-entry-secret').value;

    if (!title || !secret) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    await editEntry(id, title, type, secret);
    closeModal();
  });
}

/**
 * Edit entry
 */
async function editEntry(id, title, type, secret) {
  try {
    const { ciphertext, iv } = await CryptoUtil.encryptEntry(secret, AppState.derivedKey);

    const entries = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENTRIES) || '[]');
    const idx = entries.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Entry not found');

    entries[idx] = {
      ...entries[idx],
      title,
      type,
      ciphertext,
      iv,
      modifiedAt: now()
    };

    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));

    // Update decrypted list
    const decIdx = AppState.decryptedEntries.findIndex(e => e.id === id);
    if (decIdx !== -1) {
      AppState.decryptedEntries[decIdx] = { ...entries[idx], secret };
    }

    renderEntriesList();
    showNotification('Entry updated successfully');
  } catch (error) {
    console.error('Edit entry failed:', error);
    showNotification('Failed to update entry', 'error');
  }
}

/**
 * Delete entry
 */
async function deleteEntry(id) {
  if (!confirm('Are you sure you want to delete this entry? This cannot be undone.')) {
    return;
  }

  try {
    const entries = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENTRIES) || '[]');
    const filtered = entries.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(filtered));

    AppState.decryptedEntries = AppState.decryptedEntries.filter(e => e.id !== id);

    renderEntriesList();
    showNotification('Entry deleted');
  } catch (error) {
    console.error('Delete entry failed:', error);
    showNotification('Failed to delete entry', 'error');
  }
}

// ============================================================================
// LOCK
// ============================================================================

/**
 * Lock vault
 */
function lockVault() {
  AppState.derivedKey = null;
  AppState.decryptedEntries = [];
  AppState.vaultMeta = JSON.parse(localStorage.getItem(STORAGE_KEYS.META));

  transitionTo('locked');
  showNotification('Vault locked');
}

// ============================================================================
// SETTINGS
// ============================================================================

/**
 * Render settings screen
 */
function renderSettings() {
  showModal(`
    <div class="modal-header">
      <h2>Settings</h2>
      <button type="button" class="modal-close-btn btn btn--icon">✕</button>
    </div>
    <div class="modal-body settings-body">
      <div id="settings-tabs" class="settings-tabs">
        <button type="button" class="settings-tab-btn active" data-tab="heir">Heir</button>
        <button type="button" class="settings-tab-btn" data-tab="timer">Timer</button>
        <button type="button" class="settings-tab-btn" data-tab="demo">Demo</button>
        <button type="button" class="settings-tab-btn" data-tab="passphrase">Passphrase</button>
        <button type="button" class="settings-tab-btn" data-tab="export">Export/Import</button>
      </div>

      <div id="heir-tab" class="settings-tab active">
        ${renderSettingsHeir()}
      </div>

      <div id="timer-tab" class="settings-tab">
        ${renderSettingsTimer()}
      </div>

      <div id="demo-tab" class="settings-tab">
        ${renderSettingsDemo()}
      </div>

      <div id="passphrase-tab" class="settings-tab">
        ${renderSettingsPassphrase()}
      </div>

      <div id="export-tab" class="settings-tab">
        ${renderSettingsExportImport()}
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="modal-close-btn btn btn--secondary">Close</button>
    </div>
  `);

  // Tab switching
  document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.dataset.tab;
      document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
      document.getElementById(`${tab}-tab`).classList.add('active');
      document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
    });
  });

  rebindSettingsFormListeners();
}

/**
 * Re-render specific settings tabs and rebind their event listeners.
 * Keeps the modal open and preserves the currently active tab.
 * @param {string[]} tabNames - Tab names to re-render (e.g., ['timer', 'demo'])
 */
function rerenderSettingsTabs(tabNames) {
  // Re-render each specified tab
  tabNames.forEach(tabName => {
    const tabEl = document.getElementById(`${tabName}-tab`);
    if (tabEl) {
      let newContent;
      switch (tabName) {
        case 'timer':
          newContent = renderSettingsTimer();
          break;
        case 'demo':
          newContent = renderSettingsDemo();
          break;
        case 'heir':
          newContent = renderSettingsHeir();
          break;
        case 'passphrase':
          newContent = renderSettingsPassphrase();
          break;
        case 'export':
          newContent = renderSettingsExportImport();
          break;
        default:
          return;
      }
      tabEl.innerHTML = newContent;
    }
  });

  // Re-bind event listeners for the re-rendered tabs
  rebindSettingsFormListeners();
}

/**
 * Re-bind event listeners for settings forms after tab re-render.
 * This is called by rerenderSettingsTabs() to attach handlers to newly inserted DOM elements.
 */
function rebindSettingsFormListeners() {
  // Heir form
  const heirForm = document.getElementById('heir-form');
  if (heirForm) {
    heirForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('heir-name').value;
      const contact = document.getElementById('heir-contact').value;
      if (!name || !contact) {
        showNotification('Please fill in all fields', 'error');
        return;
      }
      setHeir(name, contact);
    });
  }

  // Timer form
  const timerForm = document.getElementById('timer-form');
  if (timerForm) {
    timerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const interval = parseInt(document.querySelector('input[name="interval"]:checked').value);
      setCheckInInterval(interval);
    });
  }

  // Demo form
  const demoForm = document.getElementById('demo-form');
  if (demoForm) {
    demoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const days = parseInt(document.getElementById('demo-days').value);
      if (days <= 0) {
        showNotification('Enter a positive number of days', 'error');
        return;
      }
      performDemoFastForward(days);
    });
  }

  // Passphrase form
  const passphraseForm = document.getElementById('passphrase-form');
  if (passphraseForm) {
    const newPassInput = document.getElementById('new-pass');
    const confirmPassInput = document.getElementById('confirm-new-pass');
    const strengthFill = document.getElementById('pass-strength-fill');
    const strengthText = document.getElementById('pass-strength-text');
    const submitBtn = document.getElementById('passphrase-submit');

    const updateStrength = () => {
      const pass = newPassInput.value;
      const strength = calculateStrength(pass);
      strengthFill.className = `strength-fill strength-fill--${strength}`;
      strengthText.textContent = strength.charAt(0).toUpperCase() + strength.slice(1);

      const valid = strength !== 'weak' && pass === confirmPassInput.value && pass.length >= 8;
      submitBtn.disabled = !valid;
    };

    newPassInput.addEventListener('input', updateStrength);
    confirmPassInput.addEventListener('input', updateStrength);

    passphraseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPass = document.getElementById('current-pass').value;
      const newPass = newPassInput.value;
      const confirmPass = confirmPassInput.value;

      if (newPass !== confirmPass) {
        showNotification('New passphrases do not match', 'error');
        return;
      }

      if (calculateStrength(newPass) === 'weak') {
        showNotification('New passphrase is too weak', 'error');
        return;
      }

      await changePassphrase(currentPass, newPass);
    });
  }

  // Export button
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportVault();
    });
  }

  // Import button
  const importInput = document.getElementById('import-file');
  if (importInput) {
    importInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        await importVaultFromFile(file);
      }
    });
  }
}

function renderSettingsHeir() {
  const heir = AppState.vaultMeta.heir;
  if (heir) {
    return `
      <div class="settings-section">
        <h3>Current Heir</h3>
        <p><strong>${escapeHtml(heir.name)}</strong></p>
        <p>${escapeHtml(heir.contact)}</p>
        <p class="small-text">Added: ${formatDate(heir.addedAt)}</p>
        <button type="button" id="clear-heir-btn" class="btn btn--secondary">Clear Heir</button>
      </div>

      <div class="settings-section">
        <h3>Update Heir</h3>
        <form id="heir-form" class="vault-form">
          <div class="form-group">
            <label for="heir-name">Heir Name</label>
            <input type="text" id="heir-name" value="${escapeHtml(heir.name)}" required />
          </div>
          <div class="form-group">
            <label for="heir-contact">Contact (email/phone/address)</label>
            <input type="text" id="heir-contact" value="${escapeHtml(heir.contact)}" required />
          </div>
          <button type="submit" class="btn btn--primary">Update Heir</button>
        </form>
      </div>
    `;
  }

  return `
    <div class="settings-section">
      <h3>Set Trusted Heir</h3>
      <p>Designate a person to receive your digital legacy if you don't check in after the specified interval.</p>
      <form id="heir-form" class="vault-form">
        <div class="form-group">
          <label for="heir-name">Heir Name</label>
          <input type="text" id="heir-name" placeholder="e.g., Alice Smith" required />
        </div>
        <div class="form-group">
          <label for="heir-contact">Contact (email/phone/address)</label>
          <input type="text" id="heir-contact" placeholder="e.g., alice@example.com" required />
        </div>
        <button type="submit" class="btn btn--primary">Set Heir</button>
      </form>
    </div>
  `;
}

function renderSettingsTimer() {
  const hasHeir = AppState.vaultMeta.heir;
  const interval = AppState.vaultMeta.checkInInterval;

  if (!hasHeir) {
    return '<div class="settings-section"><p class="info-message">Set a heir first to configure check-in intervals.</p></div>';
  }

  return `
    <div class="settings-section">
      <h3>Check-In Interval</h3>
      <p>Your vault will be released to your heir if you don't check in for the selected interval.</p>
      <form id="timer-form" class="vault-form">
        <div class="form-group">
          <label>
            <input type="radio" name="interval" value="7" ${interval === 7 ? 'checked' : ''} />
            7 days
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="radio" name="interval" value="14" ${interval === 14 ? 'checked' : ''} />
            14 days
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="radio" name="interval" value="30" ${interval === 30 ? 'checked' : ''} />
            30 days
          </label>
        </div>
        <button type="submit" class="btn btn--primary">Set Interval</button>
      </form>
    </div>
  `;
}

function renderSettingsDemo() {
  const hasInterval = AppState.vaultMeta.checkInInterval;

  if (!hasInterval) {
    return '<div class="settings-section"><p class="info-message">Configure a check-in interval first to use the demo timer.</p></div>';
  }

  return `
    <div class="settings-section">
      <h3>DEMO: Fast-Forward Timer</h3>
      <div class="demo-disclaimer">
        <strong>⚠️ Simulated client-side only.</strong> No actual emails are sent. This allows you to preview the vault release flow.
      </div>
      <form id="demo-form" class="vault-form">
        <div class="form-group">
          <label for="demo-days">Fast-forward by how many days?</label>
          <input type="number" id="demo-days" placeholder="14" min="1" required />
        </div>
        <button type="submit" class="btn btn--primary">Fast-Forward Timer</button>
      </form>
    </div>
  `;
}

function renderSettingsPassphrase() {
  return `
    <div class="settings-section">
      <h3>Change Passphrase</h3>
      <p>Your vault will be re-encrypted with a new passphrase. All entries remain secure.</p>
      <form id="passphrase-form" class="vault-form">
        <div class="form-group">
          <label for="current-pass">Current Passphrase</label>
          <input type="password" id="current-pass" placeholder="Enter current passphrase" required />
        </div>
        <div class="form-group">
          <label for="new-pass">New Passphrase</label>
          <input type="password" id="new-pass" placeholder="Enter new passphrase" required />
          <div class="strength-indicator">
            <span class="strength-label">Strength:</span>
            <div class="strength-bar">
              <div id="pass-strength-fill" class="strength-fill strength-fill--weak"></div>
            </div>
            <span id="pass-strength-text" class="strength-text">Weak</span>
          </div>
        </div>
        <div class="form-group">
          <label for="confirm-new-pass">Confirm New Passphrase</label>
          <input type="password" id="confirm-new-pass" placeholder="Re-enter new passphrase" required />
        </div>
        <button type="submit" id="passphrase-submit" class="btn btn--primary" disabled>Change Passphrase</button>
      </form>
    </div>
  `;
}

function renderSettingsExportImport() {
  const vaultSize = JSON.stringify(AppState.decryptedEntries).length;
  return `
    <div class="settings-section">
      <h3>Export Vault Backup</h3>
      <p>Download an encrypted backup of your vault. Store it in a secure location.</p>
      <p class="small-text">Backup size: ${formatBytes(vaultSize)}</p>
      <button type="button" id="export-btn" class="btn btn--primary">Download Backup</button>
    </div>

    <div class="settings-section">
      <h3>Import Vault Backup</h3>
      <p>Restore a vault from a previously exported backup file.</p>
      <div class="file-input-wrapper">
        <input type="file" id="import-file" accept=".json" />
        <label for="import-file" class="btn btn--secondary">Select File</label>
      </div>
    </div>
  `;
}

function setHeir(name, contact) {
  AppState.vaultMeta.heir = {
    name,
    contact,
    addedAt: now()
  };

  localStorage.setItem(STORAGE_KEYS.META, JSON.stringify(AppState.vaultMeta));
  showNotification('Heir information saved');

  // Re-render Timer and Demo tabs to reflect new state
  rerenderSettingsTabs(['timer', 'demo']);

  // Re-render main unlocked view to show check-in UI if interval already set
  if (AppState.vaultMeta.checkInInterval) {
    renderUnlocked();
  }
}

function setCheckInInterval(interval) {
  AppState.vaultMeta.checkInInterval = interval;
  AppState.vaultMeta.lastCheckIn = now();
  localStorage.setItem(STORAGE_KEYS.META, JSON.stringify(AppState.vaultMeta));
  showNotification(`Check-in interval set to ${interval} days. Timer started.`);

  // Re-render Demo tab to reflect new interval
  rerenderSettingsTabs(['demo']);

  // Re-render main unlocked view to show Check In button and days remaining
  renderUnlocked();
}

function performCheckIn() {
  AppState.vaultMeta.lastCheckIn = now();
  localStorage.setItem(STORAGE_KEYS.META, JSON.stringify(AppState.vaultMeta));
  showNotification('Check-in recorded. Timer reset.');
  renderUnlocked();
}

function performDemoFastForward(days) {
  const lastCheckIn = new Date(AppState.vaultMeta.lastCheckIn);
  lastCheckIn.setDate(lastCheckIn.getDate() - days);
  AppState.vaultMeta.lastCheckIn = lastCheckIn.toISOString();
  localStorage.setItem(STORAGE_KEYS.META, JSON.stringify(AppState.vaultMeta));

  // Check if should release
  if (shouldRelease()) {
    AppState.vaultMeta.isReleased = true;
    AppState.vaultMeta.releasedAt = now();
    localStorage.setItem(STORAGE_KEYS.META, JSON.stringify(AppState.vaultMeta));
    transitionTo('released');
  } else {
    renderUnlocked();
  }

  showNotification(`Timer fast-forwarded by ${days} days.`);
}

async function changePassphrase(currentPass, newPass) {
  try {
    showNotification('Re-encrypting vault...', 'info');

    // Verify current passphrase
    const saltBase64 = AppState.vaultMeta.salt;
    const salt = CryptoUtil.base64ToUint8(saltBase64);
    const { key: currentKey } = await CryptoUtil.deriveKey(currentPass, salt, 250000);

    const isValid = await CryptoUtil.verifyCanary(
      AppState.vaultMeta.canary,
      AppState.vaultMeta.canaryIV,
      currentKey
    );

    if (!isValid) {
      showNotification('Current passphrase is incorrect', 'error');
      return;
    }

    // Derive new key with new salt
    const { key: newKey, salt: newSalt } = await CryptoUtil.deriveKey(newPass, null, 250000);

    // Create new canary
    const { ciphertext: newCanary, iv: newCanaryIV } = await CryptoUtil.encryptCanary(newKey);

    // Re-encrypt all entries with new key
    const entries = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENTRIES) || '[]');
    const reencrypted = [];

    for (const entry of entries) {
      // Decrypt with old key
      const secret = await CryptoUtil.decryptEntry(entry.ciphertext, entry.iv, currentKey);

      // Encrypt with new key
      const { ciphertext, iv } = await CryptoUtil.encryptEntry(secret, newKey);

      reencrypted.push({
        ...entry,
        ciphertext,
        iv,
        modifiedAt: now()
      });
    }

    // Update metadata
    AppState.vaultMeta.salt = CryptoUtil.uint8ToBase64(newSalt);
    AppState.vaultMeta.canary = newCanary;
    AppState.vaultMeta.canaryIV = newCanaryIV;

    // Store to localStorage
    localStorage.setItem(STORAGE_KEYS.META, JSON.stringify(AppState.vaultMeta));
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(reencrypted));

    // Update app state
    AppState.derivedKey = newKey;
    const decryptedEntries = [];
    for (const e of reencrypted) {
      const secret = await CryptoUtil.decryptEntry(e.ciphertext, e.iv, newKey);
      decryptedEntries.push({ ...e, secret });
    }
    AppState.decryptedEntries = decryptedEntries;

    closeModal();
    renderUnlocked();
    showNotification('Passphrase changed successfully');
  } catch (error) {
    console.error('Passphrase change failed:', error);
    showNotification('Failed to change passphrase', 'error');
  }
}

function exportVault() {
  const backup = {
    version: '1.0',
    exportedAt: now(),
    meta: AppState.vaultMeta,
    entries: JSON.parse(localStorage.getItem(STORAGE_KEYS.ENTRIES) || '[]')
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const date = new Date().toISOString().split('T')[0];
  link.download = `crypt-keeper-backup-${date}.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showNotification('Backup downloaded');
}

async function importVault() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      await importVaultFromFile(file);
    }
  });
  input.click();
}

async function importVaultFromFile(file) {
  try {
    const text = await file.text();
    const backup = JSON.parse(text);

    if (!backup.version || backup.version !== '1.0') {
      throw new Error('Invalid backup version');
    }

    if (!backup.meta || !Array.isArray(backup.entries)) {
      throw new Error('Invalid backup format');
    }

    // Store to localStorage
    localStorage.setItem(STORAGE_KEYS.META, JSON.stringify(backup.meta));
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(backup.entries));

    AppState.vaultMeta = backup.meta;
    AppState.derivedKey = null;
    AppState.decryptedEntries = [];

    transitionTo('locked');
    showNotification('Vault imported successfully');
  } catch (error) {
    console.error('Import failed:', error);
    showNotification('Import failed: Invalid file format', 'error');
  }
}

// ============================================================================
// RELEASED STATE
// ============================================================================

/**
 * Render released state screen
 */
function renderReleased() {
  const app = document.getElementById('app');
  const heir = AppState.vaultMeta.heir;

  app.innerHTML = `
    <div class="vault-container vault-container--released">
      <header class="vault-header">
        <h1 class="vault-title">🔐 Crypt Keeper</h1>
        <p class="vault-subtitle">Vault Released</p>
      </header>

      <main class="vault-main">
        <section class="vault-card released-card">
          <h2>Vault Released to Heir</h2>
          <p class="released-message">
            Your vault has been released to your designated heir, honoring your digital legacy.
          </p>

          ${heir ? `
            <div class="heir-info">
              <h3>Heir Information</h3>
              <p><strong>${escapeHtml(heir.name)}</strong></p>
              <p>${escapeHtml(heir.contact)}</p>
              <p class="released-timestamp">Released: ${formatDate(AppState.vaultMeta.releasedAt)}</p>
            </div>
          ` : ''}

          <div class="released-message-box">
            <p>
              You may continue to access your vault by entering your passphrase below.
              Your heir has been designated to receive this information according to your wishes.
            </p>
          </div>

          <form id="unlock-released-form" class="vault-form">
            <div class="form-group">
              <label for="unlock-released-passphrase">Master Passphrase</label>
              <input
                type="password"
                id="unlock-released-passphrase"
                placeholder="Enter your passphrase"
                required
                autofocus
              />
            </div>

            <button type="submit" id="unlock-released-submit" class="btn btn--primary">
              Unlock Vault
            </button>
          </form>

          <div id="unlock-released-error" class="error-message" style="display: none;"></div>
        </section>
      </main>
    </div>
  `;

  document.getElementById('unlock-released-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const passphrase = document.getElementById('unlock-released-passphrase').value;
    await unlockVault(passphrase);
  });
}

// ============================================================================
// UI UTILITIES
// ============================================================================

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function showModal(content) {
  let modalContainer = document.getElementById('modal-container');
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'modal-container';
    document.body.appendChild(modalContainer);
  }

  modalContainer.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal">
      ${content}
    </div>
  `;

  // Make container visible
  modalContainer.style.display = 'block';

  // Bind close buttons
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  // Close on overlay click
  document.querySelector('.modal-overlay').addEventListener('click', closeModal);
}

function closeModal() {
  const modalContainer = document.getElementById('modal-container');
  if (modalContainer) {
    modalContainer.innerHTML = '';
    modalContainer.style.display = 'none';
  }
}

let notificationTimeout;

function showNotification(message, type = 'success') {
  clearTimeout(notificationTimeout);

  let notif = document.getElementById('notification');
  if (!notif) {
    notif = document.createElement('div');
    notif.id = 'notification';
    document.body.appendChild(notif);
  }

  notif.textContent = message;
  notif.className = `notification notification--${type}`;
  notif.style.display = 'block';

  notificationTimeout = setTimeout(() => {
    notif.style.display = 'none';
  }, 3000);
}

function showErrorInElement(message, elementId) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
  }
}

// ============================================================================
// CLEANUP & LISTENERS
// ============================================================================

window.addEventListener('beforeunload', () => {
  AppState.derivedKey = null;
  AppState.decryptedEntries = [];
});

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

// Import CryptoUtil module
// This is loaded separately, see index.html
if (typeof CryptoUtil === 'undefined') {
  console.error('CryptoUtil not loaded');
}
