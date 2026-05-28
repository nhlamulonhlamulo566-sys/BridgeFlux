
"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { TrafficStream } from "@/components/dashboard/TrafficStream";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Play, Pause, Trash2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useFirestore, useFirebase } from "@/firebase";
import { collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { useSessionToken } from "@/lib/session";
import { cn } from "@/lib/utils";

export default function InspectorPage() {
  const db = useFirestore();
  const { authReady, authUser } = useFirebase();
  const { token } = useSessionToken();
  const [isPaused, setIsPaused] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearLogs = async () => {
    if (!db || !token || !authReady || !authUser) return;
    setIsClearing(true);
    try {
      const q = query(collection(db, "traffic_logs"), where("userId", "==", token));
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.docs.forEach((document) => {
        batch.delete(document.ref);
      });
      await batch.commit();
      toast({
        title: "Inspector Cleared",
        description: "Your session's traffic history has been purged.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Clear Failed",
        description: "Could not purge traffic logs.",
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
        
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold mb-2 text-foreground flex items-center">
              Live Inspector <Activity className={cn("ml-3 text-primary w-6 h-6", !isPaused && "animate-pulse")} />
            </h1>
            <p className="text-muted-foreground">Real-time packet inspection across your active edge nodes.</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs font-bold"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <><Play className="w-3 h-3 mr-1 text-green-500" /> Resume</> : <><Pause className="w-3 h-3 mr-1 text-yellow-500" /> Pause</>}
            </Button>
            <Button size="sm" variant="outline" className="text-xs font-bold">
              <Download className="w-3 h-3 mr-1" /> Export CSV
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              className="text-xs font-bold"
              onClick={handleClearLogs}
              disabled={isClearing}
            >
              {isClearing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Trash2 className="w-3 h-3 mr-1" />}
              Clear Logs
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6">
          <Card className="border-primary/10 bg-card/40 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-6">
              <div>
                <CardTitle className="text-lg">Packet Stream</CardTitle>
                <CardDescription className="text-xs">Live connection logs scoped to your current session identity.</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={cn(
                  "text-[10px] uppercase tracking-widest font-bold",
                  isPaused ? "border-yellow-500/30 text-yellow-500" : "border-green-500/30 text-green-500"
                )}>
                  {isPaused ? "STREAM PAUSED" : "WEBSOCKET OPEN"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px]">
                <TrafficStream isPaused={isPaused} />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
