"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { collection, doc, query, where } from "firebase/firestore";
import {
  ArrowLeft,
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
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Blip,
  Experience,
  HistoryEntry,
  PricingTier,
  RadarConfigOption,
  RadarFamily,
  RadarProvider,
} from "@/app/lib/radar-types";
import {
  BLIP_HISTORY_COLLECTION,
  RADAR_BLIPS_COLLECTION,
  canEditBlip,
  mergeConfigOptions,
  mergeRadarFamilies,
  mergeRadarProviders,
  resolveBlip,
} from "@/lib/radar-firestore";
import {
  seedFamilies,
  seedProviders,
  seedQuadrants,
  seedRings,
} from "@/lib/radar-seed";
import common from "@/content/common.json";
import blipDetailContent from "@/content/pages/blip-detail.json";

interface BlipDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getOriginLabel(origin: Blip["origin"]): string {
  return (
    blipDetailContent.origins[
      origin as keyof typeof blipDetailContent.origins
    ] || origin
  );
}

function getHistoryActionLabel(action: string): string {
  return (
    blipDetailContent.historyActions[
      action as keyof typeof blipDetailContent.historyActions
    ] || action
  );
}

function getHistoryEntryTitle(
  entry: HistoryEntry,
  ringMap: Map<number, string>,
): string {
  if (entry.action === "ring changed" && typeof entry.after === "number") {
    return `${getHistoryActionLabel(entry.action)} naar ${ringMap.get(entry.after) || entry.after}`;
  }

  return getHistoryActionLabel(entry.action);
}

function getHistoryEntryMeta(
  entry: HistoryEntry,
  ringMap: Map<number, string>,
): string | null {
  if (
    entry.action === "ring changed" &&
    typeof entry.before === "number" &&
    typeof entry.after === "number"
  ) {
    const previousRing = ringMap.get(entry.before) || String(entry.before);
    const nextRing = ringMap.get(entry.after) || String(entry.after);

    return `Van ${previousRing} naar ${nextRing}`;
  }

  return null;
}

function getLegacyPricingSummary(pricingTiers?: PricingTier[]): string | null {
  if (!pricingTiers?.length) {
    return null;
  }

  return pricingTiers
    .slice(0, 2)
    .map((tier) => `${tier.name}: ${tier.cost}${tier.billing ? ` ${tier.billing}` : ""}`)
    .join(" | ");
}

export default function BlipDetailPage({
  params,
}: BlipDetailPageProps): React.ReactElement {
  const { id } = React.use(params);
  const db = useFirestore();
  const { authUser, hasCompanyAccess, isLoading, role } = useAppUser();

  const itemRef = useMemoFirebase(() => {
    if (!authUser || !hasCompanyAccess) {
      return null;
    }

    return doc(db, RADAR_BLIPS_COLLECTION, id);
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
  const providersQuery = useMemoFirebase(() => {
    if (!hasCompanyAccess) {
      return null;
    }

    return collection(db, "radarProviders");
  }, [db, hasCompanyAccess]);
  const familiesQuery = useMemoFirebase(() => {
    if (!hasCompanyAccess) {
      return null;
    }

    return collection(db, "radarFamilies");
  }, [db, hasCompanyAccess]);
  const blipHistoryQuery = useMemoFirebase(() => {
    if (!authUser || !hasCompanyAccess) {
      return null;
    }

    return collection(db, RADAR_BLIPS_COLLECTION, id, BLIP_HISTORY_COLLECTION);
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

  const { data: rawItem, isLoading: isItemLoading } = useDoc<Blip>(itemRef);
  const { data: quadrants } = useCollection<RadarConfigOption>(quadrantsQuery);
  const { data: rings } = useCollection<RadarConfigOption>(ringsQuery);
  const { data: providerDocs } = useCollection<RadarProvider>(providersQuery);
  const { data: familyDocs } = useCollection<RadarFamily>(familiesQuery);
  const { data: historyEntries } = useCollection<HistoryEntry>(blipHistoryQuery);
  const { data: relatedExperiences } = useCollection<Experience>(
    relatedExperiencesQuery,
  );

  const providers = useMemo(() => {
    return mergeRadarProviders(providerDocs, seedProviders);
  }, [providerDocs]);
  const families = useMemo(() => {
    return mergeRadarFamilies(familyDocs, seedFamilies);
  }, [familyDocs]);
  const item = useMemo(() => {
    if (!rawItem) {
      return null;
    }

    return resolveBlip(rawItem, families, providers);
  }, [families, providers, rawItem]);

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
              {common.auth.companySignInRequired}
            </h1>
            <p className="max-w-xl text-lg font-medium text-muted-foreground">
              {blipDetailContent.authError.description}
            </p>
          </div>
          <Button asChild className="rounded-full px-8">
            <Link href="/login">{common.auth.goToSignIn}</Link>
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
          <h1 className="text-4xl font-black">{blipDetailContent.blipNotFound}</h1>
          <Button asChild className="rounded-full px-8">
            <Link href="/dashboard">{blipDetailContent.backToDashboard}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const editableItem = rawItem || item;
  const canEdit = canEditBlip(editableItem, authUser.uid, role);
  const primaryLink = item.links?.[0] || item.pricingUrl || null;
  const pricingSummary =
    item.pricingSummary || getLegacyPricingSummary(item.pricingTiers) || "";

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
              {blipDetailContent.returnToDashboard}
            </Link>
          </Button>

          <div className="flex items-center gap-4">
            {canEdit ? (
              <Button asChild className="rounded-full px-6 font-bold">
                <Link href={`/blips/${item.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {common.common.edit}
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
                  {quadrantMap.get(item.quadrantId) || common.common.unassigned}
                </Badge>
                <Badge variant="outline" className="rounded-full px-6 py-2">
                  {ringMap.get(item.ringId) || common.common.unassigned}
                </Badge>
                {item.providerName ? (
                  <Badge variant="outline" className="rounded-full px-6 py-2">
                    {item.providerName}
                  </Badge>
                ) : null}
                {item.familyName ? (
                  <Badge variant="outline" className="rounded-full px-6 py-2">
                    {item.familyName}
                  </Badge>
                ) : null}
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
                    {blipDetailContent.latestReviewNote}
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
                  {common.labels.overview}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-10">
                <div className="whitespace-pre-wrap text-lg font-medium leading-relaxed text-foreground/90">
                  {item.notes}
                </div>

                {item.useCases?.length ? (
                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                      {blipDetailContent.sections.usefulFor}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {item.useCases.map((useCase) => (
                        <Card
                          key={`${item.id}-${useCase.role}`}
                          className="border-none bg-white shadow-none"
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-black tracking-tight">
                              {useCase.role}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm font-medium text-muted-foreground">
                            {useCase.summary}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {(item.availabilitySummary || item.accessNotes || item.accessRequestUrl) ? (
              <Card className="rounded-[3rem] border-none bg-secondary/10 shadow-none">
                <CardHeader>
                  <CardTitle className="text-3xl font-black tracking-tight">
                    {blipDetailContent.sections.availabilityAccess}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <Card className="border-none bg-white shadow-none">
                    <CardHeader>
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                        {blipDetailContent.sections.availability}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm font-medium text-foreground/90">
                      {item.availabilitySummary || blipDetailContent.fallbacks.notSet}
                    </CardContent>
                  </Card>
                  <Card className="border-none bg-white shadow-none">
                    <CardHeader>
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                        {blipDetailContent.sections.access}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm font-medium text-foreground/90">
                      <div>{item.accessNotes || blipDetailContent.fallbacks.notSet}</div>
                      {item.accessRequestUrl ? (
                        <a
                          href={item.accessRequestUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-primary hover:underline"
                        >
                          {blipDetailContent.fallbacks.requestAccess}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            ) : null}

            <Card className="rounded-[3rem] border-none bg-secondary/10 shadow-none">
              <CardHeader>
                <CardTitle className="text-3xl font-black tracking-tight">
                  {blipDetailContent.sections.governanceSnapshot}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-3">
                <Card className="border-none bg-white shadow-none">
                  <CardHeader>
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                      {common.labels.security}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm font-medium text-foreground/90">
                    <div>{item.securityNotes || blipDetailContent.fallbacks.needsVerification}</div>
                    {item.securityCertifications?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {item.securityCertifications.map((reference) =>
                          reference.url ? (
                            <a
                              key={`${item.id}-${reference.label}`}
                              href={reference.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${badgeVariants({ variant: "outline" })} border-primary/20 text-primary`}
                            >
                              {reference.label}
                            </a>
                          ) : (
                            <span
                              key={`${item.id}-${reference.label}`}
                              className={`${badgeVariants({ variant: "outline" })} border-primary/20 text-primary`}
                              title={reference.details}
                            >
                              {reference.label}
                            </span>
                          ),
                        )}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
                <Card className="border-none bg-white shadow-none">
                  <CardHeader>
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                      {common.labels.origin}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm font-medium text-foreground/90">
                    {getOriginLabel(item.origin)}
                  </CardContent>
                </Card>
                <Card className="border-none bg-white shadow-none">
                  <CardHeader>
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                      {common.labels.pricing}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm font-medium text-foreground/90">
                    <div>{pricingSummary || blipDetailContent.fallbacks.needsVerification}</div>
                    {item.pricingUrl ? (
                      <a
                        href={item.pricingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        {blipDetailContent.sections.viewPricing}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {item.modelEntries?.length ? (
              <Card className="rounded-[3rem] border-none bg-secondary/10 shadow-none">
                <CardHeader>
                  <CardTitle className="text-3xl font-black tracking-tight">
                    {blipDetailContent.sections.modelsBenchmarks}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {item.modelEntries.map((model) => (
                    <div
                      key={`${item.id}-${model.name}`}
                      className="rounded-[2rem] border border-border/50 bg-white p-6"
                    >
                      <div className="space-y-4">
                        <div>
                          <div className="text-2xl font-black tracking-tight">
                            {model.name}
                          </div>
                          <div className="mt-2 text-sm font-medium text-muted-foreground">
                            {model.summary}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {model.vendorLink ? (
                            <a
                              href={model.vendorLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-full border border-primary/20 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
                            >
                              {blipDetailContent.sections.vendorLink}
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : null}
                          {model.benchmarkLinks?.map((link) => (
                            <a
                              key={`${model.name}-${link.url}`}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary/20"
                            >
                              {link.label}
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {!item.modelEntries?.length && item.pricingTiers?.length ? (
              <Card className="rounded-[3rem] border-none bg-secondary/10 shadow-none">
                <CardHeader>
                  <CardTitle className="text-3xl font-black tracking-tight">
                    {blipDetailContent.sections.pricingDetails}
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
                            {tier.billing || blipDetailContent.fallbacks.flexibleBilling}
                          </div>
                        </div>
                        <div className="text-2xl font-black text-primary">{tier.cost}</div>
                      </div>
                      <ul className="mt-4 space-y-2">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-3 text-sm font-medium">
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
                  {common.labels.relatedExperiences}
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
                      {(() => {
                        const matchingContext = experience.toolContexts?.find(
                          (context) =>
                            (context.blipId || context.itemId) === item.id,
                        );
                        const contextFamilyName = matchingContext?.familyId
                          ? families.find((family) => family.id === matchingContext.familyId)?.name
                          : null;

                        return (
                          <div className="flex items-center justify-between gap-6">
                            <div className="space-y-2">
                              <div className="text-xl font-black tracking-tight">
                                {experience.title}
                              </div>
                              <div className="text-sm font-medium text-muted-foreground">
                                {experience.summary}
                              </div>
                              {matchingContext ? (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {contextFamilyName ? (
                                    <Badge variant="outline" className="rounded-full">
                                      {contextFamilyName}
                                    </Badge>
                                  ) : null}
                                  {matchingContext.modelName ? (
                                    <Badge variant="outline" className="rounded-full">
                                      {matchingContext.modelName}
                                    </Badge>
                                  ) : null}
                                  {matchingContext.modelVersion ? (
                                    <Badge variant="outline" className="rounded-full">
                                      v{matchingContext.modelVersion}
                                    </Badge>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                            <Sparkles className="h-5 w-5 text-primary" />
                          </div>
                        );
                      })()}
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[2rem] border border-dashed border-border p-8 text-center text-sm font-medium text-muted-foreground">
                    {blipDetailContent.fallbacks.noExperiences}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-10 lg:col-span-4">
            <Card className="rounded-[3rem] border-none bg-white shadow-xl shadow-primary/10">
              <CardHeader>
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  {common.labels.lifecycleData}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {common.labels.owner}
                  </div>
                  <div className="text-xl font-bold">{item.ownerName}</div>
                </div>
                {item.providerName ? (
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      {common.labels.provider}
                    </div>
                    <div className="text-xl font-bold">{item.providerName}</div>
                  </div>
                ) : null}
                {item.familyName ? (
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      {common.labels.family}
                    </div>
                    <div className="text-xl font-bold">{item.familyName}</div>
                  </div>
                ) : null}
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {common.labels.created}
                  </div>
                  <div className="text-xl font-bold">{formatDate(item.createdAt)}</div>
                </div>
                {item.submittedAt ? (
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      {common.labels.submitted}
                    </div>
                    <div className="text-xl font-bold">{formatDate(item.submittedAt)}</div>
                  </div>
                ) : null}
                {primaryLink ? (
                  <Button asChild variant="outline" className="w-full rounded-full">
                    <a href={primaryLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {blipDetailContent.fallbacks.openLink}
                    </a>
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-[3rem] border-none bg-white shadow-xl shadow-primary/10">
              <CardHeader>
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  {blipDetailContent.sections.responsibilityNotes}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {common.labels.sustainability}
                  </div>
                  <div className="text-sm font-medium text-foreground/90">
                    {item.sustainabilityNotes || blipDetailContent.fallbacks.needsVerification}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {common.labels.ethics}
                  </div>
                  <div className="text-sm font-medium text-foreground/90">
                    {item.ethicsNotes || blipDetailContent.fallbacks.needsVerification}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[3rem] border-none bg-white shadow-xl shadow-primary/10">
              <CardHeader>
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  {common.labels.activity}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {sortedHistory.length ? (
                  sortedHistory.map((entry) => (
                    <div key={entry.id} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-foreground">
                        <FileClock className="h-4 w-4 text-primary" />
                        {getHistoryEntryTitle(entry, ringMap)}
                      </div>
                      {getHistoryEntryMeta(entry, ringMap) ? (
                        <p className="text-sm font-medium text-foreground/70">
                          {getHistoryEntryMeta(entry, ringMap)}
                        </p>
                      ) : null}
                      {entry.note ? (
                        <p className="text-sm font-medium text-muted-foreground">
                          {entry.note}
                        </p>
                      ) : null}
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                        <Clock className="h-3 w-3" />
                        {formatDate(entry.createdAt)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm font-medium text-muted-foreground">
                    {blipDetailContent.fallbacks.noHistory}
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
