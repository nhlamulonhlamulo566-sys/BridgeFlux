
"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Lock, Globe, Plus, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useMemo } from "react";
import { useCollection, useFirestore, useMemoFirebase, useFirebase } from "@/firebase";
import { collection, query, addDoc, deleteDoc, doc, serverTimestamp, where } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { toast } from "@/hooks/use-toast";
import { useSessionToken } from "@/lib/session";

export default function SecurityPage() {
  const db = useFirestore();
  const { authReady, authUser } = useFirebase();
  const { token } = useSessionToken();
  const [newLabel, setNewLabel] = useState("");
  const [newCidr, setNewCidr] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const rulesQuery = useMemoFirebase(() => {
    if (!db || !token || !authReady) return null;
    return query(
      collection(db, "security_rules"),
      where("userId", "==", token)
    );
  }, db, token, authReady, authUser);

  const { data: rulesRaw, loading } = useCollection<any>(rulesQuery);

  const rules = useMemo(() => {
    if (!rulesRaw) return [];
    return [...rulesRaw].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [rulesRaw]);

  const handleAddRule = () => {
    if (!db || !newLabel || !newCidr || !token) return;

    const ruleData = {
      label: newLabel,
      cidr: newCidr,
      userId: token,
      createdAt: serverTimestamp(),
    };

    addDoc(collection(db, "security_rules"), ruleData)
      .catch(async (err) => {
        const pErr = new FirestorePermissionError({
          path: 'security_rules',
          operation: 'create',
          requestResourceData: ruleData
        });
        errorEmitter.emit('permission-error', pErr);
      });

    toast({
      title: "Rule Added",
      description: `Whitelisted ${newCidr} (${newLabel}).`,
    });
    setNewLabel("");
    setNewCidr("");
  };

  const handleDeleteRule = (ruleId: string) => {
    if (!db) return;
    deleteDoc(doc(db, "security_rules", ruleId))
      .catch(async (err) => {
        const pErr = new FirestorePermissionError({
          path: `security_rules/${ruleId}`,
          operation: 'delete'
        });
        errorEmitter.emit('permission-error', pErr);
      });
  };

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute top-0 right-0 w-[min(40vw,500px)] h-[min(40vw,500px)] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
        
        <header className="mb-8">
          <h1 className="text-3xl font-headline font-bold mb-2 text-white flex items-center">
            Access Control <ShieldCheck className="ml-3 text-primary w-6 h-6" />
          </h1>
          <p className="text-muted-foreground font-bold">Secure tunnels with public IP whitelisting and regional edge protection.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card/40 border-primary/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">IP Whitelist</CardTitle>
                <CardDescription>Public connection rules for your private mesh nodes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    placeholder="Rule Label (e.g. Office)" 
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="bg-background/50 border-white/10 text-white" 
                  />
                  <div className="flex space-x-2">
                    <Input 
                      placeholder="CIDR (e.g. 1.2.3.4/32)" 
                      value={newCidr}
                      onChange={(e) => setNewCidr(e.target.value)}
                      className="bg-background/50 border-white/10 text-white" 
                    />
                    <Button onClick={handleAddRule} className="bg-primary glow-blue px-6 font-bold" disabled={!newLabel || !newCidr}>
                      <Plus className="w-4 h-4 mr-2" /> Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mt-6">
                  {loading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : rules && rules.length > 0 ? (
                    rules.map((rule: any) => (
                      <div key={rule.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-secondary/20 group hover:border-primary/20 transition-all">
                        <div>
                          <p className="text-sm font-bold text-white">{rule.label}</p>
                          <code className="text-[11px] text-primary/80 font-mono">{rule.cidr}</code>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-muted-foreground text-xs font-bold border border-dashed rounded-xl border-white/5 bg-secondary/5">
                      No access rules defined. All traffic is currently open to the edge mesh.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-primary/10 bg-primary/5">
              <h3 className="text-sm font-bold text-primary mb-3 flex items-center">
                <Lock className="w-4 h-4 mr-2" /> Edge Enforcement
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-bold">
                Rules are applied at the nearest edge node to the client. Traffic from unauthorized CIDR blocks is dropped before it ever enters your tunnel.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
