"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/firebase';
import { initiateAnonymousSignIn, initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = useAuth();
  const router = useRouter();
  const { user } = useUser();

  // If already logged in, redirect to home
  React.useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    initiateEmailSignIn(auth, email, password);
  };

  const handleAnonymousSignIn = () => {
    initiateAnonymousSignIn(auth);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-6 py-20 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center max-w-6xl w-full">
          <div className="space-y-10">
            <h1 className="text-8xl font-black text-foreground tracking-tighter leading-[0.85] uppercase">
              Join the <br/><span className="text-primary">Network</span>
            </h1>
            <p className="text-3xl text-muted-foreground font-medium leading-tight">
              Access the Greenberry AI Radar to track, propose, and log strategic technological progress.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-black uppercase tracking-widest text-xs">Real-world Insights</div>
                  <div className="text-muted-foreground">Share and learn from studio experiences.</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-black uppercase tracking-widest text-xs">Governance First</div>
                  <div className="text-muted-foreground">Track sustainability and security across tools.</div>
                </div>
              </div>
            </div>
          </div>

          <Card className="rounded-[3rem] border-none bg-white shadow-2xl shadow-primary/10 p-8">
            <CardHeader className="text-center pb-10">
              <CardTitle className="text-4xl font-black tracking-tighter">Sign In</CardTitle>
              <CardDescription className="text-lg font-medium">Connect to the collective intelligence.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <form onSubmit={handleEmailSignIn} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@greenberry.nl" 
                    className="h-14 rounded-2xl border-2 border-border focus:border-primary bg-secondary/20"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    className="h-14 rounded-2xl border-2 border-border focus:border-primary bg-secondary/20"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full h-14 rounded-full font-black text-lg uppercase tracking-widest shadow-lg shadow-primary/20">
                  Authenticate
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-black tracking-widest bg-white px-2 text-muted-foreground/50">
                  Or use quick access
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-14 rounded-full font-black text-lg border-2 uppercase tracking-widest gap-2"
                onClick={handleAnonymousSignIn}
              >
                <Sparkles className="w-5 h-5 text-primary" />
                Guest Entry
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
