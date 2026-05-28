
"use client";

import { useState, useEffect } from "react";
import { Terminal, Copy, Check, ShieldCheck, Zap, Download, Cpu, Monitor, TerminalSquare, Key, Box, MousePointer2, RefreshCcw, Info, Cloud, ShieldAlert } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSessionToken } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export function TerminalGenerator() {
  const [copied, setCopied] = useState(false);
  const [port, setPort] = useState("3000");
  const [isDaemon, setIsDaemon] = useState(false);
  const [isService, setIsService] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [origin, setOrigin] = useState("http://localhost:9002");
  const { token } = useSessionToken();

  useEffect(() => {
    setMounted(true);
    setOrigin(window.location.origin);
  }, []);

  const getInstallCommand = (os: 'bash' | 'ps') => {
    const base = origin || "http://localhost:9002";
    if (os === 'bash') return `curl -sL ${base}/install.sh | sudo bash -s -- ${base}`;
    return `powershell.exe -Command "Start-Process powershell.exe -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-Command','iwr -useb ${base}/install.ps1 | iex' -Verb RunAs"`;
  };

  const getConnectCommand = (os: 'bash' | 'ps') => {
    const baseToken = token || 'BF_GUEST_KEY';
    
    if (isService) {
      if (os === 'bash') {
        return `sudo bridgeflux service install --port ${port} --token ${baseToken} --auto-restart`;
      }
      return `powershell.exe -Command "Start-Process powershell.exe -ArgumentList '-NoProfile','-Command','bridgeflux service install --port ${port} --token ${baseToken} --startup automatic' -Verb RunAs"`;
    }

    const base = `bridgeflux connect --port ${port} --token ${baseToken}`;
    if (!isDaemon) return base;
    
    if (os === 'bash') {
      return `nohup ${base} --daemon > bridgeflux.log 2>&1 &`;
    }
    return `powershell.exe -Command "Start-Process -FilePath 'bridgeflux' -ArgumentList 'connect','--port','${port}','--token','${baseToken}','--daemon' -WindowStyle Hidden -Verb RunAs"`;
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mounted) return <div className="h-[450px] bg-secondary/10 animate-pulse rounded-xl" />;

  return (
    <div className="bg-card/40 border border-primary/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
      <div className="p-6 border-b border-white/5 bg-secondary/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/20 rounded-xl border border-primary/10">
            <TerminalSquare className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-base tracking-tight text-foreground">
              Agent Bootloader
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Encrypted Bootstrap Sequence</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-3 bg-accent/5 px-4 py-2 rounded-xl border border-accent/20">
                  <div className="flex items-center space-x-2">
                    <RefreshCcw className={cn("w-3.5 h-3.5 text-accent", isService && "animate-spin-slow")} />
                    <Label htmlFor="service-mode" className="text-[9px] font-bold uppercase tracking-widest text-accent cursor-pointer">Auto-Start Service</Label>
                  </div>
                  <Switch 
                    id="service-mode" 
                    checked={isService} 
                    onCheckedChange={(val) => {
                      setIsService(val);
                      if (val) setIsDaemon(false);
                    }} 
                    className="scale-75 data-[state=checked]:bg-accent"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-[10px] font-bold">Registers a system daemon. Survives hardware reboots.</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center space-x-4 bg-black/40 px-4 py-2 rounded-xl border border-white/10 group hover:border-primary/40 transition-all">
            <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest flex items-center">
              <ShieldAlert className="w-3 h-3 mr-2 text-primary opacity-50" /> Bind Port
            </label>
            <input 
              type="text" 
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="w-16 bg-transparent border-none text-xs font-mono focus:ring-0 outline-none text-primary text-center font-bold"
            />
          </div>
        </div>
      </div>
      
      <div className="p-8">
        <Tabs defaultValue="bash" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 mb-8 p-1 rounded-2xl h-12">
            <TabsTrigger value="bash" className="text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all rounded-xl">
              <Cpu className="w-3.5 h-3.5 mr-2" /> Unix / MacOS
            </TabsTrigger>
            <TabsTrigger value="ps" className="text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-accent data-[state=active]:text-white transition-all rounded-xl">
              <Monitor className="w-3.5 h-3.5 mr-2" /> Windows (Elevated)
            </TabsTrigger>
          </TabsList>
          
          {['bash', 'ps'].map((os) => (
            <TabsContent key={os} value={os} className="space-y-8 animate-in fade-in zoom-in-95 duration-200 outline-none">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">01. Initialize Binary Mesh</h4>
                  <Badge variant="outline" className="text-[9px] border-primary/20 text-primary bg-primary/5">Stable Node v1.4.2</Badge>
                </div>
                <div className="bg-black/60 border border-white/5 rounded-2xl p-5 relative group hover:border-primary/20 transition-all shadow-inner overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-primary/20"></div>
                  <pre className="text-[11px] font-mono text-foreground/90 overflow-x-auto scroll-hide pr-12">
                    <code>
                      <span className="text-muted-foreground mr-3 opacity-30 select-none">{os === 'bash' ? 'λ' : 'PS'}</span>
                      {getInstallCommand(os as any)}
                    </code>
                  </pre>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-1/2 -translate-y-1/2 right-4 w-9 h-9 hover:bg-primary/20 bg-black/40 border border-white/10 rounded-xl"
                    onClick={() => copy(getInstallCommand(os as any))}
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    02. Activate Persistent Bridge
                  </h4>
                  {isService && <Badge variant="outline" className="text-[9px] font-bold bg-accent/10 border-accent/30 text-accent">Privileged Service Mode</Badge>}
                </div>
                <div className="bg-black/60 border border-white/5 rounded-2xl p-5 relative group hover:border-accent/20 transition-all shadow-inner overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-accent/20"></div>
                  <pre className={cn(
                    "text-[11px] font-mono overflow-x-auto scroll-hide pr-12",
                    os === 'bash' ? 'text-primary/90' : 'text-accent/90'
                  )}>
                    <code>
                      <span className="text-muted-foreground mr-3 opacity-30 select-none">{os === 'bash' ? 'λ' : 'PS'}</span>
                      {getConnectCommand(os as any)}
                    </code>
                  </pre>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-1/2 -translate-y-1/2 right-4 w-9 h-9 hover:bg-primary/20 bg-black/40 border border-white/10 rounded-xl"
                    onClick={() => copy(getConnectCommand(os as any))}
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                {os === 'ps' && (
                  <div className="rounded-2xl bg-secondary/10 border border-white/10 p-4 text-[10px] text-muted-foreground space-y-2">
                    <p className="font-bold text-foreground">Windows Elevation Steps</p>
                    <p>1. Open Start, type <code className="bg-black/10 px-1 rounded">PowerShell</code>.</p>
                    <p>2. Right-click <strong>Windows PowerShell</strong> and choose <strong>Run as administrator</strong>.</p>
                    <p>3. Paste the copied command, press <strong>Enter</strong>, and accept the UAC prompt.</p>
                    <p className="text-[10px] text-muted-foreground/80">Note: the installer will attempt to place a CLI shim in <strong>System32</strong>. If permission is denied it will fall back to <strong>%LOCALAPPDATA%\Microsoft\WindowsApps</strong>.</p>
                    <p className="text-[10px] text-muted-foreground/80">Example (non-elevated install): <code className="bg-black/10 px-1 rounded">C:\Users\&lt;your-user&gt;\AppData\Local\Microsoft\WindowsApps\bridgeflux.cmd</code>.</p>
                    <p className="text-[10px] text-muted-foreground/80">To locate it on your machine run <code className="bg-black/10 px-1 rounded">echo $env:LOCALAPPDATA</code> in PowerShell and append <code className="bg-black/10 px-1 rounded">\Microsoft\WindowsApps\bridgeflux.cmd</code>.</p>
                  </div>
                )}
                <div className="p-4 rounded-xl bg-secondary/10 border border-white/5 flex items-start space-x-3">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    <span className="text-foreground font-bold">Network Tip:</span> Ensure port <code className="bg-primary/10 text-primary px-1 rounded">{port}</code> is available on this machine. Running as Administrator is required to register system services and bind to restricted network stacks.
                  </p>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
