"use client";

import React, { useMemo } from "react";
import { collection } from "firebase/firestore";
import { Layers3, Network, ShieldCheck } from "lucide-react";
import { RadarFamily, RadarProvider } from "@/app/lib/radar-types";
import { FamilyManager } from "@/components/admin/FamilyManager";
import { ProviderManager } from "@/components/admin/ProviderManager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import {
  mergeRadarFamilies,
  mergeRadarProviders,
} from "@/lib/radar-firestore";
import { seedFamilies, seedProviders } from "@/lib/radar-seed";

export function SharedProfilesAdmin(): React.ReactElement {
  const db = useFirestore();
  const providersQuery = useMemoFirebase(() => {
    return collection(db, "radarProviders");
  }, [db]);
  const familiesQuery = useMemoFirebase(() => {
    return collection(db, "radarFamilies");
  }, [db]);
  const { data: providerDocs } = useCollection<RadarProvider>(providersQuery);
  const { data: familyDocs } = useCollection<RadarFamily>(familiesQuery);

  const providers = useMemo(() => {
    return mergeRadarProviders(providerDocs, seedProviders);
  }, [providerDocs]);
  const families = useMemo(() => {
    return mergeRadarFamilies(familyDocs, seedFamilies);
  }, [familyDocs]);

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
          Shared Governance Profiles
        </div>
        <h1 className="text-6xl font-black uppercase leading-none tracking-tighter">
          Provider and <span className="text-primary">Family Defaults</span>
        </h1>
        <p className="max-w-3xl text-lg font-medium text-muted-foreground">
          Manage the shared origin, security, sustainability, and ethics defaults
          inherited by model families and individual blips.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none bg-secondary/20 shadow-none">
          <CardHeader>
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              Providers
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-3xl font-black tracking-tight">
            <span>{providers.length}</span>
            <Network className="h-6 w-6 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-none bg-secondary/20 shadow-none">
          <CardHeader>
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              Families
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-3xl font-black tracking-tight">
            <span>{families.length}</span>
            <Layers3 className="h-6 w-6 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-none bg-secondary/20 shadow-none">
          <CardHeader>
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              Resolution Order
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-black tracking-tight">
            Item Override → Family → Provider
          </CardContent>
        </Card>
      </div>

      <Alert className="rounded-[2rem] border-primary/10 bg-primary/5">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <AlertTitle>How inheritance works</AlertTitle>
        <AlertDescription>
          Provider records define the broad defaults. Family records only need
          values that differ. Blips should override shared fields only when a
          specific version genuinely diverges from its family.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList className="h-auto rounded-full bg-secondary/30 p-1">
          <TabsTrigger value="providers" className="rounded-full px-5 py-2.5">
            Providers
          </TabsTrigger>
          <TabsTrigger value="families" className="rounded-full px-5 py-2.5">
            Families
          </TabsTrigger>
        </TabsList>
        <TabsContent value="providers" className="mt-0">
          <ProviderManager db={db} providers={providers} />
        </TabsContent>
        <TabsContent value="families" className="mt-0">
          <FamilyManager db={db} providers={providers} families={families} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
