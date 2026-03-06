"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { collection, doc, query, where } from "firebase/firestore";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileClock,
  Pencil,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useAppUser } from "@/components/app/AppUserProvider";
import { useCollection, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadarConfigOption, RadarItem, Experience, HistoryEntry } from "@/app/lib/radar-types";
import {
  canEditRadarItem,
  getStatusBadgeVariant,
  mergeConfigOptions,
} from "@/lib/radar-firestore";
import { seedQuadrants, seedRings } from "@/lib/radar-seed";

interface ItemDetailPageProps {
  params: Promise<{ id: string }>;
}

function ScoreRow({
  label,
  value,
}: {
  label: string;
  value: number;
}): React.ReactElement {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
        <span>{label}</span>
        <span>{value}/5</span>
      </div>
      <Progress value={value * 20} className="h-4 rounded-full bg-secondary" />
    </div>
  );
}

export default function ItemDetailPage({
  params,
}: ItemDetailPageProps): React.ReactElement {
  const { id } = React.use(params);
  const db = useFirestore();
  const { authUser, hasCompanyAccess, isLoading, role } = useAppUser();

  const itemRef = useMemoFirebase(() => {
    if (!authUser || !hasCompanyAccess) {
      return null;
    }

    return doc(db, "radarItems", id);
  }, [authUser, db, hasCompanyAccess, id]);
  const quadrantsQuery = useMemoFirebase(() => {
    if (!hasCompanyAccess) {
      return null;
    }

    return collection(db, "quadrants");
  }, [db, hasCompanyAccess]);
  const ringsQuery = useMemoFirebase(() => {
    if (!hasCompanyAccess) {
      return null;
    }

    return collection(db, "rings");
  }, [db, hasCompanyAccess]);
  const itemHistoryQuery = useMemoFirebase(() => {
    if (!authUser || !hasCompanyAccess) {
      return null;
    }

    return collection(db, "radarItems", id, "itemHistory");
  }, [authUser, db, hasCompanyAccess, id]);
  const relatedExperiencesQuery = useMemoFirebase(() => {
    if (!authUser || !hasCompanyAccess) {
      return null;
    }

    return query(
      collection(db, "experiences"),
      where("toolLinks", "array-contains", id),
      where("status", "==", "Published"),
    );
  }, [authUser, db, hasCompanyAccess, id]);

  const { data: item, isLoading: isItemLoading } = useDoc<RadarItem>(itemRef);
  const { data: quadrants } = useCollection<RadarConfigOption>(quadrantsQuery);
  const { data: rings } = useCollection<RadarConfigOption>(ringsQuery);
  const { data: historyEntries } = useCollection<HistoryEntry>(itemHistoryQuery);
  const { data: relatedExperiences } = useCollection<Experience>(
    relatedExperiencesQuery,
  );

  const quadrantMap = useMemo(() => {
    return new Map(
      mergeConfigOptions(quadrants, seedQuadrants, true).map((option) => [
        option.order,
        option.name,
      ]),
    );
  }, [quadrants]);
  const ringMap = useMemo(() => {
    return new Map(
      mergeConfigOptions(rings, seedRings).map((option) => [
        option.order,
        option.name,
      ]),
    );
  }, [rings]);
  const sortedHistory = useMemo(() => {
    return [...(historyEntries || [])].sort(
      (left, right) => right.createdAt - left.createdAt,
    );
  }, [historyEntries]);

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
              Sign in with your Greenberry Google account to view radar items.
            </p>
          </div>
          <Button asChild className="rounded-full px-8">
            <Link href="/login">Go to Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-4xl font-black">Blip not found</h1>
          <Button asChild className="rounded-full px-8">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const canEdit = canEditRadarItem(item, authUser.uid, role);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto max-w-7xl px-6 py-12 lg:px-12">
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <Button
            variant="ghost"
            asChild
            className="gap-3 -ml-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
              Return to Dashboard
            </Link>
          </Button>

          <div className="flex items-center gap-4">
            <Badge
              variant={getStatusBadgeVariant(item.status)}
              className="rounded-full px-6 py-2 font-black uppercase tracking-widest"
            >
              {item.status}
            </Badge>
            {canEdit ? (
              <Button asChild className="rounded-full px-6 font-bold">
                <Link href={`/items/${item.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          <div className="space-y-12 lg:col-span-8">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Badge className="rounded-full bg-primary/10 px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  {quadrantMap.get(item.quadrantId) || "Unassigned"}
                </Badge>
                <Badge variant="outline" className="rounded-full px-6 py-2">
                  {ringMap.get(item.ringId) || "Unassigned"}
                </Badge>
              </div>
              <h1 className="text-7xl font-black leading-[0.85] tracking-tighter">
                {item.name}
              </h1>
              <p className="max-w-4xl text-3xl font-medium leading-tight text-muted-foreground">
                {item.shortDesc}
              </p>
              <div className="flex flex-wrap gap-3">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="rounded-full px-5 py-2">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>

            {item.reviewComment ? (
              <Card className="rounded-[2.5rem] border-none bg-primary/5 shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg font-black tracking-tight">
                    Latest review note
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  {item.reviewComment}
                </CardContent>
              </Card>
            ) : null}

            <Card className="rounded-[3rem] border-none bg-secondary/10 shadow-none">
              <CardHeader>
                <CardTitle className="text-3xl font-black tracking-tight">
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-10">
                <div className="whitespace-pre-wrap text-lg font-medium leading-relaxed text-foreground/90">
                  {item.notes}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-none bg-white shadow-none">
                    <CardHeader>
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                        Sustainability
                      </CardTitle>
                    </CardHeader>
                    <CardContent>{item.sustainabilityNotes || "Pending review"}</CardContent>
                  </Card>
                  <Card className="border-none bg-white shadow-none">
                    <CardHeader>
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                        Security
                      </CardTitle>
                    </CardHeader>
                    <CardContent>{item.securityNotes || "Pending review"}</CardContent>
                  </Card>
                  <Card className="border-none bg-white shadow-none">
                    <CardHeader>
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                        Ethics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>{item.ethicsNotes || "Pending review"}</CardContent>
                  </Card>
                  <Card className="border-none bg-white shadow-none">
                    <CardHeader>
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                        Origin
                      </CardTitle>
                    </CardHeader>
                    <CardContent>{item.origin}</CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {item.pricingTiers?.length ? (
              <Card className="rounded-[3rem] border-none bg-secondary/10 shadow-none">
                <CardHeader>
                  <CardTitle className="text-3xl font-black tracking-tight">
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {item.pricingTiers.map((tier) => (
                    <div
                      key={tier.name}
                      className="rounded-[2rem] border border-border/50 bg-white p-6"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-2xl font-black tracking-tight">
                            {tier.name}
                          </div>
                          <div className="text-sm font-medium text-muted-foreground">
                            {tier.billing || "Flexible billing"}
                          </div>
                        </div>
                        <div className="text-2xl font-black text-primary">
                          {tier.cost}
                        </div>
                      </div>
                      <ul className="mt-4 space-y-2">
                        {tier.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-center gap-3 text-sm font-medium"
                          >
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            <Card className="rounded-[3rem] border-none bg-secondary/10 shadow-none">
              <CardHeader>
                <CardTitle className="text-3xl font-black tracking-tight">
                  Related Experiences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {relatedExperiences?.length ? (
                  relatedExperiences.map((experience) => (
                    <Link
                      key={experience.id}
                      href={`/experiences/${experience.id}`}
                      className="block rounded-[2rem] border border-border/50 bg-white p-6 transition-all hover:border-primary/20"
                    >
                      <div className="flex items-center justify-between gap-6">
                        <div className="space-y-2">
                          <div className="text-xl font-black tracking-tight">
                            {experience.title}
                          </div>
                          <div className="text-sm font-medium text-muted-foreground">
                            {experience.summary}
                          </div>
                        </div>
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[2rem] border border-dashed border-border p-8 text-center text-sm font-medium text-muted-foreground">
                    No published experiences are linked to this blip yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-10 lg:col-span-4">
            <Card className="rounded-[3rem] border-none bg-white shadow-xl shadow-primary/10">
              <CardHeader>
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  Strategic Pulse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <ScoreRow label="Tool Maturity" value={item.scores.maturity} />
                <ScoreRow label="Potential Impact" value={item.scores.impact} />
                <ScoreRow label="Effort to Build" value={item.scores.effort} />
                <ScoreRow label="Risk Profile" value={item.scores.risk} />
              </CardContent>
            </Card>

            <Card className="rounded-[3rem] border-none bg-white shadow-xl shadow-primary/10">
              <CardHeader>
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  Lifecycle Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Owner
                  </div>
                  <div className="text-xl font-bold">{item.ownerName}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Created
                  </div>
                  <div className="text-xl font-bold">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {item.submittedAt ? (
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Submitted
                    </div>
                    <div className="text-xl font-bold">
                      {new Date(item.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                ) : null}
                {item.links?.[0] ? (
                  <Button asChild variant="outline" className="w-full rounded-full">
                    <a href={item.links[0]} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Vendor Link
                    </a>
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-[3rem] border-none bg-white shadow-xl shadow-primary/10">
              <CardHeader>
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {sortedHistory.length ? (
                  sortedHistory.map((entry) => (
                    <div key={entry.id} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-foreground">
                        <FileClock className="h-4 w-4 text-primary" />
                        {entry.action}
                      </div>
                      {entry.note ? (
                        <p className="text-sm font-medium text-muted-foreground">
                          {entry.note}
                        </p>
                      ) : null}
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                        <Clock className="h-3 w-3" />
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm font-medium text-muted-foreground">
                    No workflow history has been recorded yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
