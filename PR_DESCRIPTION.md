Title: Production hardening — Firestore rules, CI, envs, release

Summary:
- Secure Firestore rules (require authentication and enforce `userId`).
- Re-enable TypeScript/ESLint checks by default.
- Move Firebase config to `NEXT_PUBLIC_` env vars and add `.env.example`.
- Fix layout export/type issues by extracting session context and initializing Firebase client-only.
- Add GitHub Actions CI (`ci.yml`) and Release (`release.yml`) workflows.

Testing:
- `npm ci && npm run lint && npm run typecheck && npm run build` completes locally.
- Build artifacts and checksums are produced via `scripts/publish.sh`.

Notes:
- `npm audit` still reports transitive vulnerabilities (see audit report). Consider upgrading `genkit` and Google Cloud dependencies or running `npm audit fix --force` in a separate branch and thoroughly testing.
