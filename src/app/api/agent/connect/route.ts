import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, tunnelId, port, latency } = body as {
      token?: string;
      tunnelId?: string;
      port?: string | number;
      latency?: string;
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

    await tunnelRef.update({
      latency: activeLatency,
      agentConnected: true,
      status: 'active',
      lastSeen: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log(`Agent connect: activated tunnel ${resolvedTunnelId} (user=${token}) latency=${activeLatency}`);

    return NextResponse.json({ success: true, latency: activeLatency });
  } catch (error) {
    console.error('Agent connect failed:', error);
    const message = error instanceof Error ? error.message : String(error);
    const responseError = process.env.BRIDGEFLUX_DEBUG === 'true'
      ? message
      : 'Failed to activate tunnel.';
    return NextResponse.json({ error: responseError }, { status: 500 });
  }
}
