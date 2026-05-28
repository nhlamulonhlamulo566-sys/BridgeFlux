
"use client";

import { useState } from "react";
import { diagnoseTunnelFailure, type TunnelFailureDiagnosticsOutput } from "@/ai/flows/tunnel-failure-diagnostics";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BrainCircuit, Loader2, AlertCircle, CheckCircle2, ListRestart } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export function SmartDiagnostics() {
  const [logs, setLogs] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TunnelFailureDiagnosticsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDiagnose = async () => {
    if (!logs || !status) return;
    setLoading(true);
    setError(null);
    try {
      const res = await diagnoseTunnelFailure({
        connectionLogs: logs,
        localNetworkStatus: status
      });
      setResult(res);
    } catch (e) {
      setError("Failed to analyze diagnostics. Please ensure logs are correct.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setLogs("");
    setStatus("");
    setError(null);
  };

  return (
    <Card className="border-primary/20 bg-card/40 backdrop-blur-md">
      <CardHeader>
        <div className="flex items-center space-x-2 mb-2">
          <BrainCircuit className="w-5 h-5 text-accent" />
          <CardTitle className="text-xl font-headline font-bold text-accent">Smart Diagnostics</CardTitle>
        </div>
        <CardDescription>
          Paste your agent logs and network status to let BridgeFlux AI identify the root cause of connection failures.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!result ? (
          <>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tunnel Agent Logs</label>
              <Textarea 
                placeholder="2023-10-27 14:20:00 [ERR] connection closed by peer..."
                className="font-mono text-xs min-h-[100px] bg-background/50 border-primary/10 focus:border-primary/40"
                value={logs}
                onChange={(e) => setLogs(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Network Diagnostics (ipconfig, ping, netstat)</label>
              <Textarea 
                placeholder="Interface status: UP, Gateway: 192.168.1.1, Firewall: Active..."
                className="font-mono text-xs min-h-[100px] bg-background/50 border-primary/10 focus:border-primary/40"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4 h-4 text-primary" />
                <h4 className="font-bold text-primary font-headline">Diagnosis</h4>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{result.diagnosis}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-widest text-accent flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Actionable Fixes
              </h4>
              <ul className="space-y-2">
                {result.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start text-sm bg-secondary/40 rounded-md p-3 border border-border/50">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent/20 text-accent text-[10px] font-bold mr-3 mt-0.5 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-foreground/90">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t border-primary/10 pt-4">
        {result ? (
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={reset}>
            <ListRestart className="w-4 h-4 mr-2" /> Start Over
          </Button>
        ) : (
          <div className="w-full flex justify-end">
            <Button 
              className="bg-primary hover:bg-primary/90 glow-blue text-white font-bold"
              disabled={loading || !logs || !status}
              onClick={handleDiagnose}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Network...
                </>
              ) : (
                <>
                  <BrainCircuit className="w-4 h-4 mr-2" />
                  Analyze Failure
                </>
              )}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
