# BridgeFlux Relay Gateway

This gateway layer is required to turn the tunnel metadata (`tcp.flux.io:<port>`) into a real public TCP relay.

## How it works

- The CLI agent connects outbound to the relay server over a control channel.
- The relay server listens on a public TCP port for incoming connections.
- When a public client connects, the relay server asks the agent to open a local connection and forwards traffic.

## Run the relay server

1. Deploy this `gateway/relay-server.js` on a publicly reachable host.
2. Make sure the host is reachable via the public hostname used by tunnels, e.g. `tcp.flux.io`.
3. Run:

```bash
node gateway/relay-server.js 5000
```

Or set environment variables:

```bash
RELAY_CONTROL_PORT=5000 RELAY_BIND_HOST=0.0.0.0 node gateway/relay-server.js
```

## Start the CLI agent with relay mode

Use the CLI agent and provide the relay host and port:

```bash
node public/bridgeflux.js connect --port 3306 --token <TOKEN> --tunnel-id <TUNNEL_ID> --base https://bridge-flux.vercel.app --relay-host tcp.flux.io --relay-port 5000 --public-port 16567
```

> The CLI will keep the relay connection open and forward remote traffic from `tcp.flux.io:16567` into the local service.

## Notes

- The relay server must run on a machine with a public IP or DNS name.
- This file is a lightweight proof of concept that uses a simple JSON-over-TCP control protocol.
- For production, run the relay server on a dedicated host or container with the desired `tcp.flux.io` DNS target.
