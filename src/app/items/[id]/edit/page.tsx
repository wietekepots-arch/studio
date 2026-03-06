"use client";

import React from "react";
import { doc } from "firebase/firestore";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { useAppUser } from "@/components/app/AppUserProvider";
import { RadarItemForm } from "@/components/radar/RadarItemForm";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { Button } from "@/components/ui/button";
import { RadarItem } from "@/app/lib/radar-types";
import { canEditRadarItem } from "@/lib/radar-firestore";

interface EditItemPageProps {
  params: Promise<{ id: string }>;
}

export default function EditItemPage({
  params,
}: EditItemPageProps): React.ReactElement {
  const { id } = React.use(params);
  const db = useFirestore();
  const { authUser, hasCompanyAccess, isLoading, role } = useAppUser();
  const itemRef = useMemoFirebase(() => {
    if (!authUser || !hasCompanyAccess) {
      return null;
    }

    return doc(db, "radarItems", id);
  }, [authUser, db, hasCompanyAccess, id]);
  const { data: item, isLoading: isItemLoading } = useDoc<RadarItem>(itemRef);

  if (isLoading || isItemLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!hasCompanyAccess || !authUser || !item) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-4xl font-black">Blip not available</h1>
          <Button asChild className="rounded-full px-8">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!canEditRadarItem(item, authUser.uid, role)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-4xl font-black">Editing not allowed</h1>
          <p className="max-w-lg text-muted-foreground">
            Members can only edit their own draft or pending blips. Reviewers
            can edit all items.
          </p>
          <Button asChild className="rounded-full px-8">
            <Link href={`/items/${item.id}`}>Open Detail View</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-6 py-12">
        <RadarItemForm initialItem={item} />
      </main>
    </div>
  );
}
