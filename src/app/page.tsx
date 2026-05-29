
"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActiveTunnelList } from "@/components/tunnels/ActiveTunnelList";
import { TrafficStream } from "@/components/dashboard/TrafficStream";
import { SmartDiagnostics } from "@/components/diagnostics/SmartDiagnostics";
import { TerminalGenerator } from "@/components/tools/TerminalGenerator";
import { Activity, Zap, ShieldCheck, ArrowRight, Globe, Lock, Loader2, Key, Network, Cpu, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase, useFirebase } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useState, useEffect, useMemo } from "react";
import { useSessionToken } from "@/lib/session";

export default function Home() {
  const db = useFirestore();
  const { authReady, authUser } = useFirebase();
  const { token } = useSessionToken();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tunnelsQuery = useMemoFirebase(() => {
    if (!db || !mounted || !token || !authReady) return null;
    return query(collection(db, "tunnels"), where("userId", "==", token));
  }, db, mounted, token, authReady, authUser);

  const domainsQuery = useMemoFirebase(() => {
    if (!db || !mounted || !token || !authReady) return null;
    return query(collection(db, "domains"), where("userId", "==", token));
  }, db, mounted, token, authReady, authUser);

  const trafficQuery = useMemoFirebase(() => {
    if (!db || !mounted || !token || !authReady) return null;
    return query(
      collection(db, "traffic_logs"),
      where("userId", "==", token),
      limit(50)
    );
  }, db, mounted, token, authReady, authUser);

  const { data: tunnels } = useCollection(tunnelsQuery);
  const { data: domains } = useCollection(domainsQuery);
  const { data: trafficRaw } = useCollection<any>(trafficQuery);

  const traffic = useMemo(() => {
    if (!trafficRaw) return [];
    return [...trafficRaw].sort((a, b) => {
      const timeA = a.timestamp?.seconds || 0;
      const timeB = b.timestamp?.seconds || 0;
      return timeB - timeA;
    });
  }, [trafficRaw]);

  const activeTunnelsCount = useMemo(() => 
    tunnels?.filter((t: any) => t.status === 'active' || t.latency !== '---').length || 0, 
    [tunnels]
  );
  
  const totalReservedCount = domains?.length || 0;

  const throughputMB = useMemo(() => {
    if (!traffic || traffic.length === 0) return '0.00';
    const totalBytes = traffic.reduce((acc: number, log: any) => acc + (log.size || 0), 0);
    const timestamps = traffic
      .map((log: any) => log.timestamp?.toDate?.())
      .filter((value: any) => value instanceof Date);

    if (timestamps.length < 2) {
      return (totalBytes / (1024 * 1024)).toFixed(2);
    }

    const sortedTimestamps = timestamps.sort((a: Date, b: Date) => a.getTime() - b.getTime());
    const durationHours = Math.max((sortedTimestamps[sortedTimestamps.length - 1].getTime() - sortedTimestamps[0].getTime()) / 3600000, 1 / 60);
    return (totalBytes / (1024 * 1024) / durationHours).toFixed(2);
  }, [traffic]);

  const wafLatency = useMemo(() => {
    const trafficLatencies = traffic
      ?.map((log: any) => Number(String(log.latency || '').replace(/[^0-9.]/g, '')))
      .filter((latency: number) => !Number.isNaN(latency) && latency > 0) || [];

    if (trafficLatencies.length > 0) {
      const avgLatency = trafficLatencies.reduce((acc: number, value: number) => acc + value, 0) / trafficLatencies.length;
      return `${Math.round(avgLatency)}ms`;
    }

    const tunnelLatencies = tunnels
      ?.map((t: any) => Number(String(t.latency || '').replace(/[^0-9.]/g, '')))
      .filter((latency: number) => !Number.isNaN(latency) && latency > 0) || [];

    if (tunnelLatencies.length > 0) {
      const avgLatency = tunnelLatencies.reduce((acc: number, value: number) => acc + value, 0) / tunnelLatencies.length;
      return `${Math.round(avgLatency)}ms`;
    }

    return '---';
  }, [traffic, tunnels]);

  const chartData = useMemo(() => {
    if (!mounted || !traffic || traffic.length === 0) {
      return Array(10).fill(0).map((_, i) => ({ time: i.toString(), size: 0 }));
    }
    return traffic.slice(0, 15).reverse().map((log: any) => ({
      time: log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '...',
      size: log.size || 0,
    }));
  }, [traffic, mounted]);

  if (!mounted) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

  return (
    <div className="flex min-h-screen bg-background overflow-hidden font-body">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute top-0 right-0 w-[min(40vw,600px)] h-[min(40vw,600px)] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 space-y-4 md:space-y-0">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-4xl font-headline font-bold text-white tracking-tight">Mission Control</h1>
              <Badge className="bg-primary/20 text-primary border-none font-mono text-[10px] uppercase tracking-widest px-3 py-1">Edge Mesh: Active</Badge>
            </div>
            <p className="text-muted-foreground flex items-center text-sm font-medium">
              <Key className="w-3.5 h-3.5 mr-2 text-primary/60" /> Session Identity: <span className="text-foreground ml-1 font-mono truncate max-w-[250px]">{token || 'Initializing...'}</span>
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex flex-col items-end text-right">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mesh Pulse</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse"></div>
                <span className="text-xs font-mono font-bold">142 Global Nodes</span>
              </div>
            </div>
            <div className="h-10 w-px bg-white/5 mx-2 hidden lg:block"></div>
            <div className="flex items-center space-x-2.5 px-5 py-2.5 bg-secondary/30 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl">
              <Network className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-white/80">Handshake: Verified</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard label="Active Tunnels" value={activeTunnelsCount.toString()} subValue={`/ ${tunnels?.length || 0}`} icon={Zap} color="primary" />
          <StatCard label="Edge Domains" value={totalReservedCount.toString()} subValue="Reserved" icon={Globe} color="accent" />
          <StatCard label="Throughput" value={throughputMB} subValue="MB/hr" icon={Activity} trend="up" color="primary" />
          <StatCard label="WAF Latency" value={wafLatency} subValue="Avg" icon={Database} color="accent" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          <div className="xl:col-span-2 space-y-10">
            <ActiveTunnelList />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-headline font-bold flex items-center text-white">
                    Mesh Telemetry <Activity className="w-4 h-4 ml-2 text-primary opacity-50" />
                  </h2>
                </div>
                <div className="glass-panel border-primary/10 rounded-2xl p-6 h-[280px] relative overflow-hidden">
                  <div className="absolute top-4 right-6 z-10 flex items-center space-x-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Live Flow</span>
                      <span className="text-xs font-mono text-primary font-bold">Encrypted (TLS 1.3)</span>
                    </div>
                  </div>
                  <ChartContainer config={{ size: { label: "Bytes", color: "hsl(var(--primary))" } }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorSize" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="time" hide />
                        <YAxis hide />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="size" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorSize)" strokeWidth={3} animationDuration={1000} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
                <div className="h-[380px]">
                  <TrafficStream />
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-lg font-headline font-bold flex items-center text-white">
                  Agent Deployment <Cpu className="w-4 h-4 ml-2 text-accent opacity-50" />
                </h2>
                <TerminalGenerator />
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/domains" className="group">
                    <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-primary/20 hover:border-primary/60 transition-all cursor-pointer h-full group-hover:scale-[1.02]">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:glow-blue transition-all border border-primary/5">
                        <Globe className="text-primary w-7 h-7" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Edge Domains</span>
                    </div>
                  </Link>
                  <Link href="/security" className="group">
                    <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-accent/20 hover:border-accent/60 transition-all cursor-pointer h-full group-hover:scale-[1.02]">
                      <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:glow-azure transition-all border border-accent/5">
                        <Lock className="text-accent w-7 h-7" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-accent transition-colors">Access Rules</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <div className="space-y-5">
              <h2 className="text-lg font-headline font-bold text-white flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2 text-accent" /> AI Security
              </h2>
              <SmartDiagnostics />
            </div>

            <div className="bg-gradient-to-br from-primary via-primary/80 to-primary/60 border border-white/10 rounded-3xl p-8 text-primary-foreground shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              <div className="relative z-10">
                <Badge className="bg-white/20 text-white border-none mb-4 text-[9px] uppercase tracking-widest px-2 py-1">Enterprise Ready</Badge>
                <h3 className="text-2xl font-headline font-bold mb-3">Global Resilience</h3>
                <p className="text-xs opacity-80 mb-8 leading-relaxed font-medium">
                  BridgeFlux tunnels are permanent. Closing this dashboard will not terminate active bridges. Your identity is locked to this device.
                </p>
                <Link href="/scripts">
                  <button className="w-full py-4 bg-white text-primary font-bold rounded-2xl text-xs hover:shadow-xl hover:translate-y-[-2px] active:translate-y-[0px] transition-all flex items-center justify-center">
                    Get Deployment Command <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
