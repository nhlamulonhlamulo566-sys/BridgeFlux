
# BridgeFlux | Global Network Intelligence

Enterprise-grade TCP/HTTP tunneling and edge diagnostics platform.

## Production Status: ACTIVE
- **Core Engine**: Next.js 15 (App Router)
- **Database**: Firebase Firestore (Real-time Mesh Synchronization)
- **Identity**: Device-Level Persistence (MAC-alternative tokens)
- **AI**: Genkit Diagnostic Flows

## Features
- **Persistent Tunnels**: Provision unlimited public endpoints that survive dashboard closures.
- **Service Persistence**: Deploy CLI agents as system-level background services with auto-restart.
- **Live Inspector**: Real-time packet inspection and traffic telemetry.
- **AI Diagnostics**: Intelligent failure analysis for local network and firewall conflicts.

## Getting Started
1. Access the dashboard to generate your unique **Access Key**.
2. Reserve a tunnel or domain.
3. Run the generated CLI command on your local machine to establish the bridge, or use the local installer provided by the running dashboard:
   - `http://localhost:9002/install.sh` for Unix/macOS
   - `http://localhost:9002/install.ps1` for Windows

   ## Local Firebase persistence (optional, recommended for full E2E testing)

   1. Create a Firebase project and a Web app in the Firebase console.
   2. Copy the web app config values into a local `.env.local` file (see `.env.local.example`).
      - Do NOT commit `.env.local` to source control.
      - If your local app requires Firebase admin access, also set `FIREBASE_SERVICE_ACCOUNT_KEY` or `GOOGLE_APPLICATION_CREDENTIALS` in `.env.local`.
      - Example local file path: `GOOGLE_APPLICATION_CREDENTIALS=./studio-7583316153-57312-firebase-adminsdk-fbsvc-e6ce47ddd3.json`
   3. (Optional) To test without a hosted Firebase project, run the Firestore emulator and set `USE_FIREBASE_EMULATOR=true` in `.env.local`.
   4. Start the dev server:

   ```powershell
   npm run dev
   ```

   With Firebase client config present, the dashboard will persist reservations to Firestore and show live updates in the UI.

## Vercel production secrets

To keep production config sync automatic, add the following GitHub repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

The deploy workflow will sync these values into Vercel before every production deployment.

You can also run a manual env sync from GitHub Actions:
- Workflow: `Vercel Env Sync`
- Trigger: Manual dispatch from the Actions tab
- Purpose: rotate or update Vercel Firebase environment variables without redeploying code
- Schedule: daily at 03:00 UTC for automated secret refreshes

You can deploy manually with a separate workflow:
- Workflow: `Vercel Manual Deploy`
- Trigger: Manual dispatch from the Actions tab
- Purpose: push a production build to Vercel without needing a Git push

You can also run a combined manual deploy and env sync workflow:
- Workflow: `Vercel Deploy + Env Sync`
- Trigger: Manual dispatch from the Actions tab
- Purpose: sync Firebase production environment variables into Vercel and then deploy immediately

