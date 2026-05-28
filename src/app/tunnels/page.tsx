"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { ActiveTunnelList } from "@/components/tunnels/ActiveTunnelList";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, SlidersHorizontal, Zap, Loader2, Activity, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase, useFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useState, useEffect, useMemo } from "react";
import { useSessionToken } from "@/lib/session";

export default function TunnelsPage() {
  const db = useFirestore();
  const { authReady, authUser } = useFirebase();
  const { token } = useSessionToken();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tunnelsQuery = useMemoFirebase(() => {
    if (!db || !token || !authReady) return null;
    return query(collection(db, "tunnels"), where("userId", "==", token));
  }, db, token, authReady, authUser);

  const trafficQuery = useMemoFirebase(() => {
    if (!db || !token || !authReady) return null;
    return query(
      collection(db, "traffic_logs"),
      where("userId", "==", token)
    );
  }, db, token, authReady, authUser);

  const { data: tunnels, loading: tunnelsLoading } = useCollection<any>(tunnelsQuery);
  const { data: trafficRaw, loading: trafficLoading } = useCollection<any>(trafficQuery);

  const activeTunnels = tunnels?.filter((t: any) => t.status === 'active') || [];
  const activeCount = activeTunnels.length;
  const totalLimit = 50; 
  const quotaPercentage = (activeCount / totalLimit) * 100;

  const dynamicLatency = useMemo(() => {
    if (!mounted || !trafficRaw || trafficRaw.length === 0) return 0;
    const sorted = [...trafficRaw].sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).slice(0, 20);
    const sum = sorted.reduce((acc, log) => acc + (log.latency || 0), 0);
    return Math.round(sum / sorted.length);
  }, [trafficRaw, mounted]);

  if (!mounted) return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
        
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-headline font-bold mb-2 text-foreground flex items-center">
              Active Tunnels <Zap className="ml-3 text-primary w-6 h-6" />
            </h1>
            <p className="text-muted-foreground font-medium">Detailed status and real-time handshaking for all your public edge connections.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8">
          <Card className="bg-card/40 backdrop-blur-md border-primary/10">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Filter by name or subdomain..." className="pl-10 bg-background/50 border-primary/10 h-10 text-sm" />
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="text-xs border-primary/10 font-bold h-9">
                    <SlidersHorizontal className="w-3 h-3 mr-2" /> Filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ActiveTunnelList />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-primary/10 bg-secondary/20 flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Edge Distribution</h3>
                <p className="text-sm text-foreground font-medium flex items-center">
                  <Globe className="w-3.5 h-3.5 mr-2 text-primary" /> Global Points of Presence
                </p>
              </div>
              <div className="mt-6 flex space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-primary/10 bg-secondary/20">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Quota Usage</h3>
              {tunnelsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <>
                  <div className="w-full bg-background rounded-full h-2 mb-3 overflow-hidden border border-white/5">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-1000 ease-in-out glow-blue" 
                      style={{ width: `${quotaPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{activeCount} of {totalLimit} slots occupied</p>
                </>
              )}
            </div>

            <div className="p-6 rounded-xl border border-primary/10 bg-secondary/20 relative overflow-hidden group">
              <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                <Activity className="w-12 h-12" />
              </div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Mesh Latency</h3>
              {trafficLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
              ) : (
                <div className="flex items-center space-x-3">
                  <p className="text-3xl font-headline font-bold text-accent transition-all tracking-tighter">
                    {dynamicLatency > 0 ? `${dynamicLatency}ms` : '---'}
                  </p>
                  {dynamicLatency > 0 && <Zap className="w-4 h-4 text-accent animate-pulse" />}
                </div>
              )}
              <p className="text-[9px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">
                {dynamicLatency > 0 
                  ? `Real-time Moving Average` 
                  : 'Awaiting local agent traffic...'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}