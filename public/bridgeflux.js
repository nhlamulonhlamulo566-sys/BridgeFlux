#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

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

function help() {
  console.log('BridgeFlux CLI stub');
  console.log('Usage: bridgeflux connect --port <port> --token <token> --base <url> [--tunnel-id <id>]');
  console.log('       bridgeflux service install --port <port> --token <token> --startup automatic');
  console.log('       bridgeflux disconnect');
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
    writeLog(`connect port=${port} token=${token} tunnelId=${tunnelId} base=${base} latency=${payload.latency || latency} status=${response.status}`);
    return true;
  } catch (error) {
    console.error('BridgeFlux agent notification error:', error.message || error);
    writeLog(`connect-error port=${port} token=${token} tunnelId=${tunnelId} base=${base} error=${error.message || error}`);
    return false;
  }
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
    const latency = `${Math.floor(Math.random() * 40) + 10}ms`;

    if (base) {
      const success = await notifyAgentConnect({ base, tunnelId, token, port, latency });
      if (success) process.exit(0);
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
