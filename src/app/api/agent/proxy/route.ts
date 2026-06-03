import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const { token, tunnelId, proxyPort, proxyHost, status } = body as {
      token?: string;
      tunnelId?: string;
      proxyPort?: number;
      proxyHost?: string;
      status?: 'connected' | 'disconnected';
    };

    if (!token || !tunnelId) {
      return NextResponse.json(
        { error: 'Missing required tunnel identification.' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const tunnelRef = db.collection('tunnels').doc(tunnelId);
    const tunnelDoc = await tunnelRef.get();

    if (!tunnelDoc.exists) {
      return NextResponse.json({ error: 'Tunnel not found.' }, { status: 404 });
    }

    const tunnelData = tunnelDoc.data();
    if (tunnelData?.userId !== token) {
      return NextResponse.json(
        { error: 'Unauthorized tunnel access.' },
        { status: 403 }
      );
    }

    // Update tunnel with proxy connection details
    const updateData: Record<string, any> = {
      updatedAt: Timestamp.now(),
    };

    if (proxyPort && proxyHost) {
      updateData.proxyPort = proxyPort;
      updateData.proxyHost = proxyHost;
      updateData.proxyConnected = true;
      updateData.proxyConnectedAt = Timestamp.now();
      console.log(
        `Proxy registered for tunnel ${tunnelId}: ${proxyHost}:${proxyPort}`
      );
    }

    if (status === 'disconnected') {
      updateData.proxyConnected = false;
      updateData.proxyDisconnectedAt = Timestamp.now();
    }

    await tunnelRef.update(updateData);

    return NextResponse.json({
      success: true,
      proxyPort,
      proxyHost,
      tunnelId,
    });
  } catch (error) {
    console.error('Proxy registration failed:', error);
    return NextResponse.json(
      { error: 'Failed to register proxy.' },
      { status: 500 }
    );
  }
}
