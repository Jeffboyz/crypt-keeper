# Crypt Keeper — Build Log (Phase 1, v1)

**Project:** Crypt Keeper — client-side AES-GCM encrypted digital-legacy vault (Kiroween 2026, Costume Contest).
**Built:** 2026-11-22 (Phase 1) with **Kiro CLI 3.5.0** (free Builder ID, `jefrimaull17@gmail.com`), model `claude-haiku-4.5`.
**Status:** v1 complete and playtest-verified end-to-end in a real browser. No money spent; the 4,000-credit code had not arrived yet — all work on the free license.

## What v1 does

- Create a vault with a master passphrase (PBKDF2-SHA-256, 250,000 iterations, random salt; AES-GCM 256-bit, random 96-bit IV per entry). Passphrase is never stored; unlock is verified against an encrypted canary. Derived key lives in memory only and is cleared on lock.
- Entry CRUD: passwords / final messages / wishes, encrypted in localStorage (`cryptKeeperMeta`, `cryptKeeperEntries`).
- Trusted heir (name + contact) and check-in interval (7/14/30 days); Check In button + days-remaining display; lock/unlock with wrong-passphrase error.
- DEMO fast-forward control (clearly labelled "Simulated client-side only. No actual emails are sent.") that advances the timer and shows the vault released to the heir.
- Export encrypted vault as JSON + import; change passphrase (re-encrypts all entries with a new salt/key).
- Static, zero-backend, zero-network, no dependencies. Dark purple + gold spooky theme, responsive (desktop + phone).

## How Kiro was used (evidence)

Spec-driven development, all in `/.kiro` at the repo root (never gitignored, per Kiroween rules):

| # | Kiro chat session | Session ID | What it did |
|---|---|---|---|
| 1 | Crypt Keeper Spec: Encrypted Legacy Vault | `sess_e6ecbdaa-2881-4c58-9582-a25444eaba1d` | `.kiro/specs/crypt-keeper/` requirements.md (32 EARS requirements), design.md, tasks.md; `.kiro/steering/` product.md, tech.md, structure.md; `.kiro/hooks/on-file-change.sh` (auto-run tests on file change) |
| 2 | Implement Crypt Keeper Vault Application | `sess_ba3cb920-fd39-4944-831c-2c56ff738f3c` | index.html, style.css, app.js, crypto.js, tests/crypto.test.js, README.md |
| 3 | Fix CryptoUtil Browser Compatibility | `sess_49180b0b-db73-436b-973f-41d00aa03f1e` | Fix 1 (below) |
| 4 | Fix Modal Display Bug in Crypt Keeper | `sess_8044b613-746c-429c-895a-a8a525eca241` | Fix 2 (below) |
| 5 | Fix Stale Settings Tabs In Crypt Keeper | `sess_8055fc7d-03e8-451a-a5cc-ac16851c621e` | Fix 3 (below) |
| 6 | Fix Stale Main View After Check-In Interval Save | `sess_5a0d0bc3-7200-47fe-abd3-0c26c0efd933` | Fix 4 (below) |

Verify sessions with `kiro-cli chat --list-sessions` in this directory. Two spec-wording issues were corrected during implementation (noted in the implementation prompt): the derived key is memory-only (REQ-024 wording was contradictory) and unlock verification uses an encrypted canary (no "derived key hint" is stored).

## Verification (independent of Kiro's own claims)

- **Unit tests:** `node --test tests/crypto.test.js` — **29/29 pass** (run independently, not just Kiro's report). Covers encrypt→decrypt round-trips over random inputs (lengths, Unicode, special chars), wrong-passphrase failure, timer logic, passphrase-change re-encryption, timing.
- **Browser E2E playtest** (headless Chrome 157 via CDP, `file://` URL, desktop 1280×800 + phone 390×844): full flow verified — create vault → add entry → set heir → set 14-day interval → Check In button appears immediately → check-in shows "14 days remaining" → demo fast-forward 30 days → **vault released to heir** (`isReleased=true`, heir name/contact + release date shown). Wrong passphrase shows "Passphrase incorrect" and stays locked; correct passphrase unlocks with the entry visible. Final pass: **zero console errors**.
- **Screenshots:** `docs/screenshots/` (creation screen desktop + phone, released state).

## Bugs found by the playtest and fixed (all via Kiro)

1. **CryptoUtil undefined in browser** — app.js called `CryptoUtil.*` but crypto.js only exported via `module.exports` (Node). Vault creation/unlock/entry creation were all broken at runtime (form rendered, nothing worked). Fix: expose the functions as `window.CryptoUtil` in crypto.js.
2. **Modal never reopens** — `closeModal()` set `display:none` but `showModal()` never reset it, so after the first modal closed, Settings/entry modals were invisible. Fix: `showModal()` sets `display='block'`.
3. **Stale Settings tabs** — all tab panels were rendered once at modal open, so Timer/Demo still said "set a heir first" after the heir was saved. Fix: re-render tabs after heir/interval saves.
4. **Stale main view** — the Check In button is rendered at unlock time, so after setting an interval there was no Check In button until reload. Fix: re-render the unlocked view after interval/heir saves.

## Notes / honest limitations

- `tasks.md` checkboxes were never ticked by Kiro (0/137 checked) even though the work is done and verified — the checkboxes are not a reliable progress signal; the test + playtest results above are.
- The release flow is a **client-side simulation** (no backend, no real email) and the README + UI say so explicitly.
- The UI is clean but visually plain (flat dark purple + gold); more graveyard/candle polish is a Phase 2 item.
- Not yet done: GitHub publish (see below), demo video, Devpost submit.

## What remains (Phase 2, 25–27 Nov)

- Visual polish: candle glow / graveyard motifs, entry detail view check, export/import + change-passphrase browser test.
- GitHub publish to public repo `Jeffboyz/crypt-keeper` — **BLOCKED: `gh` is not authenticated on this VM**; needs his GitHub login (browser) or a token via the secure route. Local repo is committed and ready.
- Demo video (<3 min, public YouTube — his upload step) + Devpost write-up (Kiro usage depth: specs, steering, hooks, PBT, sessions above) + submit by **5 Dec 2026 05:00 WIB**.
- Optional bonus plays: Bonus Blog post, Social Blitz X post (his own words, `#KiroweenHackathon26`).
