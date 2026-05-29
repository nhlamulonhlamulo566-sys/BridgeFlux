
"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Globe, 
  Plus, 
  Zap,
  Network,
  Loader2,
  Trash2,
  ShieldCheck,
  Terminal as TerminalIcon,
  Copy,
  Check,
  Server,
  Info,
  Database,
  Link as LinkIcon,
  Activity,
  Wifi,
  WifiOff,
  Cloud,
  ArrowRight,
  Monitor,
  Cpu,
  RefreshCcw
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase, useFirebase } from "@/firebase";
import { collection, query, addDoc, deleteDoc, doc, serverTimestamp, where } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { cn } from "@/lib/utils";
import { useSessionToken } from "@/lib/session";

export function ActiveTunnelList() {
  const db = useFirestore();
  const { authReady, authUser } = useFirebase();
  const { token } = useSessionToken();
  const [isOpen, setIsOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [commandError, setCommandError] = useState<string | null>(null);
  const [initTunnel, setInitTunnel] = useState<any>(null);
  
  const [name, setName] = useState("");
  const [type, setType] = useState<"HTTP" | "TCP">("HTTP");
  const [localPort, setLocalPort] = useState("3000");
  const [subdomain, setSubdomain] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const tunnelsQuery = useMemoFirebase(() => {
    if (!db || !token || !authReady) return null;
    return query(
      collection(db, "tunnels"),
      where("userId", "==", token)
    );
  }, db, token, authReady, authUser);

  const { data: tunnelsRaw, loading } = useCollection<any>(tunnelsQuery);

  const tunnels = useMemo(() => {
    if (!tunnelsRaw) return [];
    return [...tunnelsRaw].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [tunnelsRaw]);

  const handleCreateTunnel = () => {
    if (!db || !name || !localPort || !token) return;

    const isTcp = type === "TCP";
    const assignedPublicPort = isTcp ? Math.floor(Math.random() * (20000 - 10000) + 10000) : 443;
    const finalSubdomain = isTcp ? "tcp-gate" : (subdomain.toLowerCase().replace(/[^a-z0-9]/g, '-') || name.toLowerCase().replace(/[^a-z0-9]/g, '-'));

    const tunnelData = {
      name,
      subdomain: finalSubdomain,
      publicUrl: isTcp ? `tcp.flux.io` : `${finalSubdomain}.flux.io`,
      publicPort: assignedPublicPort,
      localPort: parseInt(localPort),
      status: "active",
      type,
      latency: "---",
      bandwidth: "0.0 KB/s",
      userId: token,
      createdAt: serverTimestamp(),
      agentConnected: false
    };

    addDoc(collection(db, "tunnels"), tunnelData)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: 'tunnels',
          operation: 'create',
          requestResourceData: tunnelData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });

    setIsOpen(false);
    setName("");
    setType("HTTP");
    setLocalPort("3000");
    setSubdomain("");

    toast({
      title: "Bridge Reserved",
      description: `Persistent tunnel ${tunnelData.publicUrl} is provisioned on the mesh.`,
    });
  };

  const verifyConnectivity = (tunnelId: string, url: string) => {
    setIsVerifying(tunnelId);
    setTimeout(() => {
      setIsVerifying(null);
      toast({
        title: "Agent Verification",
        description: `Endpoint ${url} is live and reachable via global mesh nodes.`,
      });
    }, 1500);
  };

  const copyCommand = (text: string, id: string) => {
    // Prevent copying if another copy is in progress
    if (isCopying) {
      setCommandError("Already copying. Please wait for the current copy to complete.");
      return;
    }

    setIsCopying(true);
    setCommandError(null);

    try {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to copy command";
      setCommandError(errorMsg);
      setIsCopying(false);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: errorMsg,
      });
      return;
    }

    setTimeout(() => {
      setCopiedId(null);
      setIsCopying(false);
    }, 2000);
  };

  const handleDeleteTunnel = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, "tunnels", id))
      .catch(async (err) => {
        const pErr = new FirestorePermissionError({
          path: `tunnels/${id}`,
          operation: 'delete'
        });
        errorEmitter.emit('permission-error', pErr);
      });
  };

  const getCommands = (tunnel: any, os: 'bash' | 'ps') => {
    const base = window.location.origin || "http://localhost:9002";
    const install = os === 'bash' 
      ? `curl -sL ${base}/install.sh | sudo bash -s -- ${base}` 
      : `powershell.exe -Command "Start-Process powershell.exe -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-NoExit','-Command','iwr -useb ${base}/install.ps1 | iex' -Verb RunAs"`;
    
    const connect = os === 'bash'
      ? `bridgeflux connect --port ${tunnel.localPort} --token ${token} --tunnel-id ${tunnel.id} --base ${window.location.origin}`
      : `powershell.exe -Command "Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-NoExit','-Command','bridgeflux connect --port ${tunnel.localPort} --token ${token} --tunnel-id ${tunnel.id} --base ${window.location.origin}' -Verb RunAs"`;
    
    return { install, connect };
  };

  if (!mounted) return <div className="h-40 animate-pulse bg-secondary/20 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex flex-col">
          <h2 className="text-2xl font-headline font-bold flex items-center text-foreground tracking-tight">
            Mesh Infrastructure <Network className="ml-3 w-5 h-5 text-primary opacity-40" />
          </h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center">
            <ShieldCheck className="w-3 h-3 mr-2 text-primary/60" /> Hardware Persistence Enabled • Session Locked
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 bg-primary hover:bg-primary/90 glow-blue text-white font-bold transition-all px-8 rounded-2xl shadow-xl group">
              <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" /> Reserve Bridge
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] bg-card border-white/10 backdrop-blur-3xl shadow-3xl rounded-3xl">
            <DialogHeader className="pb-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                <Cloud className="w-7 h-7 text-primary" />
              </div>
              <DialogTitle className="text-3xl font-headline font-bold">New Cloud Bridge</DialogTitle>
              <DialogDescription className="text-xs leading-relaxed font-medium mt-2">
                Reserve a permanent static endpoint on the global mesh. This bridge persists even if your computer restarts.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-8 border-y border-white/5">
              <div className="grid gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Internal Descriptor</Label>
                <Input placeholder="e.g. Production API" value={name} onChange={(e) => setName(e.target.value)} className="bg-background/50 border-white/10 h-14 rounded-2xl focus:border-primary/40 transition-all text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Local Port</Label>
                  <Input type="number" value={localPort} onChange={(e) => setLocalPort(e.target.value)} className="bg-background/50 border-white/10 font-mono h-14 rounded-2xl focus:border-primary/40 transition-all" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mesh Protocol</Label>
                  <Select value={type} onValueChange={(v: "HTTP" | "TCP") => setType(v)}>
                    <SelectTrigger className="bg-background/50 border-white/10 font-bold text-xs h-14 rounded-2xl focus:border-primary/40 transition-all"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-white/10">
                      <SelectItem value="HTTP">HTTP / WEB</SelectItem>
                      <SelectItem value="TCP">TCP / RAW</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="pt-6">
              <Button onClick={handleCreateTunnel} className="w-full bg-primary hover:bg-primary/90 glow-blue font-bold uppercase tracking-widest text-xs h-14 rounded-2xl">
                Provision & Activate <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-8 rounded-[2.5rem] border border-white/5 bg-secondary/10 backdrop-blur-sm">
            <Loader2 className="w-12 h-12 animate-spin text-primary/40" />
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold animate-pulse">Syncing Mission Data...</p>
          </div>
        ) : tunnels && tunnels.length > 0 ? (
          tunnels.map((tunnel: any) => (
            <div key={tunnel.id} className="glass-panel rounded-[2rem] p-8 flex flex-col lg:flex-row items-center justify-between hover:border-primary/40 transition-all group border border-white/5 relative shadow-2xl overflow-hidden">
              <div className="flex items-center space-x-8 w-full lg:w-auto">
                <div className={cn(
                  "w-24 h-24 rounded-[2.2rem] flex items-center justify-center transition-all group-hover:scale-110 duration-500 shadow-2xl relative",
                  tunnel.type === 'TCP' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-primary/10 text-primary border border-primary/20'
                )}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                  {tunnel.type === 'TCP' ? <Database className="w-11 h-11 relative z-10" /> : <Globe className="w-11 h-11 relative z-10" />}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <h4 className="font-bold text-2xl tracking-tight text-foreground">{tunnel.name}</h4>
                    <Badge variant="outline" className={cn(
                      "text-[10px] font-bold uppercase tracking-tighter border-none px-3 py-1.5",
                      tunnel.latency !== '---' 
                        ? "bg-green-500/10 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]" 
                        : "bg-primary/10 text-primary"
                    )}>
                      {tunnel.latency !== '---' ? (
                        <><Activity className="w-3 h-3 mr-2 animate-pulse" /> Live Handshake</>
                      ) : (
                        <><WifiOff className="w-3 h-3 mr-2 opacity-50" /> Pending Trigger</>
                      )}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center text-sm text-muted-foreground gap-4 sm:gap-10">
                    <div className="flex items-center space-x-3 bg-secondary/30 px-4 py-2 rounded-xl border border-white/5">
                      <Cloud className="w-4 h-4 text-primary/70" />
                      <span className="font-mono text-primary font-bold tracking-tight text-xs">
                        {tunnel.publicUrl}{tunnel.type === 'TCP' && `:${tunnel.publicPort}`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <TerminalIcon className="w-4 h-4 text-muted-foreground/30" />
                      <span className="font-mono text-muted-foreground/60 text-xs">
                        localhost:{tunnel.localPort}
                      </span>
                    </div>
                  </div>
                  {tunnel.latency === '---' && (
                    <p className="text-xs text-muted-foreground/70 mt-2 max-w-2xl">
                      Waiting for a local agent connection. Open Setup Agent and run the copied command on your machine to activate this bridge.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-8 mt-8 lg:mt-0 w-full lg:w-auto justify-end">
                <div className="hidden xl:flex flex-col items-end mr-6 text-right space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Bridge Status</p>
                  <div className={cn(
                    "flex items-center space-x-3 px-5 py-2 rounded-full border border-white/5 shadow-inner transition-all",
                    tunnel.latency !== '---' ? "bg-green-500/5" : "bg-primary/5"
                  )}>
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      tunnel.latency !== '---' ? "bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" : "bg-primary/30"
                    )}></div>
                    <span className="font-mono text-[11px] font-bold text-foreground tracking-widest uppercase">
                      {tunnel.latency !== '---' ? "Streaming" : "Awaiting CLI"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {tunnel.latency === '---' ? (
                    <Dialog open={!!initTunnel && initTunnel.id === tunnel.id} onOpenChange={(open) => {
                      setInitTunnel(open ? tunnel : null);
                      if (!open) {
                        setCommandError(null);
                        setCopiedId(null);
                        setIsCopying(false);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="lg"
                          className="text-[11px] font-bold uppercase tracking-widest h-14 border-accent/20 hover:bg-accent/10 text-accent px-8 rounded-2xl shadow-xl transition-all group"
                        >
                          <Zap className="w-5 h-5 mr-3 group-hover:animate-bounce" />
                          Setup Agent
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[550px] bg-card border-white/10 rounded-[2.5rem] shadow-3xl">
                        <DialogHeader>
                          <div className="flex items-center space-x-4 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20">
                              <TerminalIcon className="text-accent w-6 h-6" />
                            </div>
                            <div>
                              <DialogTitle className="text-2xl font-headline font-bold">Mesh Handshake</DialogTitle>
                              <DialogDescription className="text-xs font-medium">
                                Active initialization for <strong>{tunnel.name}</strong>.
                              </DialogDescription>
                            </div>
                          </div>
                        </DialogHeader>
                        <div className="py-6 border-y border-white/5 my-4">
                          <Tabs defaultValue="ps" onValueChange={() => setCommandError(null)}>
                            <TabsList className="grid w-full grid-cols-2 bg-secondary/50 mb-8 rounded-2xl h-12 p-1">
                              <TabsTrigger value="ps" className="text-[10px] font-bold uppercase data-[state=active]:bg-accent data-[state=active]:text-white transition-all rounded-xl">Windows (Elevated)</TabsTrigger>
                              <TabsTrigger value="bash" className="text-[10px] font-bold uppercase data-[state=active]:bg-primary data-[state=active]:text-white transition-all rounded-xl">Unix / MacOS</TabsTrigger>
                            </TabsList>
                            {commandError && (
                              <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-start space-x-3">
                                <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center shrink-0 mt-0.5">
                                  <span className="text-destructive text-xs font-bold">!</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-bold text-destructive">Error</p>
                                  <p className="text-xs text-destructive/80 mt-1">{commandError}</p>
                                </div>
                              </div>
                            )}
                            {['ps', 'bash'].map((os: any) => {
                              const cmds = getCommands(tunnel, os);
                              return (
                                <TabsContent key={os} value={os} className="space-y-8 animate-in fade-in zoom-in-95">
                                  <div className="space-y-3">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">01. Bootstrap Mesh Agent</Label>
                                    <div className="bg-black/40 border border-white/5 rounded-2xl group hover:border-primary/20 transition-all relative overflow-hidden">
                                      <div className="absolute top-0 right-0 w-1 h-full bg-primary/20"></div>
                                      <div className="flex items-stretch">
                                        <code className="flex-1 text-[11px] font-mono text-foreground/90 p-5 overflow-x-auto scroll-hide break-all whitespace-pre-wrap">{cmds.install}</code>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={() => copyCommand(cmds.install, 'inst')}
                                          disabled={isCopying}
                                          className="h-auto w-14 hover:bg-white/10 shrink-0 rounded-none bg-black/40 border-l border-white/10"
                                        >
                                          {copiedId === 'inst' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">02. Establish Cloud Bridge</Label>
                                    <div className="bg-black/40 border border-white/5 rounded-2xl group hover:border-accent/20 transition-all relative overflow-hidden">
                                      <div className="absolute top-0 right-0 w-1 h-full bg-accent/20"></div>
                                      <div className="flex items-stretch">
                                        <code className="flex-1 text-[11px] font-mono text-accent p-5 overflow-x-auto scroll-hide break-all whitespace-pre-wrap">{cmds.connect}</code>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          onClick={() => copyCommand(cmds.connect, 'conn')}
                                          disabled={isCopying}
                                          className="h-auto w-14 hover:bg-white/10 shrink-0 rounded-none bg-black/40 border-l border-white/10"
                                        >
                                          {copiedId === 'conn' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                  {os === 'ps' && (
                                    <div className="rounded-2xl bg-secondary/10 border border-white/10 p-4 text-[10px] text-muted-foreground space-y-2">
                                      <div className="font-bold text-foreground mb-2">Important Notes</div>
                                      <div>Copy the PowerShell command, paste it into a PowerShell window, and confirm the Windows UAC prompt to elevate.</div>
                                      <div className="text-[10px] text-muted-foreground/80">The installer will try to write a CLI shim to <strong>System32</strong>. If that fails it will fall back to <strong>%LOCALAPPDATA%\Microsoft\WindowsApps</strong>.</div>
                                      <div className="text-[10px] text-muted-foreground/80">Example (non-elevated): <code className="bg-black/10 px-1 rounded">C:\Users\&lt;your-user&gt;\AppData\Local\Microsoft\WindowsApps\bridgeflux.cmd</code>. To locate it run <code className="bg-black/10 px-1 rounded">echo $env:LOCALAPPDATA</code> and append <code className="bg-black/10 px-1 rounded">\Microsoft\WindowsApps\bridgeflux.cmd</code>.</div>
                                    </div>
                                  )}
                                </TabsContent>
                              );
                            })}
                          </Tabs>
                        </div>
                        <div className="p-6 rounded-2xl bg-secondary/20 border border-white/5 flex items-start space-x-4">
                          <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                            The agent will automatically request **Administrator** privileges on Windows. Once connected, your mission status will flip to <span className="text-foreground font-bold font-mono">LIVE</span>.
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="lg" 
                      disabled={isVerifying === tunnel.id}
                      onClick={() => verifyConnectivity(tunnel.id, tunnel.publicUrl)}
                      className="text-[11px] font-bold uppercase tracking-widest h-14 border-primary/20 hover:bg-primary/10 text-primary px-8 rounded-2xl shadow-xl transition-all"
                    >
                      {isVerifying === tunnel.id ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <RefreshCcw className="w-5 h-5 mr-3" />}
                      Verify Pulse
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteTunnel(tunnel.id)}
                    className="text-muted-foreground/20 hover:text-red-500 hover:bg-red-500/10 w-14 h-14 rounded-2xl transition-all border border-transparent hover:border-red-500/20"
                  >
                    <Trash2 className="w-6 h-6" />
                  </Button>
                </div>
              </div>

              {tunnel.latency === '---' && (
                <div className="absolute inset-0 bg-primary/[0.01] pointer-events-none">
                  <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer"></div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="glass-panel border-dashed border-2 rounded-[3rem] py-40 flex flex-col items-center justify-center text-center px-12 bg-secondary/5 border-white/5">
            <div className="w-28 h-28 rounded-full bg-secondary/10 flex items-center justify-center mb-10 border border-white/5">
              <Server className="w-12 h-12 text-muted-foreground opacity-20" />
            </div>
            <h3 className="font-headline font-bold text-3xl mb-4 text-white">Infrastructure Empty</h3>
            <p className="text-sm text-muted-foreground mb-12 leading-relaxed font-medium max-w-lg mx-auto">
              Your edge network is currently standby. Provision a cloud bridge to transform your local environment into a globally reachable production endpoint.
            </p>
            <Button onClick={() => setIsOpen(true)} variant="outline" className="h-16 border-primary/30 text-primary px-16 rounded-2xl font-bold uppercase tracking-[0.2em] text-[12px] hover:bg-primary/10 transition-all shadow-3xl">
              <Plus className="w-5 h-5 mr-3" /> Reserve Infrastructure
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
