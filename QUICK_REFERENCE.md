# BridgeFlux Quick Reference - Enterprise Gateway Bridge

## 🚀 Quick Start (Copy & Paste)

```bash
# 1. Start the dashboard
npm run dev

# 2. Bootstrap the agent from the running dashboard
curl -sL http://localhost:9002/install.sh | sudo bash -s -- http://localhost:9002

# 3. Start the bridge (connects your port 8080 to the internet)
bridgeflux connect --port 8080 --token bf_live_guest_0x02060cd1d7ed

# 4. Your service is now live!
# Access via: https://enterprise-gateway.flux.io
```

---

## 📊 Bridge Details

| Property | Details |
|----------|---------|
| **Public URL** | `https://enterprise-gateway.flux.io` |
| **Local Binding** | `localhost:8080` |
| **Protocol** | HTTP/HTTPS (auto-managed) |
| **Token** | `bf_live_guest_0x02060cd1d7ed` |
| **Status** | 🟢 ACTIVE |
| **Global Nodes** | 142 edge locations |
| **Security** | IP whitelist + TLS 1.3+ |

---

## 🔐 Security Configuration

**Active Rule:**
- **Name:** Production Datacenter
- **CIDR:** 203.0.113.0/24
- **Access:** ALLOWED

### To Add More Rules:
1. Open BridgeFlux Dashboard
2. Navigate to Access Control
3. Enter Rule Label and CIDR range
4. Click "Add"

---

## 🌍 Access Examples

```bash
# Basic HTTPS request
curl https://enterprise-gateway.flux.io

# With authentication
curl -H "Authorization: Bearer TOKEN" https://enterprise-gateway.flux.io/api/endpoint

# Webhook callback
POST https://enterprise-gateway.flux.io/webhooks/github

# Browser access
# https://enterprise-gateway.flux.io
```

---

## 📡 Real-Time Features

- **Live Inspector:** View individual requests/responses
- **Traffic Telemetry:** Bandwidth, latency, packet analysis
- **Mesh Latency:** Real-time monitoring
- **Failure Analysis:** AI-powered diagnostics
- **Access Logs:** Full request history

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 8080 in use | Change port: `--port 8081` |
| Connection timeout | Check firewall, verify edge node reachable |
| No traffic flowing | Verify IP is in whitelist (203.0.113.0/24) |
| Service won't start | Ensure port available, check permissions |
| Can't access URL | Wait 30-60 seconds for DNS propagation |

---

## 📋 Service Persistence

**What it means:**
- ✅ Runs in background (even if dashboard closes)
- ✅ Auto-restarts on system reboot
- ✅ Auto-recovers on network failure
- ✅ Firestore-synced for instant termination

**Disable if needed:**
```bash
sudo systemctl stop bridgeflux
sudo systemctl disable bridgeflux
```

---

## 🔄 GitHub Actions Integration

```yaml
name: Deploy to Edge Network
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Start local service
        run: npm start --port 8080 &
      - name: Activate bridge
        run: |
          curl -sL http://localhost:9002/install.sh | sudo bash -s -- http://localhost:9002
          bridgeflux connect --port 8080 --token ${{ secrets.BRIDGEFLUX_TOKEN }}
      - name: Run tests
        run: npm test -- --url https://enterprise-gateway.flux.io
```

---

## 📊 Monitoring Dashboard

Access at: `http://localhost:9002`

### Key Metrics Available:
- **Active Tunnels:** 1 (Enterprise Gateway)
- **Edge Distribution:** Global points of presence
- **Mesh Latency:** Real-time average
- **Quota Usage:** 1 of 50 slots
- **Traffic Volume:** KB/s monitoring

---

## 🎯 When You Need...

| Need | Command/Action |
|------|----------------|
| Stop service | `bridgeflux disconnect` |
| Change port | `bridgeflux connect --port 8081 --token <token>` |
| View logs | `bridgeflux logs` |
| Check status | Dashboard → Active Tunnels |
| Kill service | Delete tunnel from dashboard (instant termination) |
| Update whitelist | Dashboard → Access Control → Add Rule |

---

## 💡 Pro Tips

1. **Use auto-start:** Enables 24/7 availability
2. **Monitor latency:** Check from Live Dashboard for performance
3. **Set up alerts:** Use Slack integration for downtime notifications
4. **Use custom domain:** For professional branding
5. **Implement app-level auth:** Don't rely on IP whitelist alone
6. **Test from outside:** Verify access from different networks
7. **Keep token secret:** Never commit to git

---

## 🔗 Available URLs

```
Dashboard:        http://localhost:9002
Public Bridge:    https://enterprise-gateway.flux.io
Script Generator: http://localhost:9002/scripts
Access Control:   http://localhost:9002/security
Live Inspector:   http://localhost:9002/inspector
Diagnostics:      http://localhost:9002/diagnostics
```

---

## 📞 Support

For issues:
1. Check Live Inspector for traffic patterns
2. Run Failure Analysis for diagnostics
3. Verify IP whitelist includes your source
4. Check local service running on port 8080
5. Verify Firestore connectivity

---

## ✨ What's Internet-Accessible Now

Your `localhost:8080` is now:
- 🌍 Accessible from anywhere in the world
- 🔒 Secured with IP filtering
- 🚀 Running on 142 global edge nodes
- 🔄 Auto-recovering with persistence
- 📊 Monitored in real-time
- 🎯 Ready for production

**Status: LIVE & READY** ✅

---

**Last Updated:** 2026-05-28  
**Version:** 1.0  
**Token:** bf_live_guest_0x02060cd1d7ed
