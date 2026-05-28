
"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { SmartDiagnostics } from "@/components/diagnostics/SmartDiagnostics";
import { ShieldAlert, Info, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function DiagnosticsPage() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-headline font-bold mb-2 text-foreground flex items-center">
            Failure Analysis <ShieldAlert className="ml-3 text-accent w-6 h-6" />
          </h1>
          <p className="text-muted-foreground">AI-driven network diagnostics for tunnel stability and connection issues.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SmartDiagnostics />
          </div>
          
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-accent/20 bg-accent/5">
              <h3 className="font-bold flex items-center text-accent mb-4">
                <Info className="w-4 h-4 mr-2" /> Troubleshooting Guide
              </h3>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 mr-3 shrink-0"></div>
                  <p className="text-muted-foreground"><span className="text-foreground font-semibold">Firewall Rules:</span> Ensure your local firewall allows outbound connections to our gateway ports.</p>
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 mr-3 shrink-0"></div>
                  <p className="text-muted-foreground"><span className="text-foreground font-semibold">Port Conflict:</span> Verify that the target port (e.g. 3000) is actually being served by your application.</p>
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 mr-3 shrink-0"></div>
                  <p className="text-muted-foreground"><span className="text-foreground font-semibold">MTU Mismatch:</span> If packets are dropping, consider adjusting your network MTU settings for large payload TCP traffic.</p>
                </li>
              </ul>
            </div>

            <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Network Advisory</AlertTitle>
              <AlertDescription className="text-xs">
                Nodes in the Asia-South region are currently experiencing high latency. This may affect AI analysis accuracy for localized failures.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </main>
    </div>
  );
}
