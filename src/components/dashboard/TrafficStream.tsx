
"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { Terminal, ShieldCheck, Cpu, Loader2, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase, useFirebase } from "@/firebase";
import { collection, query, limit, where } from "firebase/firestore";
import { useSessionToken } from "@/lib/session";

interface TrafficStreamProps {
  isPaused?: boolean;
}

export function TrafficStream({ isPaused = false }: TrafficStreamProps) {
  const db = useFirestore();
  const { authReady, authUser } = useFirebase();
  const { token } = useSessionToken();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [displayLogs, setDisplayLogs] = useState<any[]>([]);

  const trafficQuery = useMemoFirebase(() => {
    if (!db || !token || !authReady || !authUser) return null;
    return query(
      collection(db, "traffic_logs"),
      where("userId", "==", token),
      limit(50)
    );
  }, db, token, authReady, authUser);

  const { data: logsRaw, loading } = useCollection<any>(trafficQuery);

  const sortedLogs = useMemo(() => {
    if (!logsRaw) return [];
    return [...logsRaw].sort((a, b) => {
      const timeA = a.timestamp?.seconds || 0;
      const timeB = b.timestamp?.seconds || 0;
      return timeB - timeA;
    });
  }, [logsRaw]);

  useEffect(() => {
    if (!loading && sortedLogs && !isPaused) {
      setDisplayLogs(sortedLogs);
    }
  }, [sortedLogs, isPaused, loading]);

  const renderedLogs = useMemo(() => {
    if (!displayLogs || displayLogs.length === 0) return null;
    return displayLogs.map((log) => (
      <div key={log.id} className="flex items-center text-[12px] group hover:bg-white/5 rounded px-2 py-1 transition-all border-l-2 border-transparent hover:border-primary/40">
        <span className="text-muted-foreground/60 w-24 shrink-0 font-mono text-[10px]">
          [{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString('en-GB', { hour12: false }) : '...'}]
        </span>
        <span className={cn(
          "w-14 font-bold shrink-0 text-[10px]",
          log.method === 'POST' ? 'text-accent' : 'text-primary'
        )}>{log.method}</span>
        <span className="flex-1 text-foreground/80 truncate mr-4 tracking-tight">{log.path}</span>
        <span className={cn(
          "w-12 font-bold text-right shrink-0 font-mono",
          log.status >= 500 ? 'text-destructive' : log.status >= 400 ? 'text-yellow-500' : 'text-green-500'
        )}>{log.status}</span>
        <span className="text-muted-foreground/40 w-16 text-right shrink-0 opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[10px]">{log.latency}ms</span>
      </div>
    ));
  }, [displayLogs]);

  return (
    <div className="bg-card border-none flex flex-col h-full overflow-hidden rounded-xl border border-white/5">
      <div className="bg-secondary/20 px-4 py-2 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase">Traffic Inspector</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isPaused ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]" : "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"
            )}></div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">
              {isPaused ? "Paused" : "Live"}
            </span>
          </div>
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-sm terminal-bg scroll-hide">
        {loading && displayLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
          </div>
        ) : renderedLogs ? (
          <>
            {renderedLogs}
            {!isPaused && (
              <div className="flex items-center text-[11px] px-2 py-2 text-primary/40">
                <span className="animate-pulse mr-2">_</span>
                <span className="font-bold tracking-widest uppercase text-[9px]">Capturing packets...</span>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20 italic space-y-4">
            <Terminal className="w-12 h-12 opacity-10" />
            <p className="text-xs uppercase tracking-widest font-bold">Waiting for edge signals...</p>
          </div>
        )}
        
        {isPaused && (
          <div className="flex items-center justify-center p-4 border border-dashed border-white/5 rounded-lg bg-yellow-500/5 mt-4">
            <PauseCircle className="w-4 h-4 text-yellow-500/50 mr-2" />
            <span className="text-[10px] font-bold text-yellow-500/50 uppercase tracking-widest">Inspector Buffer Frozen</span>
          </div>
        )}
      </div>

      <div className="p-3 bg-secondary/10 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center text-[9px] text-muted-foreground/60 space-x-6 uppercase font-bold tracking-widest">
          <span className="flex items-center"><ShieldCheck className="w-3 h-3 mr-1.5 text-green-500/50" /> Edge WAF: Active</span>
          <span className="hidden sm:inline">NODES: 142 ACTIVE</span>
        </div>
        <div className="text-[9px] font-mono text-muted-foreground/40 uppercase">
          Identity Scoped: {token?.slice(-6) || '---'}
        </div>
      </div>
    </div>
  );
}
