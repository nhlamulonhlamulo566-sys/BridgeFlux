const net = require('net');
const RELAY_HOST = '127.0.0.1';
const RELAY_PORT = 5000;
const LOCAL_ECHO_PORT = 13306;
const PUBLIC_PORT = 16567;
const TEST_MESSAGE = 'hello-relay-test';

function serialize(payload) {
  return `${JSON.stringify(payload)}\n`;
}

function startEchoServer() {
  return new Promise((resolve, reject) => {
    const server = net.createServer((socket) => {
      socket.on('data', (data) => {
        socket.write(data);
      });
    });

    server.on('error', reject);
    server.listen(LOCAL_ECHO_PORT, '127.0.0.1', () => resolve(server));
  });
}

function connectRelay() {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: RELAY_HOST, port: RELAY_PORT }, () => {
      const register = {
        type: 'register',
        token: 'echo-test-token',
        tunnelId: 'echo-test-tunnel',
        localPort: LOCAL_ECHO_PORT,
        publicPort: PUBLIC_PORT,
      };
      socket.write(serialize(register));
    });

    let buffer = '';
    const connectionMap = new Map();

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
          reject(new Error(`Invalid JSON from relay: ${err.message}`));
          return;
        }

        if (msg.type === 'registered') {
          if (msg.status !== 'ok') {
            reject(new Error(`Relay register failed: ${msg.error || 'unknown'}`));
            return;
          }
          resolve({ socket, connectionMap });
          return;
        }

        if (msg.type === 'new_connection') {
          const connId = msg.connId;
          const localSocket = net.createConnection({ host: '127.0.0.1', port: LOCAL_ECHO_PORT }, () => {
            socket.write(serialize({ type: 'ready', connId }));
          });

          localSocket.on('data', (data) => {
            socket.write(serialize({ type: 'data', connId, payload: data.toString('base64') }));
          });

          localSocket.on('close', () => {
            socket.write(serialize({ type: 'close', connId }));
            connectionMap.delete(connId);
          });

          localSocket.on('error', (err) => {
            socket.write(serialize({ type: 'error', connId, message: err.message }));
            connectionMap.delete(connId);
          });

          connectionMap.set(connId, localSocket);
          return;
        }

        if (msg.type === 'data') {
          const localSocket = connectionMap.get(msg.connId);
          if (localSocket) {
            localSocket.write(Buffer.from(msg.payload, 'base64'));
          }
          return;
        }

        if (msg.type === 'close') {
          const localSocket = connectionMap.get(msg.connId);
          if (localSocket) {
            localSocket.destroy();
            connectionMap.delete(msg.connId);
          }
          return;
        }
      }
    });

    socket.on('error', reject);
    socket.on('close', () => {
      reject(new Error('Relay control connection closed unexpectedly'));
    });
  });
}

async function runTest() {
  console.log('Starting local echo server on port', LOCAL_ECHO_PORT);
  const echoServer = await startEchoServer();

  console.log('Connecting to relay control channel...');
  const { socket: relaySocket } = await connectRelay();
  console.log(`Relay registered public port ${PUBLIC_PORT}. Waiting for public client test...`);

  const client = new net.Socket();
  client.connect(PUBLIC_PORT, '127.0.0.1', () => {
    console.log(`Connected to public endpoint 127.0.0.1:${PUBLIC_PORT}`);
    client.write(TEST_MESSAGE);
  });

  let response = '';
  client.on('data', (data) => {
    response += data.toString();
    if (response.includes(TEST_MESSAGE)) {
      console.log('Success: received echo from public endpoint:', response);
      client.destroy();
      relaySocket.destroy();
      echoServer.close(() => process.exit(0));
    }
  });

  client.on('error', (err) => {
    console.error('Public client error:', err.message);
    relaySocket.destroy();
    echoServer.close(() => process.exit(1));
  });
}

runTest().catch((err) => {
  console.error('Relay echo test failed:', err);
  process.exit(1);
});
