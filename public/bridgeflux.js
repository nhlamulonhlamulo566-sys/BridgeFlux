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
  console.log('Usage: bridgeflux connect --port <port> --token <token>');
  console.log('       bridgeflux service install --port <port> --token <token> --startup automatic');
  console.log('       bridgeflux disconnect');
  process.exit(0);
}

if (args.length === 0) {
  help();
}

const cmd = args[0];
if (cmd === 'connect') {
  const portIndex = args.indexOf('--port');
  const tokenIndex = args.indexOf('--token');
  const port = portIndex >= 0 ? args[portIndex + 1] : 'unknown';
  const token = tokenIndex >= 0 ? args[tokenIndex + 1] : 'unknown';
  console.log(`✅ BridgeFlux CLI stub: connected to localhost:${port} using token ${token}`);
  writeLog(`connect port=${port} token=${token}`);
  process.exit(0);
}

if (cmd === 'service') {
  const subcmd = args[1];
  if (subcmd === 'install') {
    const portIndex = args.indexOf('--port');
    const tokenIndex = args.indexOf('--token');
    const port = portIndex >= 0 ? args[portIndex + 1] : 'unknown';
    const token = tokenIndex >= 0 ? args[tokenIndex + 1] : 'unknown';
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
