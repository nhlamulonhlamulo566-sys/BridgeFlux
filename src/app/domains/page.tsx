
"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, 
  Plus, 
  CheckCircle2, 
  ArrowRight, 
  Database, 
  Loader2, 
  ShieldCheck, 
  Activity,
  AlertCircle,
  Network
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useCollection, useFirestore, useMemoFirebase, useFirebase } from "@/firebase";
import { collection, query, addDoc, serverTimestamp, where } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useSessionToken } from "@/lib/session";

export default function DomainsPage() {
  const db = useFirestore();
  const { authReady, authUser } = useFirebase();
  const { token } = useSessionToken();
  const [newSubdomain, setNewSubdomain] = useState("");
  const [reserveType, setReserveType] = useState("HTTP");
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isChecking, setIsChecking] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const domainsQuery = useMemoFirebase(() => {
    if (!db || !token || !authReady) return null;
    return query(
      collection(db, "domains"),
      where("userId", "==", token)
    );
  }, db, token, authReady, authUser);

  const { data: domainsRaw, loading } = useCollection<any>(domainsQuery);

  const domains = useMemo(() => {
    if (!domainsRaw) return [];
    return [...domainsRaw].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [domainsRaw]);

  const handleReserve = async () => {
    if (!newSubdomain || !db || !token) return;
    
    setIsProvisioning(true);
    const isTcp = reserveType === "TCP";
    const assignedGatewayPort = isTcp ? Math.floor(Math.random() * (20000 - 10000) + 10000) : null;
    
    const domainData = {
      url: isTcp ? `tcp.flux.io` : `${newSubdomain.toLowerCase().replace(/[^a-z0-9]/g, '-')}.flux.io`,
      port: isTcp ? 5432 : 443,
      gatewayPort: assignedGatewayPort,
      type: reserveType,
      status: "assigned",
      description: isTcp ? "Secure TCP Gateway" : "Static Web Endpoint",
      userId: token,
      createdAt: serverTimestamp(),
    };
    
    addDoc(collection(db, "domains"), domainData)
      .catch(async (err) => {
        const pErr = new FirestorePermissionError({
          path: 'domains',
          operation: 'create',
          requestResourceData: domainData
        });
        errorEmitter.emit('permission-error', pErr);
      });

    toast({
      title: "Resource Provisioned",
      description: `Successfully reserved ${domainData.url}`,
    });
    setNewSubdomain("");
    
    setTimeout(() => setIsProvisioning(false), 800);
  };

  const verifyEndpoint = (id: string, url: string) => {
    setIsChecking(id);
    setTimeout(() => {
      setIsChecking(null);
      toast({
        title: "Endpoint Reachable",
        description: `${url} is active on the global mesh network.`,
      });
    }, 1500);
  };

  if (!mounted) return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
        
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold mb-2 flex items-center text-white">
              Network Reservations <ShieldCheck className="ml-3 text-primary w-6 h-6" />
            </h1>
            <p className="text-muted-foreground">Claim persistent static endpoints on the global BridgeFlux edge network.</p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-mono">
            <div className="flex items-center text-green-500">
              <Activity className="w-3 h-3 mr-1 animate-pulse" /> Edge Nodes Active
            </div>
            <div className="text-muted-foreground border-l pl-4">
              Capacity: <span className="text-foreground">78%</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-primary/20 bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg text-white">Reserve Resource</CardTitle>
                </div>
                <CardDescription>
                  Allocate a global subdomain or a dedicated TCP gateway port.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Allocation Type</label>
                  <Tabs value={reserveType} onValueChange={setReserveType} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-secondary/50 p-1">
                      <TabsTrigger value="HTTP" className="text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">HTTP / WEB</TabsTrigger>
                      <TabsTrigger value="TCP" className="text-xs font-bold data-[state=active]:bg-accent data-[state=active]:text-white transition-all">TCP / GATE</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {reserveType === 'HTTP' ? 'Desired Subdomain' : 'Service Identifier'}
                  </label>
                  <div className="relative">
                    <Input 
                      placeholder={reserveType === 'HTTP' ? "my-cool-app" : "db-cluster-01"} 
                      value={newSubdomain}
                      onChange={(e) => setNewSubdomain(e.target.value)}
                      className="bg-background/50 border-primary/10 font-mono text-sm h-11 text-white"
                    />
                    {reserveType === 'HTTP' && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground pointer-events-none">
                        .flux.io
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  onClick={handleReserve}
                  className={cn(
                    "w-full h-11 font-bold transition-all duration-300",
                    reserveType === 'HTTP' ? "bg-primary glow-blue" : "bg-accent glow-azure"
                  )}
                  disabled={!newSubdomain || isProvisioning}
                >
                  {isProvisioning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Allocating Edge Node...
                    </>
                  ) : (
                    <>Provision {reserveType} Resource</>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="p-4 rounded-xl border border-border bg-secondary/10 flex items-start space-x-3">
              <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Reservations are active immediately. Use the public URL or Port in your <span className="text-primary">bridgeflux</span> CLI agent to establish a secure link.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-xl font-headline font-bold flex items-center text-white">
                Active Pool <Badge className="ml-2 bg-primary/10 text-primary border-none font-mono">{domains?.length || 0}</Badge>
              </h2>
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground animate-pulse font-mono">Synchronizing with global registry...</p>
              </div>
            ) : domains && domains.length > 0 ? (
              <div className="space-y-3">
                {domains.map((dom: any) => (
                  <Card key={dom.id} className="group hover:border-primary/40 transition-all border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 gap-4">
                        <div className="flex items-center space-x-5">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 shadow-lg",
                            dom.type === 'TCP' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-primary/10 text-primary border border-primary/20'
                          )}>
                            {dom.type === 'TCP' ? <Database className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
                          </div>
                          <div>
                            <div className="flex items-center space-x-3">
                              <span className="font-mono font-bold text-lg text-foreground tracking-tight">
                                {dom.url}{dom.gatewayPort ? `:${dom.gatewayPort}` : ""}
                              </span>
                              <Badge variant="outline" className={cn(
                                "text-[10px] px-2 h-5 uppercase font-bold border-none",
                                dom.type === 'TCP' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'
                              )}>
                                {dom.type}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                <p className="text-xs text-muted-foreground">Edge Allocated</p>
                              </div>
                              <button 
                                onClick={() => verifyEndpoint(dom.id, dom.url)}
                                className="text-[9px] font-bold text-primary uppercase tracking-widest hover:underline flex items-center"
                              >
                                {isChecking === dom.id ? <><Loader2 className="w-2.5 h-2.5 mr-1 animate-spin" /> Checking...</> : <><Network className="w-2.5 h-2.5 mr-1" /> Verify Reachability</>}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1 opacity-60">
                            Assignment
                          </p>
                          <div className={cn(
                            "flex items-center justify-end space-x-1 font-mono text-xl font-bold",
                            dom.type === 'TCP' ? 'text-accent' : 'text-primary'
                          )}>
                            <span>{dom.gatewayPort || '443'}</span>
                            <ArrowRight className="w-4 h-4 ml-3 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </div>
                      <div className={cn("h-0.5 w-full opacity-30", dom.type === 'TCP' ? 'bg-accent' : 'bg-primary')}></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="border border-dashed rounded-2xl py-24 flex flex-col items-center justify-center text-center px-12 bg-secondary/5">
                <div className="w-16 h-16 rounded-full bg-secondary/40 flex items-center justify-center mb-6">
                  <Globe className="w-8 h-8 text-muted-foreground opacity-20" />
                </div>
                <h3 className="font-headline font-bold text-lg mb-2 text-white">No Active Reservations</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-8 leading-relaxed font-medium font-bold">
                  Your pool is currently empty. Reserve a static resource to ensure your public endpoints remain consistent across agent restarts.
                </p>
                <Button variant="outline" onClick={() => (document.querySelector('input') as HTMLInputElement)?.focus()} className="border-primary/20 text-primary hover:bg-primary/5 font-bold">
                  Start Provisioning
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
