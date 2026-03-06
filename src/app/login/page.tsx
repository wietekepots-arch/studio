"use client";

import React, { useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { LogIn, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser } from "@/firebase";
import { useAppUser } from "@/components/app/AppUserProvider";
import { initiateGoogleSignIn } from "@/firebase/non-blocking-login";
import { isCompanyEmail } from "@/lib/company-auth";

export default function LoginPage(): React.ReactElement {
  const auth = useAuth();
  const router = useRouter();
  const invalidUserHandledRef = useRef(false);
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const { hasCompanyAccess } = useAppUser();

  useEffect(() => {
    if (hasCompanyAccess) {
      router.push("/dashboard");
    }
  }, [hasCompanyAccess, router]);

  useEffect(() => {
    if (
      isUserLoading ||
      !user ||
      isCompanyEmail(user.email) ||
      invalidUserHandledRef.current
    ) {
      return;
    }

    invalidUserHandledRef.current = true;
    toast({
      title: "Access denied",
      description: "Please sign in with your official @greenberry.nl account.",
      variant: "destructive",
    });

    void signOut(auth).finally(() => {
      invalidUserHandledRef.current = false;
    });
  }, [auth, isUserLoading, toast, user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto flex items-center justify-center px-6 py-20">
        <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-20 lg:grid-cols-2">
          <div className="space-y-10">
            <h1 className="text-8xl font-black uppercase leading-[0.85] tracking-tighter text-foreground">
              Join the <br />
              <span className="text-primary">Network</span>
            </h1>
            <p className="text-3xl font-medium leading-tight text-muted-foreground">
              Sign in with your Greenberry Google account to access the radar,
              suggest tools, and review the latest pulses.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-widest">
                    Internal workflow
                  </div>
                  <div className="text-muted-foreground">
                    Company-only access with role-based review queues.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-widest">
                    Google only
                  </div>
                  <div className="text-muted-foreground">
                    Access is limited to verified `@greenberry.nl` accounts.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Card className="border-none bg-white p-8 shadow-2xl shadow-primary/10">
            <CardHeader className="pb-10 text-center">
              <CardTitle className="text-4xl font-black tracking-tighter">
                Sign in
              </CardTitle>
              <CardDescription className="text-lg font-medium">
                Use your company Google account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <Button
                className="flex h-16 w-full items-center justify-center gap-3 rounded-full border-2 border-border bg-white text-lg font-black uppercase tracking-widest text-foreground shadow-lg shadow-primary/20 hover:bg-secondary/20"
                onClick={() => initiateGoogleSignIn(auth)}
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 11h-.011L12 11.002V11zm0-7c-3.309 0-6 2.691-6 6s2.691 6 6 6c2.651 0 4.904-1.742 5.664-4.137l-2.028-.658C14.995 12.872 13.626 14 12 14c-2.206 0-4-1.794-4-4s1.794-4 4-4c1.103 0 2.09.449 2.801 1.172l2.122-2.122C15.719 3.847 13.972 3 12 3z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M12 3c1.972 0 3.719.847 4.923 2.05l2.122-2.122C17.28 1.165 14.771 0 12 0 7.333 0 3.328 2.671 1.458 6.551l2.748 1.348C5.223 5.378 8.358 3 12 3z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.491 10.218c.334 1.163.509 2.378.509 3.614 0 5.421-3.644 9.473-9 9.945V21c3.866 0 7-3.134 7-7 0-1.042-.23-2.031-.639-2.924l2.13-1.858z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c5.111 0 9.456-3.326 11.491-7.782l-2.13-1.858C19.782 17.585 16.142 21 12 21c-4.962 0-9-4.038-9-9 0-3.585 2.103-6.68 5.165-8.101L5.417 1.251C2.176 3.494 0 7.489 0 12c0 6.627 5.373 12 12 12z"
                  />
                </svg>
                <LogIn className="h-5 w-5" />
                Continue with Google
              </Button>

              <div className="rounded-[2rem] border border-dashed border-primary/20 bg-primary/5 p-6 text-center">
                <div className="mb-3 flex items-center justify-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">
                    Access policy
                  </span>
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Personal Gmail, guest access, and legacy password sign-in are
                  disabled for this workflow.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
