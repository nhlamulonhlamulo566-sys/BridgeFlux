import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  const rawBody = await request.text();

  try {
    const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';

    const parseUrlEncoded = (value: string) => Object.fromEntries(new URLSearchParams(value));

    const parseJsonSafe = (value: string) => {
      try {
        return JSON.parse(value);
      } catch {
        return parseUrlEncoded(value);
      }
    };

    const body = rawBody.trim().length === 0
      ? {}
      : contentType.includes('application/x-www-form-urlencoded')
        ? parseUrlEncoded(rawBody)
        : contentType.includes('application/json')
          ? parseJsonSafe(rawBody)
          : rawBody.trim().startsWith('{') || rawBody.trim().startsWith('[')
            ? parseJsonSafe(rawBody)
            : parseUrlEncoded(rawBody);

    const { token, tunnelId, port, latency } = body as {
      token?: string;
      tunnelId?: string;
      port?: string | number;
      latency?: string;
    };

    const ensurePublicEndpoint = (tunnelData: any, resolvedTunnelId?: string) => {
      const update: Record<string, any> = {};
      const type = tunnelData?.type === 'TCP' ? 'TCP' : 'HTTP';
      const fallbackId = resolvedTunnelId ?? '';

      if (!tunnelData?.publicUrl) {
        if (type === 'TCP') {
          update.publicUrl = 'tcp.flux.io';
        } else {
          const fallbackSubdomain = tunnelData?.subdomain
            || tunnelData?.name?.toString().toLowerCase().replace(/[^a-z0-9]/g, '-')
            || `app-${fallbackId.slice(-6)}`;
          update.publicUrl = `${fallbackSubdomain}.flux.io`;
        }
      }

      if (tunnelData?.publicPort == null || tunnelData.publicPort === '') {
        update.publicPort = type === 'TCP'
          ? Math.floor(Math.random() * (20000 - 10000) + 10000)
          : 443;
      }

      return update;
    };

    const portNumber = typeof port === 'string' ? parseInt(port, 10) : port;
    if (!token || !portNumber) {
      return NextResponse.json({ error: 'Missing required tunnel activation payload.' }, { status: 400 });
    }

    const db = getAdminFirestore();
    let tunnelRef;
    let tunnelDoc;
    let resolvedTunnelId = tunnelId;

    if (tunnelId) {
      tunnelRef = db.collection('tunnels').doc(tunnelId);
      tunnelDoc = await tunnelRef.get();

      if (!tunnelDoc.exists) {
        return NextResponse.json({ error: 'Tunnel not found.' }, { status: 404 });
      }
    } else {
      const tunnelQuery = await db.collection('tunnels')
        .where('userId', '==', token)
        .where('localPort', '==', portNumber)
        .get();

      if (tunnelQuery.empty) {
        return NextResponse.json({ error: 'No matching tunnel found for this token and port.' }, { status: 404 });
      }

      if (tunnelQuery.size > 1) {
        return NextResponse.json({ error: 'Multiple tunnels match this token and port. Please provide a tunnelId.' }, { status: 400 });
      }

      tunnelDoc = tunnelQuery.docs[0];
      tunnelRef = tunnelDoc.ref;
      resolvedTunnelId = tunnelDoc.id;
    }

    const tunnelData = tunnelDoc.data();
    if (tunnelData?.userId !== token) {
      return NextResponse.json({ error: 'Unauthorized tunnel activation.' }, { status: 403 });
    }

    const activeLatency = typeof latency === 'string' && latency.trim().length > 0
      ? latency
      : `${Math.floor(Math.random() * 40) + 10}ms`;

    const publicUpdate = ensurePublicEndpoint(tunnelData, resolvedTunnelId);
    const updateData: Record<string, any> = {
      latency: activeLatency,
      agentConnected: true,
      status: 'active',
      lastSeen: Timestamp.now(),
      updatedAt: Timestamp.now(),
      ...publicUpdate,
    };

    await tunnelRef.update(updateData);

    console.log(`Agent connect: activated tunnel ${resolvedTunnelId} (user=${token}) latency=${activeLatency}`);

    return NextResponse.json({
      success: true,
      latency: activeLatency,
      publicUrl: updateData.publicUrl ?? tunnelData.publicUrl,
      publicPort: updateData.publicPort ?? tunnelData.publicPort,
    });
  } catch (error) {
    console.error('Agent connect failed:', error);
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error && error.stack ? error.stack : undefined;

    if (process.env.BRIDGEFLUX_DEBUG === 'true') {
      // Include a preview of headers (with Authorization masked) to aid debugging on deployed environments.
      const headersPreview: Record<string, string> = {};
      try {
        for (const [k, v] of request.headers.entries()) {
          headersPreview[k] = k.toLowerCase() === 'authorization' ? 'REDACTED' : String(v);
        }
      } catch (hdrErr) {
        // Non-fatal: if header iteration fails, continue without headers
      }

      // Return detailed error information in debug mode to help diagnose deployment issues.
      return NextResponse.json({
        error: {
          message,
          stack,
          rawBodyLength: rawBody.length,
          rawBodyPreview: rawBody.slice(0, 200),
          headersPreview,
        },
      }, { status: 500 });
    }

    return NextResponse.json({ error: 'Failed to activate tunnel.' }, { status: 500 });
  }
}
