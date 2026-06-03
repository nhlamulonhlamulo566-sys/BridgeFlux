# BridgeFlux Complete Solution - Tunneling with Live Throughput

## Overview
BridgeFlux enables secure live tunneling of local services through a cloud infrastructure, with real-time throughput monitoring and persistent connections.

## Architecture

### Components
1. **Backend (Vercel)**: Cloud infrastructure managing tunnel metadata
2. **CLI (Node.js)**: Local tool that activates tunnels and proxies traffic
3. **Dashboard**: Real-time monitoring of active tunnels and throughput
4. **Firestore**: Database storing tunnel state and metrics

### Data Flow
```
Local Service (localhost:3306)
    ↓
[TCP Proxy] (CLI maintains connection)
    ↓
[Cloud Backend] (https://bridge-flux.vercel.app)
    ↓
[Dashboard] (displays status, latency, throughput)
```

## Installation & Setup

### Prerequisites
- Node.js v18+
- Local service running on a port (e.g., MySQL on 3306)
- BridgeFlux account with authentication token

### Install CLI
```bash
npm install -g bridge-flux
# or
curl -sL https://bridge-flux.vercel.app/install.sh | bash
```

### Windows PowerShell
```powershell
$base = "https://bridge-flux.vercel.app"
$InstallScript = Invoke-WebRequest -Uri "$base/install.ps1" -UseBasicParsing
Invoke-Expression $InstallScript.Content
```

## Usage

### Activate a Tunnel
```bash
bridgeflux connect \
  --port 3306 \
  --token bf_live_guest_0xeac9ffc5b481 \
  --tunnel-id EW4PE4LFrFvX5cglf6pj \
  --base https://bridge-flux.vercel.app
```

**What happens:**
1. ✅ CLI notifies backend of tunnel activation
2. ✅ Backend marks tunnel as `active` with latency measurement
3. ✅ CLI starts persistent TCP proxy on localhost:3306 → remote tunnel
4. ✅ Real-time throughput displayed: `📊 Throughput: 1.23 Mbps | Total: 45.67 MB`
5. ✅ Metrics continuously sent to dashboard
6. ✅ Process stays running until Ctrl+C

### Disconnect Tunnel
```bash
# Press Ctrl+C in the terminal running the CLI
# Shows: Total data transferred: X.XX MB
```

### View Logs
```bash
bridgeflux logs
# Displays all connection history from ~/.bridgeflux/bridgeflux.log
```

### Install as Windows Service (Auto-start)
```powershell
bridgeflux service install `
  --port 3306 `
  --token bf_live_guest_0xeac9ffc5b481 `
  --startup automatic
```

## Features

### ✅ Persistent Connections
- CLI maintains TCP proxy socket continuously
- No forced disconnects after activation
- Graceful shutdown with Ctrl+C

### ✅ Real-Time Throughput
- Measures bandwidth every 5 seconds
- Displays Mbps and cumulative MB transferred
- Reports metrics to dashboard

### ✅ Automatic Status Updates
- Tunnel status: `active`, `inactive`
- Agent connected: `true/false`
- Latency: measured in milliseconds
- Last seen: timestamp of last activity

### ✅ Comprehensive Logging
- All events logged to `~/.bridgeflux/bridgeflux.log`
- Includes: activation, errors, data transferred, disconnection
- Useful for debugging and auditing

## Dashboard Monitoring

The BridgeFlux dashboard displays:
- **Active Tunnels**: Count of currently connected tunnels
- **Status**: ACTIVE (green), INACTIVE (gray)
- **Latency**: Network latency to the tunnel endpoint
- **Throughput**: Real-time bandwidth usage
- **Last Seen**: When the tunnel last reported activity

## Troubleshooting

### Tunnel Activated but No Throughput
**Issue**: Dashboard shows tunnel active but 0.00 MB/hr throughput
**Solution**: 
- Ensure CLI process is still running (should show `Press Ctrl+C to disconnect`)
- Verify local service is listening on the correct port
- Check firewall rules allowing localhost connections
- View logs: `bridgeflux logs`

### Connection Refused Error
**Issue**: `Connection to localhost:3306 failed`
**Solution**:
- Verify service is running on specified port
- Test locally: `telnet localhost 3306` or `ncat localhost 3306`
- Check port number in command matches your service

### High Latency
**Issue**: Dashboard shows latency > 100ms
**Solution**:
- Normal for geographical distance
- Check network conditions: `ping bridge-flux.vercel.app`
- Verify ISP connection stability

## API Endpoints

### POST /api/agent/connect
Activates a tunnel and notifies backend

**Request:**
```json
{
  "token": "bf_live_guest_0xeac9ffc5b481",
  "tunnelId": "EW4PE4LFrFvX5cglf6pj",
  "port": 3306,
  "latency": "31ms"
}
```

**Response:**
```json
{
  "success": true,
  "latency": "31ms"
}
```

### POST /api/agent/throughput
Reports bandwidth metrics (called automatically by CLI)

**Request:**
```json
{
  "token": "bf_live_guest_0xeac9ffc5b481",
  "tunnelId": "EW4PE4LFrFvX5cglf6pj",
  "bytesTransferred": 1024000,
  "mbps": 1.23,
  "timestamp": "2026-06-01T10:00:00.000Z"
}
```

## Security

- ✅ SSL/TLS encryption in transit
- ✅ Token-based authentication
- ✅ Firestore security rules validate tunnel ownership
- ✅ No sensitive data in logs
- ✅ Service account credentials encrypted in production

## Files Modified

1. **src/firebase/admin.ts** - Service account loading with flexible encoding
2. **src/app/api/agent/connect/route.ts** - Tunnel activation endpoint
3. **src/app/api/agent/throughput/route.ts** - Bandwidth reporting endpoint
4. **public/bridgeflux.js** - CLI with persistent proxy and throughput tracking
5. **public/install.ps1** - Windows PowerShell installer

## Status: ✅ PRODUCTION READY

All components tested and verified:
- ✅ Backend authentication working
- ✅ Tunnel activation successful
- ✅ Persistent connections maintained
- ✅ Real-time throughput measurement
- ✅ Dashboard integration ready
- ✅ Graceful shutdown handling

## Next Steps

1. **Scale Testing**: Test with multiple concurrent tunnels
2. **Performance Tuning**: Optimize proxy throughput for high-bandwidth scenarios
3. **Advanced Features**: Add tunnel pooling, load balancing, encryption options
4. **Mobile Apps**: Create iOS/Android apps for remote tunnel management
5. **Integrations**: Connect with CI/CD platforms for automated deployments

---

**Support**: For issues or feature requests, visit the BridgeFlux GitHub repository or contact the development team.
