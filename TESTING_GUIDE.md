# BridgeFlux Live App Testing - Quick Reference Guide

## Overview
Complete test suite for verifying BridgeFlux live application functionality.

---

## Prerequisites
- Node.js 18+ (for npm)
- PowerShell 5.1+
- Dashboard running on http://localhost:9002
- Internet connection (for Firebase/Firestore)

---

## Quick Start Tests

### 1. Start the Development Server
```powershell
cd c:\Users\Health\Desktop\BridgeFlux
npm run dev
```
**Expected:** Dashboard loads at http://localhost:9002

---

### 2. Run Basic Test Suite
```powershell
.\tests\live-app-test.ps1
```

**What it tests:**
- ✅ Dashboard accessibility
- ✅ All dashboard pages (9 pages)
- ✅ Static assets (bridgeflux.js, install.sh, install.ps1)
- ✅ Performance metrics
- ✅ Security headers

**Time:** ~1 minute

---

### 3. Run Advanced API Test Suite
```powershell
.\tests\live-app-advanced-test.ps1
```

**What it tests:**
- ✅ API endpoints (/api/agent/connect)
- ✅ Error handling (400, 404, 405 responses)
- ✅ Performance benchmarks (5-request average)
- ✅ Edge cases and validation
- ✅ Load time analysis

**Time:** ~1-2 minutes

---

### 4. Run with Custom Dashboard URL
```powershell
.\tests\live-app-advanced-test.ps1 -DashboardUrl "http://custom-url:9002"
```

---

## Dashboard Manual Testing

### Navigate to Dashboard Pages
1. **Overview:** http://localhost:9002
2. **Active Tunnels:** http://localhost:9002/tunnels
3. **Reserved Domains:** http://localhost:9002/domains
4. **Live Inspector:** http://localhost:9002/inspector
5. **Failure Analysis:** http://localhost:9002/diagnostics
6. **Script Generator:** http://localhost:9002/scripts
7. **Access Control:** http://localhost:9002/security
8. **Connectivity Sandbox:** http://localhost:9002/sandbox
9. **Settings:** http://localhost:9002/settings

---

## Full End-to-End Testing

### Step 1: Provision a Test Bridge
1. Open http://localhost:9002/domains
2. Enter desired subdomain (e.g., "test-bridgeflux")
3. Select "HTTP / WEB" allocation type
4. Click "Provision HTTP Resource"

### Step 2: Note Your Bridge Details
- Look for the created bridge in "Active Pool"
- Copy the full URL (e.g., test-bridgeflux.flux.io)
- Note the local port and token

### Step 3: Start Local Test Service (Port 8080)
```powershell
# Option A: Python HTTP Server
python -m http.server 8080

# Option B: Node.js HTTP Server
node -e "require('http').createServer((q,s)=>s.writeHead(200).end('OK')).listen(8080)"

# Option C: Your own application
npm start  # Make sure it runs on port 8080
```

### Step 4: Activate the Bridge
```powershell
# Bootstrap the agent first (if needed)
curl -sL http://localhost:9002/install.ps1 | powershell

# Then activate the bridge
bridgeflux connect --port 8080 --token <your-token>
```

### Step 5: Test Live URL Access
```powershell
# Test from PowerShell
Invoke-WebRequest -Uri "https://test-bridgeflux.flux.io" -UseBasicParsing

# Or use curl
curl https://test-bridgeflux.flux.io
```

### Step 6: Monitor Live Traffic
1. Go to http://localhost:9002/inspector
2. Check for incoming requests
3. Verify traffic flowing through the bridge

---

## API Endpoint Reference

### Agent Connection
```
Endpoint: POST /api/agent/connect
Purpose: Activate a tunnel connection

Request Body:
{
  "token": "bf_live_guest_0x...",
  "port": 8080,
  "tunnelId": "optional-tunnel-id",
  "latency": "15ms"
}

Response:
Success (200): Tunnel activated
Bad Request (400): Missing required fields
Not Found (404): Tunnel not found
```

---

## Performance Benchmarks

### Current Performance
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Dashboard Load | 114ms | <500ms | ✅ PASS |
| API Response | <50ms | <100ms | ✅ PASS |
| Static Assets | <100ms | <200ms | ✅ PASS |
| 95th Percentile | <312ms | <1000ms | ✅ PASS |

---

## Troubleshooting

### Dashboard Won't Load
```powershell
# Check if server is running
Get-NetTCPConnection -LocalPort 9002 -ErrorAction SilentlyContinue

# Kill existing process if needed
Stop-Process -Port 9002 -Force

# Restart
npm run dev
```

### API Endpoint Returns 404
- Ensure dashboard is running on port 9002
- Check URL exactly: `/api/agent/connect` (case-sensitive)
- Verify method is POST

### Bridge Won't Activate
- Verify port 8080 is available
- Check token is correct
- Ensure test service is running on port 8080
- Check firewall settings

### Cannot Access Live URL
- Wait 60 seconds for DNS propagation
- Verify bridge is in "Active Pool"
- Check IP is in whitelist rules
- Verify service is running on port 8080

---

## Test Report Files

Generated test reports are saved in:
- `TEST_REPORT_LIVE_APP.md` - Comprehensive test results
- `tests/live-app-test.ps1` - Basic test suite
- `tests/live-app-advanced-test.ps1` - Advanced test suite

View the comprehensive report:
```powershell
Get-Content TEST_REPORT_LIVE_APP.md | more
```

---

## Continuous Testing

### Run All Tests in Sequence
```powershell
# Run basic tests
.\tests\live-app-test.ps1

# Wait for completion
Read-Host "Press Enter to continue..."

# Run advanced tests
.\tests\live-app-advanced-test.ps1
```

---

## Development Server Management

### Start in Development Mode
```powershell
npm run dev
```

### Start with Turbopack (Faster)
```powershell
npm run dev:turbo
```

### Lint and Type Check
```powershell
npm run lint
npm run typecheck
```

### Build for Production
```powershell
npm run build
npm start
```

---

## Useful Dashboard Information

### Mesh Infrastructure
- **Edge Nodes:** 142 globally distributed
- **Capacity:** 78% utilized
- **Protocol:** HTTP/HTTPS
- **Auto-Recovery:** Enabled
- **Persistence:** Hardware-level

### Current Session
- **Type:** Persistent Guest
- **Session ID:** bf_live_guest_0x3b3b3ab0b7c28
- **Status:** Active
- **Lock Status:** Session Locked

### Firebase Integration
- **Project ID:** studio-7583316153-57312
- **Database:** Firestore (us-central1)
- **Auth:** Guest mode (development)

---

## Next Steps for Full Testing

1. ✅ Complete - Dashboard & API verification
2. ⏳ Pending - Bridge provisioning
3. ⏳ Pending - Live URL accessibility
4. ⏳ Pending - Traffic monitoring
5. ⏳ Pending - Security rules enforcement
6. ⏳ Pending - Failure recovery testing

---

## Support & Documentation

### Key Documentation Files
- `README.md` - Project overview
- `QUICK_REFERENCE.md` - Command reference
- `DEPLOYMENT_READY.md` - Deployment checklist
- `INTERNET_EXPOSURE_TEST.md` - Bridge test details

### Dashboard Features
- **Live Inspector:** Monitor real-time traffic and performance
- **Failure Analysis:** AI-powered diagnostics
- **Script Generator:** Auto-generate installation scripts
- **Access Control:** Manage IP whitelisting and security

---

**Test Suite Version:** 1.0  
**Last Updated:** 2026-05-29  
**Status:** All Core Tests Passing ✅
