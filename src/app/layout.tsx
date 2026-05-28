'use client';

import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { initializeFirebase } from '@/firebase';
import { useState, useEffect, useCallback } from 'react';
import { TokenContext } from '@/lib/session';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });

// Initialize Firebase only on the client inside the component to avoid
// running the client SDK during server-side prerender where env vars may be absent.




export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mounted, setMounted] = useState(false);
  const [fb, setFb] = useState<{ firebaseApp: any; firestore: any; auth: any } | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    let token = localStorage.getItem('bf_session_token');
    if (!token) {
      // Generate a persistent identity token for this device/session
      // This acts as a browser-based MAC address for resource scoping
      const randomPart = Math.random().toString(16).substring(2, 14);
      token = `bf_live_guest_0x${randomPart}`;
      localStorage.setItem('bf_session_token', token);
    }
    setSessionToken(token);
  }, []);

  useEffect(() => {
    // initialize Firebase on client only
    try {
      const init = initializeFirebase();
      setFb(init);
    } catch (e) {
      // initialization may fail if env is misconfigured; leave fb null and let UI handle it
      // console.warn('Firebase init failed', e);
    }
  }, []);

  const updateToken = useCallback((newToken: string) => {
    localStorage.setItem('bf_session_token', newToken);
    setSessionToken(newToken);
  }, []);

  return (
    <html lang="en" className="dark">
      <head>
        <title>BridgeFlux | Network Intelligence</title>
        <meta name="description" content="Global TCP/HTTP Tunneling and Edge Diagnostics" />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-body antialiased bg-background text-foreground overflow-x-hidden selection:bg-primary/30`}>
        {fb ? (
          <FirebaseClientProvider firebaseApp={fb.firebaseApp} firestore={fb.firestore} auth={fb.auth}>
            <TokenContext.Provider value={{ token: sessionToken, updateToken }}>
              <div className="relative flex min-h-screen flex-col">
                {mounted && sessionToken ? children : (
                <div className="flex h-screen items-center justify-center bg-background">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Generating Mesh Identity...</p>
                  </div>
                </div>
                )}
              </div>
            </TokenContext.Provider>
            <Toaster />
          </FirebaseClientProvider>
        ) : (
          <div className="flex h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Initializing...</p>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
