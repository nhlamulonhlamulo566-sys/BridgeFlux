# Changes

All changes in the `security-hardening` batch:

- Secure Firestore rules to require authentication and enforce `userId` ownership.
- Re-enabled TypeScript and ESLint checks by default in `next.config.ts`.
- Migrated Firebase client config to environment variables (`NEXT_PUBLIC_FIREBASE_*`).
- Extracted session `TokenContext` into `src/lib/session.tsx` and updated imports.
- Initialized Firebase client on the browser only in `src/app/layout.tsx` to avoid prerender errors.
- Added CI workflow `ci.yml` to run lint, typecheck, build, and audit.
- Added `release.yml` workflow to package and publish installers and checksums.
