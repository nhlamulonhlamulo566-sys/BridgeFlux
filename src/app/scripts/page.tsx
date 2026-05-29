"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { TerminalGenerator } from "@/components/tools/TerminalGenerator";
import { Terminal, Copy, Download, Code, Cpu, ShieldCheck, Globe, Zap, ArrowRight, CheckCircle2, Server, Laptop, Workflow, Box, ShieldAlert, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export default function ScriptsPage() {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const copyConfig = () => {
    const config = `tunnels:
  - name: bridgeflux-api
    port: 3000
    subdomain: dev-proxy-99
    inspect: true

auth:
  key: bf_live_guest_0x82f...`;
    navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Config Copied", description: "Save this as bridgeflux.yaml in your project root." });
  };

  if (!mounted) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>;

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[160px] -z-10"></div>
        
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center space-x-4 mb-3">
              <h1 className="text-4xl font-headline font-bold text-white tracking-tight">Agent Deployment</h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-mono uppercase tracking-widest text-[10px]">v1.4.2 Stable</Badge>
            </div>
            <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed">
              Transform your local machine into a global edge node. Deploy the BridgeFlux CLI agent as a persistent system service to ensure 24/7 uptime even after system reboots.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-[10px] font-bold uppercase tracking-widest text-white/80 bg-primary/10 px-5 py-2.5 rounded-full border border-primary/20 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
            <span>142 Edge Nodes Ready</span>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="xl:col-span-2 space-y-12">
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-headline font-bold flex items-center text-white">
                  <Workflow className="w-6 h-6 mr-3 text-primary" /> Setup Pipeline
                </h2>
              </div>
              <TerminalGenerator />
            </section>
            
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-card/20 border-accent/10 backdrop-blur-md hover:border-accent/40 transition-all group rounded-2xl">
                <CardHeader>
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="p-3 bg-accent/10 rounded-xl group-hover:bg-accent/20 transition-colors border border-accent/10">
                      <RefreshCcw className="text-accent w-6 h-6" />
                    </div>
                    <CardTitle className="text-lg">Service Persistence</CardTitle>
                  </div>
                  <CardDescription className="text-xs leading-relaxed text-muted-foreground/80 font-medium">
                    Configure the agent to run as a system service. Use the <strong>Auto-Start</strong> toggle in the generator to enable automatic resumption after computer reboots.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-card/20 border-primary/10 backdrop-blur-md hover:border-primary/40 transition-all group rounded-2xl">
                <CardHeader>
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors border border-primary/10">
                      <ShieldAlert className="text-primary w-6 h-6" />
                    </div>
                    <CardTitle className="text-lg">Remote Kill-Switch</CardTitle>
                  </div>
                  <CardDescription className="text-xs leading-relaxed text-muted-foreground/80 font-medium">
                    Lost physical access? Simply delete the tunnel from this dashboard. The background service is linked to Firestore and will terminate instantly.
                  </CardDescription>
                </CardHeader>
              </Card>
            </section>
          </div>

          <div className="space-y-12">
            <section className="space-y-6">
              <h2 className="text-xl font-headline font-bold flex items-center text-white">
                <Code className="w-6 h-6 mr-3 text-accent" /> Bridge Manifest
              </h2>
              <Card className="bg-black/60 border-white/5 overflow-hidden shadow-2xl rounded-2xl">
                <div className="p-4 bg-secondary/30 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Server className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-bold">bridgeflux.yaml</span>
                  </div>
                  <button onClick={copyConfig} className="text-muted-foreground hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-md">
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <CardContent className="p-0">
                  <pre className="p-6 text-[11px] font-mono text-muted-foreground/70 leading-relaxed overflow-x-auto scroll-hide">
{`tunnels:
  - name: bridgeflux-api
    port: 3000
    subdomain: dev-proxy-99
    service: true # Enable auto-start
    inspect: true

auth:
  key: bf_live_guest_0x82f...`}
                  </pre>
                </CardContent>
                <div className="p-4 bg-accent/5 border-t border-accent/10">
                  <p className="text-[9px] text-accent font-bold leading-relaxed italic text-center">
                    Manifests allow for permanent Infrastructure-as-Code (IaC) persistence.
                  </p>
                </div>
              </Card>
            </section>

            <div className="p-8 rounded-3xl border border-primary/20 bg-primary/5 relative overflow-hidden group shadow-2xl">
              <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700">
                <Laptop className="w-32 h-32 text-primary" />
              </div>
              <h4 className="font-headline font-bold text-xl mb-4 text-white">CI/CD Integration</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-8 font-medium">
                Automate your preview environments. Integrate BridgeFlux into your GitHub Actions to expose staging builds without public cloud hosting.
              </p>
              <Button variant="outline" className="w-full text-[10px] font-bold uppercase tracking-widest border-primary/30 text-primary hover:bg-primary/10 h-12 rounded-xl group">
                Deployment Docs <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
