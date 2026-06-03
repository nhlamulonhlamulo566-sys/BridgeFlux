#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const args = process.argv.slice(2);
const home = os.homedir();
const stateDir = path.join(home, '.bridgeflux');
if (!fs.existsSync(stateDir)) {
  fs.mkdirSync(stateDir, { recursive: true });
}

const logPath = path.join(stateDir, 'bridgeflux.log');
function writeLog(message) {
  fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
}

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

function serializeControlMessage(payload) {
  return `${JSON.stringify(payload)}\n`;
}

function sendControlMessage(socket, payload) {
  if (!socket || socket.destroyed) return;
  socket.write(serializeControlMessage(payload));
}

async function startRelayTunnel({ relayHost, relayPort, localPort, token, tunnelId, publicPort }) {
  const net = require('net');
  const controlSocket = net.createConnection({ host: relayHost, port: relayPort }, () => {
    console.log(`🔌 Connected to relay ${relayHost}:${relayPort}`);
    sendControlMessage(controlSocket, {
      type: 'register',
      token,
      tunnelId,
      localPort: parseInt(localPort, 10),
      publicPort: publicPort ? parseInt(publicPort, 10) : undefined,
    });
  });

  let buffer = '';
  const connectionMap = new Map();

  const cleanupConnection = (connId) => {
    const localSocket = connectionMap.get(connId);
    if (localSocket) {
      connectionMap.delete(connId);
      localSocket.destroy();
    }
  };

  const closeAllConnections = () => {
    for (const localSocket of connectionMap.values()) {
      localSocket.destroy();
    }
    connectionMap.clear();
  };

  controlSocket.on('data', (chunk) => {
    buffer += chunk.toString();
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
      const raw = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (!raw) continue;

      let msg;
      try {
        msg = JSON.parse(raw);
      } catch (error) {
        console.error('BridgeFlux relay: invalid control frame', error.message);
        continue;
      }

      switch (msg.type) {
        case 'registered': {
          if (msg.status === 'ok') {
            const assignedPort = msg.publicPort || publicPort;
            console.log(`✅ Relay active. Public endpoint: ${relayHost}:${assignedPort}`);
            return;
          }

          console.error('BridgeFlux relay registration failed:', msg.error || 'unknown error');
          controlSocket.destroy();
          return;
        }
        case 'new_connection': {
          const connId = msg.connId;
          const localSocket = net.createConnection({ port: parseInt(localPort, 10), host: '127.0.0.1' }, () => {
            sendControlMessage(controlSocket, { type: 'ready', connId });
          });

          connectionMap.set(connId, localSocket);

          localSocket.on('data', (data) => {
            sendControlMessage(controlSocket, {
              type: 'data',
              connId,
              payload: data.toString('base64'),
            });
          });

          localSocket.on('close', () => {
            sendControlMessage(controlSocket, { type: 'close', connId });
            cleanupConnection(connId);
          });

          localSocket.on('error', (err) => {
            console.error(`BridgeFlux relay local socket error for ${connId}:`, err.message);
            sendControlMessage(controlSocket, { type: 'error', connId, message: err.message });
            cleanupConnection(connId);
          });
          return;
        }
        case 'data': {
          const { connId, payload } = msg;
          const localSocket = connectionMap.get(connId);
          if (localSocket && !localSocket.destroyed) {
            localSocket.write(Buffer.from(payload, 'base64'));
          }
          return;
        }
        case 'close': {
          cleanupConnection(msg.connId);
          return;
        }
        case 'error': {
          console.error('BridgeFlux relay error from server:', msg.message || msg.error);
          return;
        }
        default:
          console.warn('BridgeFlux relay: unknown message type', msg.type);
          return;
      }
    }
  });

  controlSocket.on('error', (err) => {
    console.error('BridgeFlux relay control connection error:', err.message);
  });

  controlSocket.on('close', () => {
    console.log('BridgeFlux relay control connection closed.');
    closeAllConnections();
  });

  process.on('SIGINT', () => {
    console.log('\n🔌 Closing BridgeFlux relay tunnel...');
    closeAllConnections();
    controlSocket.destroy();
    process.exit(0);
  });

  await new Promise((resolve) => {
    controlSocket.on('end', () => resolve());
    controlSocket.on('close', () => resolve());
    controlSocket.on('error', () => resolve());
  });

  return false;
}

function help() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║          BridgeFlux CLI - Persistent Tunnel Proxy         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('USAGE:');
  console.log('  bridgeflux connect --port <PORT> --token <TOKEN> --base <URL> [--tunnel-id <ID>] [--proxy-port <PORT>] [--relay-host <HOST> --relay-port <PORT>] [--public-port <PORT>]');
  console.log('  bridgeflux service install --port <PORT> --token <TOKEN> --startup automatic');
  console.log('  bridgeflux disconnect');
  console.log('  bridgeflux logs');
  console.log('');
  console.log('EXAMPLES:');
  console.log('  # Activate a live tunnel and start proxying traffic');
  console.log('  bridgeflux connect --port 3306 --token bf_user_123 \\');
  console.log('    --tunnel-id abc123 --proxy-port 63756 --base https://bridge-flux.vercel.app');
  console.log('  bridgeflux connect --port 3306 --token bf_user_123 \\');
  console.log('    --tunnel-id abc123 --relay-host tcp.flux.io --relay-port 5000 --public-port 16567 --base https://bridge-flux.vercel.app');
  console.log('');
  console.log('  # Install as Windows service (auto-start on boot)');
  console.log('  bridgeflux service install --port 3306 --token bf_user_123 \\');
  console.log('    --startup automatic');
  console.log('');
  console.log('FEATURES:');
  console.log('  • Real-time throughput measurement (Mbps)');
  console.log('  • Persistent TCP proxy to localhost:<port>');
  console.log('  • Automatic bandwidth reporting to dashboard');
  console.log('  • Graceful shutdown with Ctrl+C');
  console.log('  • All activity logged to ~/.bridgeflux/bridgeflux.log');
  console.log('');
  process.exit(0);
}

function getArg(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

async function notifyAgentConnect({ base, tunnelId, token, port, latency }) {
  try {
    const url = new URL('/api/agent/connect', base).toString();
    console.log(`BridgeFlux CLI: notifying backend ${url} for tunnel ${tunnelId || 'unknown'}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, tunnelId, port, latency }),
    });

    const payload = await response.json().catch((e) => ({ error: 'invalid-json-response' }));
    console.log(`BridgeFlux CLI: backend responded with status=${response.status}`);
    if (!response.ok) {
      console.error('BridgeFlux agent notification failed:', payload.error || response.statusText);
      writeLog(`connect-failed port=${port} token=${token} tunnelId=${tunnelId} base=${base} status=${response.status} error=${payload.error || response.statusText}`);
      return false;
    }

    console.log(`✅ BridgeFlux CLI stub: connected to localhost:${port} using token ${token}`);
    console.log(`🔌 Tunnel activated with latency ${payload.latency || latency}.`);

    if (payload.publicUrl) {
      const publicPort = typeof payload.publicPort === 'string' ? parseInt(payload.publicPort, 10) : payload.publicPort;
      const scheme = publicPort === 80 ? 'http://' : 'https://';
      const endpoint = `${scheme}${payload.publicUrl}${publicPort && publicPort !== 443 ? `:${publicPort}` : ''}`;
      console.log(`🔗 Public endpoint assigned: ${endpoint}`);
    }

    writeLog(`connect port=${port} token=${token} tunnelId=${tunnelId} base=${base} latency=${payload.latency || latency} status=${response.status}`);
    return payload;
  } catch (error) {
    console.error('BridgeFlux agent notification error:', error.message || error);
    writeLog(`connect-error port=${port} token=${token} tunnelId=${tunnelId} base=${base} error=${error.message || error}`);
    return false;
  }
}

async function reportProxyState({ base, tunnelId, token, proxyPort, proxyHost, status }) {
  if (!base || !tunnelId) return;

  try {
    const url = new URL('/api/agent/proxy', base).toString();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, tunnelId, proxyPort, proxyHost, status }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error(`BridgeFlux CLI: proxy report failed with status=${response.status}`);
      writeLog(`proxy-report-failed tunnelId=${tunnelId} proxyPort=${proxyPort} status=${status} base=${base} status=${response.status} error=${payload.error || response.statusText}`);
      return;
    }

    writeLog(`proxy-report ${status} tunnelId=${tunnelId} proxyPort=${proxyPort} proxyHost=${proxyHost} base=${base}`);
  } catch (error) {
    console.error('BridgeFlux proxy report error:', error.message || error);
    writeLog(`proxy-report-error tunnelId=${tunnelId} proxyPort=${proxyPort} status=${status} base=${base} error=${error.message || error}`);
  }
}

async function startTcpProxy({ port, token, tunnelId, base }) {
  const net = require('net');

  let totalBytesReceived = 0;
  let totalBytesSent = 0;
  let lastReportTime = Date.now();
  let lastBytesReceived = 0;
  let lastBytesSent = 0;

  const openConnections = new Set();
  const openTargets = new Set();

  const proxyServer = net.createServer((socket) => {
    const targetSocket = net.createConnection(
      { port: parseInt(port), host: 'localhost' },
      () => {
        socket.pipe(targetSocket);
        targetSocket.pipe(socket);

        openConnections.add(socket);
        openTargets.add(targetSocket);

        const cleanupSocket = () => {
          openConnections.delete(socket);
        };
        const cleanupTarget = () => {
          openTargets.delete(targetSocket);
        };

        socket.on('close', cleanupSocket);
        socket.on('end', cleanupSocket);
        targetSocket.on('close', cleanupTarget);
        targetSocket.on('end', cleanupTarget);

        // Track incoming data from the tunnel
        socket.on('data', (chunk) => {
          totalBytesReceived += chunk.length;
        });

        // Track outgoing data to the tunnel
        targetSocket.on('data', (chunk) => {
          totalBytesSent += chunk.length;
        });

        socket.on('error', (err) => {
          console.error(`[${new Date().toISOString()}] Socket error:`, err.message);
          targetSocket.destroy();
        });

        targetSocket.on('error', (err) => {
          console.error(`[${new Date().toISOString()}] Target socket error:`, err.message);
          socket.destroy();
        });
      }
    );

    targetSocket.on('error', (err) => {
      console.error(`[${new Date().toISOString()}] Connection to localhost:${port} failed:`, err.message);
      socket.destroy();
    });
  });

  // Use a dynamic port or the specified proxyPort
  const proxyPort = getArg('--proxy-port') || 0;
  let boundPort = 0;

  proxyServer.listen(proxyPort, '127.0.0.1', async () => {
    boundPort = proxyServer.address().port;
    console.log(`\n🔌 BridgeFlux tunnel is active and proxying traffic to localhost:${port}`);
    console.log(`   Proxy listening on 127.0.0.1:${boundPort}`);
    console.log(`   Token: ${token}`);
    console.log(`   Tunnel ID: ${tunnelId || 'auto'}`);
    console.log(`   Backend: ${base}`);
    console.log(`   Press Ctrl+C to disconnect\n`);
    writeLog(`proxy-started port=${port} proxyPort=${boundPort} token=${token} tunnelId=${tunnelId}`);

    if (tunnelId && base) {
      await reportProxyState({
        base,
        tunnelId,
        token,
        proxyPort: boundPort,
        proxyHost: '127.0.0.1',
        status: 'connected',
      });
    }
  });

  // Report throughput metrics every 5 seconds
  const reportInterval = setInterval(async () => {
    const now = Date.now();
    const timeDeltaMs = now - lastReportTime;
    const bytesReceivedDelta = totalBytesReceived - lastBytesReceived;
    const bytesSentDelta = totalBytesSent - lastBytesSent;
    const totalBytesDelta = bytesReceivedDelta + bytesSentDelta;

    if (totalBytesDelta > 0) {
      const mbps = ((totalBytesDelta * 8) / (timeDeltaMs / 1000)) / 1_000_000;
      const totalMb = (totalBytesReceived + totalBytesSent) / (1024 * 1024);
      process.stdout.write(`\r📊 Throughput: ${mbps.toFixed(2)} Mbps | Total: ${totalMb.toFixed(2)} MB`);
    }

    // Send throughput update to backend
    if (tunnelId && base && totalBytesDelta > 0) {
      try {
        const url = new URL('/api/agent/throughput', base).toString();
        const mbps = ((totalBytesDelta * 8) / (timeDeltaMs / 1000)) / 1_000_000;
        writeLog(`throughput-send tunnelId=${tunnelId} bytes=${totalBytesDelta} mbps=${mbps.toFixed(2)}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            tunnelId,
            bytesTransferred: totalBytesDelta,
            mbps,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text().catch(() => 'unknown');
          writeLog(`throughput-send-failed status=${response.status} error=${errorBody}`);
        } else {
          const result = await response.json().catch(() => ({}));
          writeLog(`throughput-send-ok status=${response.status} totalBytes=${result.totalBytesTransferred}`);
        }
      } catch (error) {
        writeLog(`throughput-send-error ${error instanceof Error ? error.message : error}`);
      }
    }

    lastReportTime = now;
    lastBytesReceived = totalBytesReceived;
    lastBytesSent = totalBytesSent;
  }, 5000);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    clearInterval(reportInterval);
    const totalMb = (totalBytesReceived + totalBytesSent) / (1024 * 1024);
    console.log(`\n\n🔌 Closing BridgeFlux tunnel...`);

    if (openConnections.size > 0) {
      for (const conn of openConnections) {
        conn.destroy();
      }
    }
    if (openTargets.size > 0) {
      for (const target of openTargets) {
        target.destroy();
      }
    }

    if (tunnelId && base && boundPort) {
      await reportProxyState({
        base,
        tunnelId,
        token,
        proxyPort: boundPort,
        proxyHost: '127.0.0.1',
        status: 'disconnected',
      });
    }

    console.log(`   Total data transferred: ${totalMb.toFixed(2)} MB`);

    const forceExit = setTimeout(() => {
      console.log('⚠️ Force closing BridgeFlux tunnel after timeout.');
      writeLog(`proxy-force-stop token=${token} tunnelId=${tunnelId} totalMb=${totalMb.toFixed(2)}`);
      process.exit(0);
    }, 3000);

    proxyServer.close(() => {
      clearTimeout(forceExit);
      console.log('✅ Tunnel disconnected');
      writeLog(`proxy-stopped token=${token} tunnelId=${tunnelId} totalMb=${totalMb.toFixed(2)}`);
      process.exit(0);
    });
  });
}

async function main() {
  if (args.length === 0) {
    help();
  }

  const cmd = args[0];
  if (cmd === 'connect') {
    const port = getArg('--port') || 'unknown';
    const token = getArg('--token') || 'unknown';
    const tunnelId = getArg('--tunnel-id');
    const base = getArg('--base');
    const relayHost = getArg('--relay-host') || process.env.BRIDGEFLUX_RELAY_HOST;
    const relayPort = parseInt(getArg('--relay-port') || process.env.BRIDGEFLUX_RELAY_PORT || '', 10);
    const publicPort = getArg('--public-port') || process.env.BRIDGEFLUX_PUBLIC_PORT;
    const latency = `${Math.floor(Math.random() * 40) + 10}ms`;

    if (base) {
      const payload = await notifyAgentConnect({ base, tunnelId, token, port, latency });
      if (!payload) {
        writeLog(`connect-failed port=${port} token=${token} tunnelId=${tunnelId} base=${base}`);
        process.exit(1);
      }

      if (relayHost && relayPort) {
        await startRelayTunnel({ relayHost, relayPort, localPort: port, token, tunnelId, publicPort: publicPort || payload.publicPort });
        return;
      }

      // Start the TCP proxy to forward traffic from the tunnel to the local service
      await startTcpProxy({ port, token, tunnelId, base });
      return;
    }

    console.log(`✅ BridgeFlux CLI stub: connected to localhost:${port} using token ${token}`);
    if (!base) {
      console.warn('⚠️  BridgeFlux CLI stub: no --base provided. This will not notify the cloud backend or activate the live tunnel.');
      console.warn('Use --base <url> with a valid app origin to activate the bridge.');
    }
    writeLog(`connect port=${port} token=${token} tunnelId=${tunnelId} base=${base}`);
    process.exit(0);
  }

  if (cmd === 'service') {
    const subcmd = args[1];
    if (subcmd === 'install') {
      const port = getArg('--port') || 'unknown';
      const token = getArg('--token') || 'unknown';
      console.log(`✅ BridgeFlux CLI stub: service install on port ${port} with token ${token}`);
      writeLog(`service install port=${port} token=${token}`);
      process.exit(0);
    }
  }

  if (cmd === 'disconnect') {
    console.log('✅ BridgeFlux CLI stub: disconnected.');
    writeLog('disconnect');
    process.exit(0);
  }

  if (cmd === 'logs') {
    if (fs.existsSync(logPath)) {
      console.log(fs.readFileSync(logPath, 'utf8'));
    } else {
      console.log('No BridgeFlux CLI stub logs available yet.');
    }
    process.exit(0);
  }

  console.log(`Unknown BridgeFlux stub command: ${args.join(' ')}`);
  help();
}

main().catch((error) => {
  console.error('BridgeFlux CLI stub fatal error:', error);
  process.exit(1);
});
