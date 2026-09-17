# EP-05: Chat Surface (Governed Chat Surface — the full experience)
**Status:** DECOMPOSED (2026-09-17, DECISION-REGISTER §8 A1) — the full
redact-and-continue experience. Our DOM, our rules.

## Why this epic is now decomposed

The interception decision (§8 A1) makes E5 **the** interception surface that
delivers the designed experience: a browser extension can only reliably
block-and-warn (React/Vue/Svelte serialise component state on submit, so in-place
`element.value` mutation transmits the original), so the full submission-mirror /
redact-and-route / local-rehydration flow lives here, in our own React SPA. The
eventual E1 extension (block-and-warn) is the coverage net; E5 is the product.

E5 is still **pixels over a solved core**: every piece of behaviour-bearing data —
redaction preview, submission-mirror content, restored-span marks, rehydration —
comes from the **E3 core** (`InspectionVerdict` + `AF-307`). What E5 *owns* is the
**view-model + interaction logic** (a composer state machine, mirror/reply view
models, the provider-view toggle, i18n, motion/design tokens, the FP-report flow,
and the two-rooms threshold), decomposed to file level in `APP-FUNCTIONS.md`.

## Framework & language
**React SPA (Vite), TypeScript strict; Vitest** for the pure view-model SW functions
(the bulk of the logic); components are thin `.tsx` over those models. Local
component state + one conversation store, **no global state framework** (locked,
DECISION-REGISTER §3). Design system **Nordic Clarity** (§4 of the Handoff). Files
under `web/src/`. **The authoritative spec is `prototype/NorthGuard Handoff.md`**
(state inventory §1, timings §2, DE/EN strings §3, spacing/type §4); where it and
the prototype HTML disagree, the Handoff wins for behaviour, the HTML for pacing
(§8 A6). The prototype timings are part of the spec — match them.

## What E5 renders (all data comes from E3 `InspectionVerdict` + `AF-307`)

From the design PDFs, the merged direction (§2 "2a") plus rehydration (§3 "3a"):

| State | Rendered from | Source in design |
|-------|---------------|------------------|
| Fresh install — input locked until areas confirmed | E2 activation status | 2a "FRISCHE INSTALLATION" |
| Nothing detected — collapsed mirror, quiet mono line | `verdict:'clean'` | 2a "NICHTS ERKANNT" |
| Touched → redact — submission mirror shows exactly what the provider receives, per-span attribution | `redactedPrompt`, `spans[]` | 2a "GESCHWÄRZT" / 1b "Übermittlung als Spiegel" |
| Blocked — no submission, path forward (remove span / report FP) | `verdict:'block'` | 2a "BLOCKIERT" |
| Degraded — rules-only banner naming outage start, duration, who was notified | `coverage:'rules-only'` | 2b "KI-Prüfung nicht erreichbar" |
| Rehydrated reply — restored spans marked, "N values inserted locally" balance | `AF-307` output | 3a "VOLLSTÄNDIG WIEDERHERGESTELLT" |
| Partial rehydration — unmatched placeholder stays visible (never guessed) | `AF-307.unresolved[]` | 3a "TEILWEISE WIEDERHERGESTELLT" |
| Provider view toggle — the wire transcript, the second transcript made visible | `WireMessage[]` | 3a "ANBIETERSICHT" |
| False-positive report from a span (one action, context automatic) | span → E6 `AF-604` | 2b "FEHLALARM MELDEN" |

## Binding rules the eventual shell must honour
- The submission mirror is a read-only mirror of exactly `redactedPrompt` (FR-08).
- Rehydration uses the client-held mapping only; the shell imports E3's pure
  rehydration module (NG-14) and never sends a restored span upstream (NG-1).
- No individual-level frequency data appears here (NG-13).
- German default; labels wrap; buttons have no fixed width (NG-16).

## Features (decomposed — see `APP-FUNCTIONS.md`)
| ID | Feature | Stories | App Functions | Handoff ref |
|----|---------|---------|---------------|-------------|
| FT-5.1 | Composer state machine (idle→typing→inspecting→clean/touched/blocked/report/degraded/locked) | US-032 | AF-501 | §1.1, §2 |
| FT-5.2 | Submission mirror view-model (read-only mirror of `redactedPrompt`) | US-033 | AF-502 | §1.1, §Spiegel |
| FT-5.3 | Reply rehydration view (full/partial/not-rendered; copy warning) | US-034 | AF-503 | §1.2, §3a |
| FT-5.4 | Provider-view toggle + wire transcript display + footnotes | US-035 | AF-504 | §1.3, §1.4 |
| FT-5.5 | i18n catalogue + three-level language | US-036 | AF-505 | §3, rule 11 |
| FT-5.6 | Motion & design tokens (the prototype timings ARE the spec) | US-037 | AF-506 | §2, §4 |
| FT-5.7 | False-positive report flow (bridges E6 AF-604) | US-038 | AF-507 | §1.1 report, §Meldung |
| FT-5.8 | Two-rooms threshold + management surface shell | US-039 | AF-508 | §threshold, rule 15 |

## Binding rules the shell must honour
- The submission mirror is a **read-only mirror of exactly `redactedPrompt`** (FR-08). No re-derivation, no edits.
- Rehydration uses the **client-held mapping only**; the shell imports E3's pure
  rehydration module (`AF-307`, NG-14) and **never sends a restored span upstream** (NG-1).
- The provider view shows **only the wire transcript** — the one thing that leaves the building, including as history (NG-1, §1.4 footnote).
- **No individual-level frequency data appears here** and the management surface has **no person column** (NG-13).
- German is the default; **labels wrap; buttons have no fixed width** (NG-16). Nothing is ever labelled "sicher/safe/geprüft ✓" — the clean state is "nichts erkannt" (Handoff rule 2).
- The term is **Maskieren** (redact), never "Schwärzen/anonymisieren/REDACTED"; "pseudonymisiert" may appear in evidence/briefing (Handoff rule 16).

## Success Metrics
| Metric | Target |
|--------|--------|
| Submission mirror vs `redactedPrompt` | Byte-identical (read-only mirror, FR-08) |
| Restored span in any outbound payload | 0 (NG-1) |
| Person column / individual frequency in the surface | 0 (NG-13) |
| Timing fidelity to Handoff §2 | Matches (debounce 600 ms, inspection sweep ≥ 400 ms, mirror 240 ms, restore +400 ms) |
| DE/EN string parity | 100% (NG-16) |

## Scope
- **In scope:** the view-model + interaction logic above, decomposed to file level;
  the React components that render those models over the E3 core.
- **Out of scope:** the E3 detection/redaction/rehydration logic (imported, never
  reimplemented); the E1 browser extension (separate surface, decompose after E5);
  deployment/hosting (E8).
- **Reference:** `prototype/NorthGuard Handoff.md` (authoritative behaviour + strings
  + timings), `prototype/NorthGuard Chat.dc.html` / `NorthGuard Prototyp.dc.html` /
  `support.js` (pacing), `prototype/northguard-demo.jsx` (interaction topology).
