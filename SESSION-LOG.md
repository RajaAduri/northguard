# NorthGuard — Build Session Log

Continuous build from the amended specs (Part B). One line per story: story · outcome · surprises.
Scaffolding: `core/` (TS strict + Vitest, Node 24), `recurring/` (pytest, Py 3.13). Hooks are configured for a session started inside `inputs/northGuard/`; this session runs from the repo root, so manifests are self-enforced (only manifest paths touched; TDD red→green; NG invariants checked per story).

- **Scaffold** · done · `core/` package.json+tsconfig(strict, noUncheckedIndexedAccess)+vitest; `recurring/` pyproject+package. `npm install` clean (dev-dep audit warnings ignored — not shipped).
- **US-013** ledger append + NG-19 actor guard · ✅ 19 tests green, tsc clean · red-first confirmed. NG-5: append is fsync'd + single-writer-locked, write failure throws, `entry2.prevHash === entry1.hash`. NG-19: `assertNoPlaintextActor` rejects `user`/`userId`/`email`-shaped keys before any write. Decision: `appendLedgerEntry(e)` keeps the spec's single-arg signature; ledger path resolves from `NORTHGUARD_LEDGER_PATH` env with a `setLedgerPath()` test seam (path isn't on the entry). Canonical hash = sorted-key recursive stringify, chained `sha256(prevHash + canonical)`.
