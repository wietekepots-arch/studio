"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useAppUser } from "@/components/app/AppUserProvider";
import { SharedProfilesAdmin } from "@/components/admin/SharedProfilesAdmin";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";

export default function AdminPage(): React.ReactElement {
  const { authUser, canReview, hasCompanyAccess, isLoading } = useAppUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!hasCompanyAccess || !authUser) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <div className="space-y-3">
            <h1 className="text-5xl font-black tracking-tighter">
              Company sign-in required
            </h1>
            <p className="max-w-xl text-lg font-medium text-muted-foreground">
              Sign in with your Greenberry account to manage shared radar profiles.
            </p>
          </div>
          <Button asChild className="rounded-full px-8">
            <Link href="/login">Go to Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!canReview) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-4xl font-black">Admin access required</h1>
          <p className="max-w-xl text-muted-foreground">
            Only PowerUsers and Admins can manage provider and family defaults.
          </p>
          <Button asChild className="rounded-full px-8">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-7xl px-6 py-12">
        <SharedProfilesAdmin />
      </main>
    </div>
  );
}
