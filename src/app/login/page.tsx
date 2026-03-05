
"use client";

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { initiateAnonymousSignIn, initiateEmailSignIn, initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Zap, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { doc, getDoc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupError, setSetupError] = useState(false);
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (user && db) {
      const isGreenberry = user.email?.endsWith('@greenberry.nl');
      const isAnonymous = user.isAnonymous;

      if (isGreenberry || isAnonymous) {
        // Ensure a UserProfile document exists for the user
        const profileRef = doc(db, 'userProfiles', user.uid);
        
        getDoc(profileRef).then((snapshot) => {
          if (!snapshot.exists()) {
            setDocumentNonBlocking(profileRef, {
              id: user.uid,
              displayName: user.displayName || user.email?.split('@')[0] || 'Greenberry Member',
              email: user.email,
              role: isGreenberry ? 'Editor' : 'Viewer', // Greenberry members are Editors by default
              team: isGreenberry ? 'Agency' : 'Guest',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
          router.push('/');
        });
      } else {
        toast({
          title: "Access Restricted",
          description: "This network is exclusive to @greenberry.nl accounts. Personal accounts are not permitted.",
          variant: "destructive"
        });
        signOut(auth).then(() => {
          setLoading(false);
        });
      }
    }
  }, [user, db, router, auth, toast]);

  const handleAuthError = (error: any) => {
    setLoading(false);
    console.error("Auth Error:", error);
    
    if (error.code === 'auth/operation-not-allowed') {
      setSetupError(true);
      toast({
        title: "Action Required",
        description: "Authentication providers are not yet enabled in your Firebase Console.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sign-in Error",
        description: error.message || "An unexpected error occurred during sign-in.",
        variant: "destructive"
      });
    }
  };

  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    initiateEmailSignIn(auth, email, password)
      .catch(handleAuthError);
  };

  const handleGoogleSignIn = () => {
    setLoading(true);
    initiateGoogleSignIn(auth)
      .catch(handleAuthError);
  };

  const handleAnonymousSignIn = () => {
    setLoading(true);
    initiateAnonymousSignIn(auth)
      .catch(handleAuthError);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-6 py-20 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center max-w-6xl w-full">
          <div className="space-y-10">
            <h1 className="text-8xl font-black text-foreground tracking-tighter leading-[0.85] uppercase">
              Agency <br/><span className="text-primary">Domain</span>
            </h1>
            <p className="text-3xl text-muted-foreground font-medium leading-tight">
              Only @greenberry.nl accounts are authorized to access the full strategic pulse.
            </p>
            
            {setupError && (
              <Alert variant="destructive" className="border-2 rounded-3xl bg-destructive/5">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="font-black uppercase tracking-widest text-xs mb-2">Setup Required</AlertTitle>
                <AlertDescription className="text-sm font-medium">
                  Please enable Google, Anonymous, and Email providers in your Firebase Console.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-black uppercase tracking-widest text-xs">Domain Exclusive</div>
                  <div className="text-muted-foreground text-sm">Protected by @greenberry.nl verification.</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-black uppercase tracking-widest text-xs">Internal Governance</div>
                  <div className="text-muted-foreground text-sm">Strategic tools are kept private and secure.</div>
                </div>
              </div>
            </div>
          </div>

          <Card className="rounded-[3rem] border-none bg-white shadow-2xl shadow-primary/10 p-8">
            <CardHeader className="text-center pb-10">
              <CardTitle className="text-4xl font-black tracking-tighter">Greenberry SSO</CardTitle>
              <CardDescription className="text-lg font-medium">Authentication required to view Pulses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <Button 
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-16 rounded-full font-black text-lg uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-3 bg-white text-foreground border-2 border-border hover:bg-secondary/20"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 11h-.011L12 11.002V11zm0-7c-3.309 0-6 2.691-6 6s2.691 6 6 6c2.651 0 4.904-1.742 5.664-4.137l-2.028-.658C14.995 12.872 13.626 14 12 14c-2.206 0-4-1.794-4-4s1.794-4 4-4c1.103 0 2.09.449 2.801 1.172l2.122-2.122C15.719 3.847 13.972 3 12 3z"/>
                      <path fill="#FBBC05" d="M12 3c1.972 0 3.719.847 4.923 2.05l2.122-2.122C17.28 1.165 14.771 0 12 0 7.333 0 3.328 2.671 1.458 6.551l2.748 1.348C5.223 5.378 8.358 3 12 3z"/>
                      <path fill="#4285F4" d="M23.491 10.218c.334 1.163.509 2.378.509 3.614 0 5.421-3.644 9.473-9 9.945V21c3.866 0 7-3.134 7-7 0-1.042-.23-2.031-.639-2.924l2.13-1.858z"/>
                      <path fill="#34A853" d="M12 24c5.111 0 9.456-3.326 11.491-7.782l-2.13-1.858C19.782 17.585 16.142 21 12 21c-4.962 0-9-4.038-9-9 0-3.585 2.103-6.68 5.165-8.101L5.417 1.251C2.176 3.494 0 7.489 0 12c0 6.627 5.373 12 12 12z"/>
                    </svg>
                    Sign in with Google
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest bg-white px-2 text-muted-foreground/50">
                  Guest Access
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  className="w-full h-14 rounded-full font-black text-xs border-2 border-dashed uppercase tracking-widest gap-2 opacity-70 hover:opacity-100"
                  onClick={handleAnonymousSignIn}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <Zap className="w-4 h-4 text-primary" />
                      Enter as Guest (Dutch Studio Only)
                    </>
                  )}
                </Button>
                <p className="text-[9px] text-center text-muted-foreground uppercase font-bold tracking-widest">
                  Personal Gmail accounts will be denied entry.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
