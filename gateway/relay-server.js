#!/usr/bin/env node
const net = require('net');
const crypto = require('crypto');

const CONTROL_PORT = parseInt(process.env.RELAY_CONTROL_PORT || process.argv[2] || '5000', 10);
const PUBLIC_BIND_HOST = process.env.RELAY_BIND_HOST || '0.0.0.0';

const tunnelsById = new Map();
const portRegistry = new Map();

function generateId() {
  return crypto.randomBytes(10).toString('hex');
}

function sendControlMessage(socket, payload) {
  if (!socket || socket.destroyed) return;
  socket.write(`${JSON.stringify(payload)}\n`);
}

function createPublicListener(tunnel) {
  if (tunnel.server || tunnel.publicPort == null) return;
  if (portRegistry.has(tunnel.publicPort)) {
    console.error(`Port ${tunnel.publicPort} is already reserved by another tunnel.`);
    return;
  }

  const server = net.createServer((clientSocket) => {
    if (!tunnel.controlSocket || tunnel.controlSocket.destroyed) {
      clientSocket.destroy();
      return;
    }

    const connId = generateId();
    tunnel.connections.set(connId, clientSocket);

    clientSocket.on('data', (data) => {
      sendControlMessage(tunnel.controlSocket, {
        type: 'data',
        connId,
        payload: data.toString('base64'),
      });
    });

    clientSocket.on('close', () => {
      sendControlMessage(tunnel.controlSocket, { type: 'close', connId });
      tunnel.connections.delete(connId);
    });

    clientSocket.on('error', (err) => {
      console.error(`Public client socket error for ${connId}:`, err.message);
      sendControlMessage(tunnel.controlSocket, { type: 'error', connId, message: err.message });
      clientSocket.destroy();
      tunnel.connections.delete(connId);
    });

    sendControlMessage(tunnel.controlSocket, {
      type: 'new_connection',
      connId,
      tunnelId: tunnel.tunnelId,
    });
  });

  server.on('error', (err) => {
    console.error(`Public listener error on port ${tunnel.publicPort}:`, err.message);
  });

  server.listen(tunnel.publicPort, PUBLIC_BIND_HOST, () => {
    console.log(`✅ Relay serving tunnel ${tunnel.tunnelId} on ${PUBLIC_BIND_HOST}:${tunnel.publicPort}`);
  });

  tunnel.server = server;
  portRegistry.set(tunnel.publicPort, tunnel.tunnelId);
}

function closeTunnel(tunnel) {
  if (tunnel.server) {
    tunnel.server.close(() => {
      console.log(`Closed public listener for tunnel ${tunnel.tunnelId}`);
    });
    portRegistry.delete(tunnel.publicPort);
    tunnel.server = null;
  }

  for (const [connId, clientSocket] of tunnel.connections.entries()) {
    clientSocket.destroy();
    tunnel.connections.delete(connId);
  }

  if (tunnel.controlSocket) {
    tunnel.controlSocket.destroy();
    tunnel.controlSocket = null;
  }
}

function handleControlConnection(socket) {
  let buffer = '';
  let tunnel = null;

  socket.on('data', (chunk) => {
    buffer += chunk.toString();
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
      const raw = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (!raw) continue;
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch (err) {
        console.error('Relay control: invalid JSON frame', err.message);
        continue;
      }

      switch (msg.type) {
        case 'register': {
          if (!msg.tunnelId || !msg.token || !msg.localPort || !msg.publicPort) {
            sendControlMessage(socket, { type: 'registered', status: 'error', error: 'Missing required tunnel metadata' });
            socket.destroy();
            return;
          }

          tunnel = {
            tunnelId: msg.tunnelId,
            token: msg.token,
            localPort: parseInt(msg.localPort, 10),
            publicPort: parseInt(msg.publicPort, 10),
            controlSocket: socket,
            connections: new Map(),
            server: null,
          };

          if (tunnelsById.has(msg.tunnelId)) {
            console.log(`Re-registering tunnel ${msg.tunnelId}`);
            closeTunnel(tunnelsById.get(msg.tunnelId));
          }

          if (portRegistry.has(tunnel.publicPort) && portRegistry.get(tunnel.publicPort) !== tunnel.tunnelId) {
            sendControlMessage(socket, { type: 'registered', status: 'error', error: 'Public port already taken' });
            socket.destroy();
            return;
          }

          tunnelsById.set(msg.tunnelId, tunnel);
          createPublicListener(tunnel);
          sendControlMessage(socket, { type: 'registered', status: 'ok', publicPort: tunnel.publicPort });
          console.log(`Registered tunnel ${tunnel.tunnelId} for public port ${tunnel.publicPort}`);
          break;
        }
        case 'data': {
          const payload = Buffer.from(msg.payload || '', 'base64');
          const clientSocket = tunnel?.connections.get(msg.connId);
          if (clientSocket && !clientSocket.destroyed) {
            clientSocket.write(payload);
          }
          break;
        }
        case 'close': {
          const clientSocket = tunnel?.connections.get(msg.connId);
          if (clientSocket) {
            clientSocket.destroy();
            tunnel.connections.delete(msg.connId);
          }
          break;
        }
        case 'ready': {
          console.log(`Relay: agent signaled connection ready for ${msg.connId}`);
          break;
        }
        case 'error': {
          console.error('Relay server received error from agent:', msg.message || msg.error);
          break;
        }
        default:
          console.warn('Relay server received unknown control message type:', msg.type);
          break;
      }
    }
  });

  socket.on('close', () => {
    if (tunnel) {
      console.log(`Control channel closed for tunnel ${tunnel.tunnelId}`);
      closeTunnel(tunnel);
      tunnelsById.delete(tunnel.tunnelId);
    }
  });

  socket.on('error', (err) => {
    console.error('Relay control socket error:', err.message);
  });
}

const controlServer = net.createServer(handleControlConnection);
controlServer.listen(CONTROL_PORT, PUBLIC_BIND_HOST, () => {
  console.log(`🚀 BridgeFlux relay server listening for agent connections on ${PUBLIC_BIND_HOST}:${CONTROL_PORT}`);
  console.log('Set TCP host DNS to point at this machine and use --relay-host/--relay-port from the CLI.');
});

controlServer.on('error', (err) => {
  console.error('Relay control server error:', err.message);
});
