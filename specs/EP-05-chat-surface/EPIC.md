# EP-05: Chat Surface
**Status:** DEFERRED — rendering shell only, not decomposed.

## Why this epic is not decomposed

If interception becomes a browser extension, the "chat surface" is an overlay in
the host tool's DOM, not a bespoke SPA. The *rendering* is therefore
architecture-dependent and waits on the interception decision (see E1). Crucially,
all of E5's **logic** — redaction preview data, submission-mirror content,
restored-span marks, rehydration — is produced by the **E3 core** and is built and
headless-testable now. E5, whenever built, is pixels over a solved core.

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

## Scope
- **Out of scope (now):** all rendering. Deferred with E1/E8.
- **Reference:** `../../inputs/northguard/prototype/northguard-demo.jsx` (in-browser
  demo topology) shows the intended interaction; production shell reuses the E3 core.
