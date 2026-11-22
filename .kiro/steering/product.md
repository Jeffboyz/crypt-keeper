# Crypt Keeper Product Vision

## Overview

Crypt Keeper is a respectful, client-side digital legacy vault designed for Kiroween 2026 (Costume Contest category). It enables users to create an encrypted, secure repository of their digital assets—passwords, final messages, and wishes—protected by a master passphrase and accessible only by a trusted heir if the user does not check in after a configured interval.

## Core Insight

Death and digital legacy planning are sensitive, underexplored topics. Most users lack a simple, trustworthy way to pass on their digital assets (passwords, photos, messages) to loved ones. Crypt Keeper provides a Halloween-themed but respectful solution: a digital will for the modern age, guarded by cryptography and trust.

## Product Goals

1. **Security**: Encrypt all user data client-side with industry-standard AES-GCM, ensuring neither Crypt Keeper developers nor any third party can access user secrets.
2. **Simplicity**: Zero backend, zero dependencies, zero setup. Users download or load the app and go.
3. **Privacy**: No analytics, no tracking, no cloud sync. All data stays on the user's device unless explicitly exported.
4. **Respect**: Tone, design, and features honor the gravity of legacy planning without being morbid or sensationalist.
5. **Trust**: Transparent crypto, no hidden complexity, honest about what is and is not protected.

## Target Audience

**Primary**:
- Adults (40+) with non-technical backgrounds seeking a simple way to organize digital assets for heirs
- Tech-savvy users who value privacy and understand cryptography
- Anyone planning for potential incapacity or end-of-life scenarios

**Secondary**:
- Hackathon judges interested in creative, respectful use of client-side crypto
- Cybersecurity educators using Crypt Keeper as a teaching tool for WebCrypto APIs

## Key Features (v1)

1. **Vault Creation**: User creates a vault protected by a master passphrase (PBKDF2-derived key).
2. **Entry Management**: Add, edit, delete encrypted entries (passwords, messages, wishes).
3. **Heir Designation**: Specify a trusted heir (name, contact info).
4. **Check-In Timer**: User selects an interval (7/14/30 days); vault is "released" to heir if user does not check in.
5. **Demo Simulation**: Fast-forward timer to see release flow without waiting (client-side simulation, no emails).
6. **Export/Import**: Backup and restore encrypted vaults as JSON files.
7. **Passphrase Change**: Re-encrypt vault with a new passphrase.
8. **Spooky UI**: Dark, candle-lit, graveyard-themed design with gold accents.

## Design Principles

### Empathy & Respect
- Language is empathetic and avoids flippancy.
- Design honors the purpose: legacy planning for loved ones.
- No Dark Souls-style "edgy" humor; genuine respect for the user's intent.

### Transparency
- Users understand what is encrypted and what is not.
- Security rationale is documented; no opaque claims.
- Demo timer is clearly labeled; users know it is simulated.

### Simplicity
- Features are ruthlessly prioritized; v1 is minimal.
- No unnecessary settings or complexity.
- Single-page app with clear information hierarchy.

### Trust & Control
- No cloud, no backend, no third-party services.
- Passphrase is never stored; if forgotten, vault is inaccessible (by design).
- User fully controls backup and restoration via exported JSON files.

## User Journeys

### Journey 1: First-Time Setup
1. User opens app → sees vault creation screen.
2. User enters passphrase (strength indicator guides them).
3. User confirms passphrase.
4. Vault created; user is now unlocked in empty vault.
5. User adds a few test entries (password for bank, final message for spouse, wishes).

### Journey 2: Daily Use
1. User opens app → enters passphrase → vault unlocked.
2. User views entries as needed (reads stored passwords, messages).
3. User makes edits to entries.
4. User locks vault when done.

### Journey 3: Check-In & Heir Designation
1. User opens app → unlocks vault.
2. User navigates to Settings.
3. User adds heir info (Alice, email: alice@example.com).
4. User selects check-in interval (14 days).
5. Check-in timer initializes; user sees "14 days remaining."
6. User clicks "Check In" (e.g., monthly reminder); timer resets.

### Journey 4: Demo Release Flow
1. User opens app → unlocked.
2. User goes to Settings → "DEMO: Fast-Forward Timer".
3. User enters "14 days" and clicks fast-forward.
4. App advances timer; vault transitions to "Released" state.
5. User sees "Vault Released to Heir" message with Alice's contact info.
6. User can show this to others or screenshot for proof-of-concept.

### Journey 5: Backup & Restore
1. User unlocks vault.
2. User goes to Settings → "Export" → downloads JSON file.
3. User stores file in secure location (external drive, password manager backup, etc.).
4. Months later, user factory-resets phone.
5. User opens app, goes to Settings → "Import", selects the JSON file.
6. Vault and all entries are restored.
7. User unlocks with original passphrase.

## Tone & Voice

- **Respectful**: Acknowledge the gravity of the feature without being heavy-handed.
- **Clear**: Avoid jargon; explain security concepts in plain language.
- **Honest**: Be upfront about limitations ("Simulated client-side only"; "No backend emails").
- **Empathetic**: Recognize that users are planning for difficult scenarios; be supportive.

### Example Messaging

**Good**: "Your vault will be released to [heir name] if you don't check in after [interval]. This is a reminder to stay connected with them. You can change your heir or interval anytime."

**Bad**: "LOL your tomb awaits!" or "Prepare for digital death!"

## Success Metrics (Kiroween 2026)

- **Functional**: All 32 requirements implemented and tested.
- **Technical**: Zero network requests, no external dependencies, zero build step.
- **UX**: Spooky theme applied, responsive on mobile and desktop, accessible (WCAG AA).
- **Demo**: Timer fast-forward convincingly shows release flow; judges can understand the feature in 2 minutes.
- **Scope**: Complete v1 in hackathon timeframe; no half-baked features.

## Out of Scope (v1)

- Multi-device sync or cloud backup (v2+)
- Second factor authentication (v2+)
- Biometric unlock (v2+)
- Multiple heirs or permission levels (v2+)
- Search or categorization (v2+)
- Dark/light theme toggle (v1 is dark-only)
- Internationalization (v2+)
- Mobile app (web-only for v1)
- Real email delivery to heir (v2+ with backend)

## Competitive Differentiation

- **vs. Password managers**: Crypt Keeper focuses on legacy planning, not daily password management; it's designed as a will, not a vault.
- **vs. Cloud backup services**: No account, no server, no data collection; purely client-side.
- **vs. Manual approaches** (spreadsheet, note): Encrypted, tamper-evident, with an automated release trigger.

## Accessibility & Inclusivity

- Designed for users of varying tech literacy; no assumptions of crypto knowledge.
- Responsive design works on old phones and new devices.
- Screen reader support for visually impaired users.
- Sufficient color contrast; readable fonts.
- Keyboard-navigable for users without mouse/touch.

## Security & Privacy Stance

- **Cryptographic**: AES-GCM (industry standard), PBKDF2 (NIST recommended), random salts/IVs.
- **No backdoor**: If passphrase is lost, vault is inaccessible; this is intentional.
- **No tracking**: No analytics, no ads, no third-party integrations.
- **Open design**: Code is readable; security is verifiable (no obfuscation).
- **Limitations**: Client-side encryption means device compromise exposes decrypted data; users are responsible for device security and backup security.

## Vision for Beyond Kiroween

If Crypt Keeper gains traction post-hackathon, potential directions:

1. **Trust Network**: Allow multiple heirs, permissions (read-only before death, full access after trigger).
2. **Scheduled Releases**: "Release this message to Mom on my 65th birthday."
3. **Timed Delivery**: Backend-less approximation: user pre-signs a message; heir can claim it after date via IPFS or similar.
4. **Legal Integration**: Partner with estate planning services or lawyers to integrate Crypt Keeper into formal will process.
5. **Community Ledger**: Optional public registry (with user consent) of legacy vaults, preserving internet culture and history.

---

## Summary

Crypt Keeper is a respectful, secure, and simple tool for digital legacy planning. It combines respectful tone, transparent cryptography, and spooky design to make an often-avoided topic (preparing one's digital legacy) approachable and actionable.
