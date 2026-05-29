**BridgeFlux: Live App & PowerShell Usage Guide**

This document explains how to use the deployed BridgeFlux web app together with the Windows PowerShell agent stub. It covers installation, activation, verification, troubleshooting, and developer notes. It assumes you have a working checkout of the repository and access to the deployed app (for example https://bridge-flux.vercel.app).

**Quick Summary**
- **Purpose:** Activate a local service (e.g. a web server on port 3000) as a globally reachable BridgeFlux tunnel using the CLI stub and the live web app.
- **Key requirement:** Always provide `--base <app-origin>` to the `bridgeflux connect` command so the CLI notifies the cloud backend.

**Prerequisites**
- **Windows:** PowerShell 5.1+ (Windows 10/11) or PowerShell Core.
- **Node:** for local development and editing the repo (optional for the live flow).
- **Vercel account:** to deploy updates to the live app (if you're publishing changes).
- **Firebase admin credentials:** required only if you run server-side admin code locally or in the deployed app. For the live Vercel deployment, set `FIREBASE_SERVICE_ACCOUNT_KEY` to the full JSON content of your service account file, not just the filename. Use `GOOGLE_APPLICATION_CREDENTIALS` locally if you prefer a file path. Do NOT commit secrets to git.
  - Example local service account filename: `studio-7583316153-57312-firebase-adminsdk-fbsvc-e6ce47ddd3.json`

**Relevant repo files**
- Web UI generator: [src/components/tools/TerminalGenerator.tsx](src/components/tools/TerminalGenerator.tsx)
- Tunnel UI and Setup Agent dialog: [src/components/tunnels/ActiveTunnelList.tsx](src/components/tunnels/ActiveTunnelList.tsx)
- CLI stub distributed by the installer: [public/bridgeflux.js](public/bridgeflux.js)
- PowerShell installer script: [public/install.ps1](public/install.ps1)
- Backend activation route: [src/app/api/agent/connect/route.ts](src/app/api/agent/connect/route.ts)

**1) Deploying the web app (optional)**
If you modified source and want the live website to reflect changes, push to the repo and deploy to Vercel.

Commands (from repository root):
```powershell
git add -A
git commit -m "Your changes"
git push origin <branch>
npx vercel --prod --yes
```

Notes: `npx vercel` requires you to be logged in to Vercel. The `--yes` flag skips interactive confirmation.

**1.1) Configure the Firebase admin secret on Vercel**
For the live app to activate tunnels, Vercel must have access to your Firebase admin credentials.

- In the Vercel dashboard, open your project settings.
- Go to **Environment Variables**.
- Add a new variable named `FIREBASE_SERVICE_ACCOUNT_KEY`.
- Paste the entire JSON contents of your service account file into the value field.
- Deploy the app again after saving.

If you prefer CLI automation and are logged in with Vercel CLI, use the helper script:
```powershell
.\scripts\set-vercel-firebase-secret.ps1 -ServiceAccountPath "C:\path\to\studio-...firebase-adminsdk...json"
```

This script prints the JSON and an optional helper command for `npx vercel env add`.

**2) Installing the Windows CLI stub**
You can install the CLI shim by executing the PowerShell installer from the live app origin.

Elevated (recommended) via the UI example (opens an elevated PowerShell):
```powershell
powershell.exe -Command "Start-Process powershell.exe -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-NoExit','-Command','iwr -useb https://bridge-flux.vercel.app/install.ps1 | iex' -Verb RunAs"
```

Non-elevated (manual):
```powershell
iwr -useb https://bridge-flux.vercel.app/install.ps1 | iex
```

What this does: downloads `install.ps1` from the app and writes a small Node-based CLI shim to `%LOCALAPPDATA%\Microsoft\WindowsApps\bridgeflux.cmd` (or System32 when elevated). The shim executable is implemented by [public/bridgeflux.js](public/bridgeflux.js).

**3) Running the CLI `connect` command (activate a tunnel)**
Always include `--base <origin>` so the CLI notifies the cloud backend. Example commands:

Non-elevated (PowerShell):
```powershell
bridgeflux connect --port 3000 --token bf_live_guest_0xYOURTOKEN --base https://bridge-flux.vercel.app
```

Elevated (from the UI example using Start-Process):
```powershell
powershell.exe -Command "Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-NoExit','-Command','bridgeflux connect --port 3000 --token bf_live_guest_0xYOURTOKEN --base https://bridge-flux.vercel.app' -Verb RunAs"
```

Note: `Start-Process` launches a new elevated PowerShell window and returns immediately. If the window closes too fast, use `-NoExit` or check the local CLI logs with `bridgeflux logs` or `Get-Content "$env:USERPROFILE\.bridgeflux\bridgeflux.log" -Tail 50`.

Daemon / service mode (PowerShell elevated):
```powershell
powershell.exe -Command "Start-Process -FilePath 'bridgeflux' -ArgumentList 'connect','--port','3000','--token','bf_live_guest_0xYOURTOKEN','--base','https://bridge-flux.vercel.app','--daemon' -WindowStyle Hidden -Verb RunAs"
```

Linux / macOS (example):
```bash
curl -sL https://bridge-flux.vercel.app/install.sh | sudo bash -s -- https://bridge-flux.vercel.app
nohup bridgeflux connect --port 3000 --token BF_GUEST_KEY --base https://bridge-flux.vercel.app --daemon > bridgeflux.log 2>&1 &
```

Notes:
- `--token` should match a `tunnel.userId` in Firestore for automatic activation, or you can provide an explicit `--tunnel-id` if available.
- The backend now accepts payloads without `tunnelId` and will attempt to match a unique tunnel document using `userId == token` and `localPort == port` as a fallback. See [src/app/api/agent/connect/route.ts](src/app/api/agent/connect/route.ts).

**4) What the CLI notifies the backend**
When `--base` is present the CLI sends a POST to `/api/agent/connect` on the app origin with payload:
```json
{ "token": "bf_live_guest_0x...", "port": 3000, "latency": "12ms", "tunnelId": "optional-id" }
```

The backend will update the matching tunnel's `latency`, `agentConnected`, `status`, and `lastSeen` fields.

**5) Verifying activation in the UI**
- Open the app Active Tunnels page: https://bridge-flux.vercel.app/tunnels
- Find your tunnel row (filter box available) and confirm the status changes from `Awaiting CLI` to `Streaming` or the `agentConnected` indicator flips to LIVE.
- The Setup Agent dialog in the UI shows the exact commands to copy. We updated the UI to include `--base` where required. See [src/components/tunnels/ActiveTunnelList.tsx](src/components/tunnels/ActiveTunnelList.tsx) and [src/components/tools/TerminalGenerator.tsx](src/components/tools/TerminalGenerator.tsx).

**6) Inspecting local CLI logs**
- The CLI stub writes logs to the user home folder: `%USERPROFILE%\.bridgeflux\bridgeflux.log` on Windows.

Example (PowerShell):
```powershell
Get-Content "$env:USERPROFILE\.bridgeflux\bridgeflux.log" -Tail 50
```

Log entries show connect attempts and whether `--base` was provided. The CLI will warn locally when `--base` is missing.

**7) Creating or matching a tunnel document in Firestore**
If the backend fails to auto-match by `token`+`port`, create a tunnel doc with these minimum fields (via Firebase console or server script):

Example document JSON (collection: `tunnels`):
```json
{
  "name": "My Local App",
  "subdomain": "my-local-app",
  "publicUrl": "my-local-app.flux.io",
  "publicPort": 443,
  "localPort": 3000,
  "status": "pending",
  "type": "HTTP",
  "latency": "---",
  "bandwidth": "0.0 KB/s",
  "userId": "bf_live_guest_0xYOURTOKEN",
  "agentConnected": false,
  "createdAt": { "_type": "serverTimestamp" }
}
```

After the CLI notifies the backend with the matching `token` and `port`, the server will flip `agentConnected` to `true` and `status` to `active`.

**8) Troubleshooting**
- CLI prints: `⚠️ BridgeFlux CLI stub: no --base provided.` — re-run with `--base` pointing at the app origin.
- Backend returns `No matching tunnel found` — ensure `userId` equals the `--token` value and `localPort` matches; or provide `--tunnel-id` explicitly.
- If the app UI does not update: the deployed site might be an older build. Redeploy the site (see section 1) or use the `Inspect` deployment URL returned by Vercel when you deploy.
- If Firestore admin access is required locally, set `FIREBASE_SERVICE_ACCOUNT_KEY` or `GOOGLE_APPLICATION_CREDENTIALS` to a service account JSON and restart any local server processes.
  - Example: `GOOGLE_APPLICATION_CREDENTIALS=./studio-7583316153-57312-firebase-adminsdk-fbsvc-e6ce47ddd3.json`
- For the live app, ensure the deployed Vercel project has Firebase admin credentials configured. Missing admin credentials can cause `/api/agent/connect` to return HTTP 500 even if the UI is otherwise reachable.
- To get a more detailed error response while troubleshooting, set `BRIDGEFLUX_DEBUG=true` in the app environment and redeploy.

**9) Developer notes & safety**
- The CLI stub is intentionally simple and does not open actual tunnels — it only notifies the backend for UI/testing. Real agent binaries are out of scope for the repo's public installer scripts.
- Do not store service account JSON in git. Use environment secrets in Vercel or local environment variables.

**10) Quick checklist (copy & run)**
```powershell
# 1) Install stub
iwr -useb https://bridge-flux.vercel.app/install.ps1 | iex

# 2) Run connect with base (example)
bridgeflux connect --port 3000 --token bf_live_guest_0xYOURTOKEN --base https://bridge-flux.vercel.app

# 3) Check local logs
Get-Content "$env:USERPROFILE\.bridgeflux\bridgeflux.log" -Tail 50

# 4) Verify UI
# Open: https://bridge-flux.vercel.app/tunnels and confirm the tunnel status flips to LIVE
```

If you want, I can also add a short PowerShell script to automate install+connect+verification steps locally — tell me the default `port` and `token` you prefer and I will add it under `scripts/`.

----
Document created: `docs/LIVE_APP_POWERSHELL_GUIDE.md`
