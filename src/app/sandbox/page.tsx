
"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Beaker, Zap, AlertTriangle, ShieldCheck, Play, RefreshCw, Database, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useFirestore, useFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useSessionToken } from "@/lib/session";

export default function SandboxPage() {
  const db = useFirestore();
  const { authReady, authUser } = useFirebase();
  const { token } = useSessionToken();
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addLogToConsole = (msg: string) => {
    if (!mounted) return;
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 8));
  };

  const recordTrafficLog = (method: string, path: string, status: number, size: number) => {
    if (!db || !token || !authReady || !authUser) return;
    const logData = {
      method,
      path,
      status,
      size,
      latency: Math.floor(Math.random() * 200) + 10,
      timestamp: serverTimestamp(),
      userId: token
    };
    
    addDoc(collection(db, "traffic_logs"), logData)
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'traffic_logs',
          operation: 'create',
          requestResourceData: logData
        }));
      });
  };

  const seedInitialData = async () => {
    if (!db || !token || !authReady || !authUser) return;
    setIsSeeding(true);
    addLogToConsole("Starting live database migration...");

    try {
      const batchPromises = [
        addDoc(collection(db, "tunnels"), {
          name: "Production Web API",
          subdomain: `api-${token.slice(-4)}`,
          publicUrl: `api-${token.slice(-4)}.flux.io`,
          publicPort: 443,
          localPort: 3000,
          status: "active",
          type: "HTTP",
          latency: "12ms",
          bandwidth: "2.4 MB/s",
          userId: token,
          createdAt: serverTimestamp(),
        }),
        addDoc(collection(db, "domains"), {
          url: `staging-${token.slice(-4)}.flux.io`,
          type: "HTTP",
          status: "assigned",
          description: "Internal Staging Environment",
          userId: token,
          createdAt: serverTimestamp(),
        }),
        addDoc(collection(db, "security_rules"), {
          label: "Primary Office VPN",
          cidr: "192.168.1.0/24",
          userId: token,
          createdAt: serverTimestamp(),
        })
      ];

      await Promise.all(batchPromises);

      addLogToConsole("Migration complete: Tunnels, Domains, and Rules are LIVE.");
      toast({
        title: "Database Seeded",
        description: "Initial system data has been migrated to your live Firestore.",
      });
    } catch (e) {
      addLogToConsole("Migration failed: Check your Firestore Security Rules.");
    } finally {
      setIsSeeding(false);
    }
  };

  const simulateFailure = () => {
    setIsSimulating(true);
    addLogToConsole("Simulating tunnel 'Postgres Proxy' drop...");
    setTimeout(() => {
      addLogToConsole("ERROR: Connection reset by peer at node US-EAST-1");
      setIsSimulating(false);
      recordTrafficLog("POST", "/api/v1/db-connect", 503, 0);

      toast({
        variant: "destructive",
        title: "Simulation: Tunnel Failure",
        description: "Postgres Proxy has disconnected. Check diagnostics.",
      });
    }, 1500);
  };

  if (!mounted) return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
        
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-headline font-bold text-foreground">Connectivity Sandbox</h1>
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 font-mono uppercase">Live Persistence</Badge>
            </div>
            <p className="text-muted-foreground">Trigger network events to verify real-time Firestore synchronization.</p>
          </div>
          <Button 
            onClick={seedInitialData} 
            disabled={isSeeding}
            variant="outline"
            className="border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 font-bold"
          >
            {isSeeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
            Seed Live Data
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="border-primary/20 bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-primary" /> Event Triggers
                </CardTitle>
                <CardDescription>Initiate network scenarios that write directly to Firestore.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <Button 
                  onClick={simulateFailure} 
                  disabled={isSimulating}
                  variant="outline" 
                  className="h-16 justify-between border-destructive/20 hover:bg-destructive/5 text-destructive group"
                >
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-3 group-hover:animate-bounce" />
                    <div className="text-left">
                      <p className="font-bold">Simulate Tunnel Drop</p>
                      <p className="text-[10px] opacity-70">Verifies live error log persistence.</p>
                    </div>
                  </div>
                  <Play className="w-4 h-4 opacity-50" />
                </Button>

                <Button 
                  onClick={() => {
                    addLogToConsole("Generating traffic burst...");
                    for(let i=0; i<3; i++) recordTrafficLog("GET", "/api/v1/health", 200, 1024);
                    toast({ title: "Traffic Burst Generated", description: "3 logs written to Firestore." });
                  }}
                  variant="outline" 
                  className="h-16 justify-between border-primary/20 hover:bg-primary/5 text-primary"
                >
                  <div className="flex items-center">
                    <Zap className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <p className="font-bold">Generate Traffic Burst</p>
                      <p className="text-[10px] opacity-70">Verifies real-time log ingestion.</p>
                    </div>
                  </div>
                  <Play className="w-4 h-4 opacity-50" />
                </Button>

                <Button 
                  variant="outline" 
                  className="h-16 justify-between border-accent/20 hover:bg-accent/5 text-accent"
                  onClick={() => {
                    recordTrafficLog("GET", "/admin/login", 401, 0);
                    toast({ variant: "destructive", title: "Security Alert", description: "Unauthorized access logged." });
                  }}
                >
                  <div className="flex items-center">
                    <ShieldCheck className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <p className="font-bold">Log Security Event</p>
                      <p className="text-[10px] opacity-70">Verifies access control reporting.</p>
                    </div>
                  </div>
                  <Play className="w-4 h-4 opacity-50" />
                </Button>
              </CardContent>
            </Card>

            <div className="p-6 rounded-xl border border-accent/20 bg-accent/5">
              <h3 className="font-bold text-accent mb-2 flex items-center text-sm">
                <RefreshCw className="w-4 h-4 mr-2" /> Live Console Status
              </h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Actions in this sandbox directly mutate your Firestore collections: 
                <span className="text-foreground font-mono bg-secondary/50 px-1 mx-1 rounded">traffic_logs</span>, 
                <span className="text-foreground font-mono bg-secondary/50 px-1 mx-1 rounded">tunnels</span>, and 
                <span className="text-foreground font-mono bg-secondary/50 px-1 mx-1 rounded">domains</span>. 
              </p>
            </div>
          </div>

          <Card className="border-border bg-black/40 font-mono shadow-inner overflow-hidden">
            <CardHeader className="border-b border-border/50 py-3 bg-secondary/10">
              <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground">System.Internal.Output</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[450px] overflow-y-auto p-4 space-y-2 terminal-bg scroll-hide">
                {logs.length === 0 && (
                  <p className="text-muted-foreground/30 italic text-xs">Waiting for system signals...</p>
                )}
                {logs.map((log, i) => (
                  <div key={i} className="text-xs text-green-500/80 animate-in fade-in slide-in-from-left-1 border-l border-green-500/20 pl-2">
                    {log}
                  </div>
                ))}
                {(isSimulating || isSeeding) && (
                  <div className="flex items-center space-x-2 text-xs text-primary animate-pulse pl-2">
                    <span className="w-1 h-1 rounded-full bg-primary"></span>
                    <span>Processing Firestore Transaction...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
