import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const { token, tunnelId, bytesTransferred, mbps, timestamp } = body as {
      token?: string;
      tunnelId?: string;
      bytesTransferred?: number;
      mbps?: number;
      timestamp?: string;
    };

    console.log(`[throughput-route] Received: token=${token?.slice(-8)}, tunnelId=${tunnelId?.slice(-8)}, bytes=${bytesTransferred}, mbps=${mbps}`);

    if (!token || !tunnelId) {
      console.error('[throughput-route] Missing token or tunnelId');
      return NextResponse.json(
        { error: 'Missing required tunnel identification.' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const tunnelRef = db.collection('tunnels').doc(tunnelId);
    const tunnelDoc = await tunnelRef.get();

    if (!tunnelDoc.exists) {
      console.error(`[throughput-route] Tunnel not found: ${tunnelId}`);
      return NextResponse.json({ error: 'Tunnel not found.' }, { status: 404 });
    }

    const tunnelData = tunnelDoc.data();
    if (tunnelData?.userId !== token) {
      console.error(`[throughput-route] Unauthorized: token mismatch`);
      return NextResponse.json(
        { error: 'Unauthorized tunnel access.' },
        { status: 403 }
      );
    }

    const updatedTotalBytes = (tunnelData?.totalBytesTransferred || 0) + (bytesTransferred || 0);
    const logTimestamp = timestamp ? new Date(timestamp) : new Date();

    // Update tunnel with throughput metrics
    await tunnelRef.update({
      lastThroughputMbps: mbps || 0,
      totalBytesTransferred: updatedTotalBytes,
      lastThroughputUpdate: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log(`[throughput-route] Updated tunnel: throughput=${mbps}mbps, totalBytes=${updatedTotalBytes}`);

    // Record a traffic log entry for the dashboard and inspector
    try {
      const logDoc = await db.collection('traffic_logs').add({
        userId: token,
        tunnelId,
        size: bytesTransferred || 0,
        bytesTransferred: bytesTransferred || 0,
        latency: Math.round((mbps || 0) * 1000), // Convert Mbps to a reasonable latency-like number
        method: 'POST',
        path: '/api/agent/throughput',
        status: 200,
        timestamp: Timestamp.fromDate(logTimestamp),
        createdAt: Timestamp.now(),
      });
      console.log(`[throughput-route] Created traffic log: ${logDoc.id}`);
    } catch (logErr) {
      console.error('[throughput-route] Failed to create traffic log:', logErr instanceof Error ? logErr.message : logErr);
      // Don't fail the entire request if traffic_logs fails, but log it
    }

    return NextResponse.json({
      success: true,
      totalBytesTransferred: updatedTotalBytes,
    });
  } catch (error) {
    console.error('[throughput-route] Unhandled error:', error instanceof Error ? error.message : error);
    if (error instanceof Error) {
      console.error('[throughput-route] Stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Failed to record throughput data.' },
      { status: 500 }
    );
  }
}
