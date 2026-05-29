"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, RefreshCw, Copy, Check, ShieldCheck, Terminal, UploadCloud, ArrowRight } from "lucide-react";
import { useSessionToken } from "@/lib/session";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { token, updateToken } = useSessionToken();
  const [copied, setCopied] = useState(false);
  const [importKey, setImportKey] = useState("");

  const handleCopy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Token Copied", description: "Use this in your bridgeflux CLI agent." });
  };

  const resetToken = () => {
    localStorage.removeItem('bf_session_token');
    window.location.reload();
  };

  const handleSync = () => {
    if (!importKey || !importKey.startsWith('bf_live_guest')) {
      toast({
        variant: "destructive",
        title: "Invalid Key Format",
        description: "Please enter a valid BridgeFlux Access Key."
      });
      return;
    }
    updateToken(importKey);
    toast({
      title: "Session Synchronized",
      description: "Successfully resumed bridge environment from your provided key.",
    });
    setImportKey("");
  };

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute top-0 right-0 w-[min(40vw,500px)] h-[min(40vw,500px)] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
        
        <header className="mb-12">
          <h1 className="text-4xl font-headline font-bold mb-2 text-foreground tracking-tight">System Settings</h1>
          <p className="text-muted-foreground font-medium">Manage your public mesh credentials and session synchronization.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <Card className="bg-card/40 border-primary/10 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl">
              <CardHeader className="bg-secondary/20 border-b border-white/5 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Key className="text-primary w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Network Identity Key</CardTitle>
                      <CardDescription className="text-xs">Your unique fingerprint on the BridgeFlux mesh.</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 px-3 py-1 font-mono uppercase tracking-widest text-[10px]">Active Session</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Current Active Key</p>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 p-5 rounded-xl bg-black/40 border border-white/5 font-mono text-sm text-primary shadow-inner break-all">
                      {token || 'Generating...'}
                    </div>
                    <Button variant="outline" size="icon" className="w-14 h-14 rounded-xl border-white/10 hover:bg-white/5" onClick={handleCopy}>
                      {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5">
                  <div className="flex items-center space-x-3 mb-4">
                    <UploadCloud className="w-4 h-4 text-accent" />
                    <h4 className="text-sm font-bold text-foreground">Sync Existing Environment</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                    Moving to a new computer? Paste your Access Key here to resume your persistent tunnels and reserved domains instantly.
                  </p>
                  <div className="flex space-x-3">
                    <Input 
                      placeholder="Enter your Access Key (bf_live_guest...)" 
                      value={importKey}
                      onChange={(e) => setImportKey(e.target.value)}
                      className="bg-black/40 border-white/10 font-mono text-xs"
                    />
                    <Button onClick={handleSync} className="bg-accent text-accent-foreground font-bold px-6 hover:opacity-90 transition-all">
                      Sync Session <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-start space-x-4">
                  <ShieldCheck className="w-5 h-5 text-primary mt-1 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-primary mb-1">Identity Persistence</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                      This key acts as your MAC-alternative identity. As long as you have this key, your “Unlimited” tunnels and live metrics will follow you to any device.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-end">
                  <Button variant="ghost" onClick={resetToken} className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 font-bold">
                    <RefreshCw className="w-3.5 h-3.5 mr-2" /> Decommission & New Identity
                  </Button>
                </div>
              </CardContent>
            </Card>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card/20 border-white/5 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Terminal className="w-4 h-4 mr-2 text-primary" /> CLI Sync
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Set your identity globally on your local machine:
                  </p>
                  <code className="block p-3 rounded-lg bg-black/40 text-[10px] font-mono text-primary/80 border border-white/5">
                    bridgeflux config set key {token?.substring(0, 15)}...
                  </code>
                </CardContent>
              </Card>

              <Card className="bg-card/20 border-white/5 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2 text-accent" /> Auto-Resumption
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    If you close your browser, your local agent (CLI) will continue to route traffic to your persistent cloud URLs.
                  </p>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
