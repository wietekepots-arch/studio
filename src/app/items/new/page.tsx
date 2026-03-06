"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { useAppUser } from "@/components/app/AppUserProvider";
import { RadarItemForm } from "@/components/radar/RadarItemForm";
import { Button } from "@/components/ui/button";

export default function NewItemPage(): React.ReactElement {
  const { hasCompanyAccess, isLoading } = useAppUser();

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

  if (!hasCompanyAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-4xl font-black">Company sign-in required</h1>
          <p className="max-w-xl text-muted-foreground">
            You need your Greenberry Google account before you can submit a tool
            suggestion.
          </p>
          <Button asChild className="rounded-full px-8">
            <Link href="/login">Go to Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-6 py-12">
        <RadarItemForm />
      </main>
    </div>
  );
}
