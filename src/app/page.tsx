"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, orderBy, query, where } from "firebase/firestore";
import {
  ChevronRight,
  Clock,
  Plus,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import common from "@/content/common.json";
import homeContent from "@/content/pages/home.json";
import { OutcomeStars } from "@/components/experiences";
import { Navbar } from "@/components/layout/Navbar";
import { PageTitle } from "@/components/layout/PageTitle";
import { useAppUser } from "@/components/app/AppUserProvider";
import { RadarBlipLegend } from "@/components/radar/RadarBlipLegend";
import { RadarChart } from "@/components/radar/RadarChart";
import { RadarQuadrantLegend } from "@/components/radar/RadarQuadrantLegend";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Blip, Experience, RadarConfigOption } from "@/app/lib/radar-types";
import {
  buildRadarConfig,
  sortConfigOptions,
  sortBlips,
} from "@/lib/radar-firestore";

export default function HomePage(): React.ReactElement {
  const db = useFirestore();
  const { authUser, hasCompanyAccess, isLoading, profile } = useAppUser();
  const [search, setSearch] = useState("");
  const [activeQuadrant, setActiveQuadrant] = useState<number | undefined>();
  const [mounted, setMounted] = useState(false);
  const [latestExperiencesOpenOverride, setLatestExperiencesOpenOverride] =
    useState<boolean | null>(null);
  const [
    isLatestExperiencesContentVisible,
    setIsLatestExperiencesContentVisible,
  ] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  const approvedBlipsQuery = useMemoFirebase(() => {
    if (!authUser || !hasCompanyAccess) {
      return null;
    }

    return query(
      collection(db, "radarItems"),
      where("status", "==", "Approved")
    );
  }, [authUser, db, hasCompanyAccess]);
  const publishedExperiencesQuery = useMemoFirebase(() => {
    if (!authUser || !hasCompanyAccess) {
      return null;
    }

    return query(
      collection(db, "experiences"),
      where("status", "==", "Published"),
      orderBy("createdAt", "desc")
    );
  }, [authUser, db, hasCompanyAccess]);

  const { data: quadrantDocs } =
    useCollection<RadarConfigOption>(quadrantsQuery);
  const { data: ringDocs } = useCollection<RadarConfigOption>(ringsQuery);
  const { data: approvedBlips, isLoading: isBlipsLoading } =
    useCollection<Blip>(approvedBlipsQuery);
  const { data: publishedExperiences, isLoading: isExperiencesLoading } =
    useCollection<Experience>(publishedExperiencesQuery);

  const quadrants = sortConfigOptions(quadrantDocs);
  const rings = sortConfigOptions(ringDocs);
  const config = buildRadarConfig(quadrants, rings);
  const sortedBlips = sortBlips(approvedBlips);
  const recentExperiences = (publishedExperiences ?? []).slice(0, 4);
  const authLastSignInAt = useMemo(() => {
    if (!authUser?.metadata.lastSignInTime) {
      return null;
    }

    const timestamp = new Date(authUser.metadata.lastSignInTime).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
  }, [authUser?.metadata.lastSignInTime]);
  const experienceDrawerBaselineAt = useMemo(() => {
    if (!profile) {
      return null;
    }

    if (
      authLastSignInAt !== null &&
      profile.lastLoginAt === authLastSignInAt
    ) {
      return profile.previousLoginAt ?? profile.lastLoginAt ?? null;
    }

    return profile.lastLoginAt ?? profile.previousLoginAt ?? null;
  }, [authLastSignInAt, profile]);
  const shouldOpenLatestExperiencesByDefault = useMemo(() => {
    if (!experienceDrawerBaselineAt || !publishedExperiences?.length) {
      return false;
    }

    return publishedExperiences.some(
      (experience) => experience.createdAt > experienceDrawerBaselineAt,
    );
  }, [experienceDrawerBaselineAt, publishedExperiences]);
  const isLatestExperiencesOpen =
    latestExperiencesOpenOverride ?? shouldOpenLatestExperiencesByDefault;
  const latestExperiencesWidthClass = isLatestExperiencesOpen
    ? "w-full lg:w-[24rem]"
    : "w-full lg:w-20";
  const latestExperiencesContentMotionClass = `transition-[opacity,transform] duration-200 ease-out ${
    isLatestExperiencesOpen
      ? "translate-x-0 opacity-100 delay-75"
      : "pointer-events-none translate-x-4 opacity-0"
  }`;

  useEffect(() => {
    if (isLatestExperiencesOpen) {
      setIsLatestExperiencesContentVisible(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsLatestExperiencesContentVisible(false);
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [isLatestExperiencesOpen]);

  useEffect(() => {
    setLatestExperiencesOpenOverride(null);
  }, [authLastSignInAt, authUser?.uid]);

  const filteredBlips = useMemo(() => {
    return sortedBlips.filter((blip) => {
      const matchesSearch =
        blip.name.toLowerCase().includes(search.toLowerCase()) ||
        blip.shortDesc.toLowerCase().includes(search.toLowerCase());
      const matchesQuadrant =
        activeQuadrant === undefined || blip.quadrantId === activeQuadrant;

      return matchesSearch && matchesQuadrant;
    });
  }, [activeQuadrant, search, sortedBlips]);

  const focusBlips = useMemo(() => {
    if (activeQuadrant === undefined) {
      return [];
    }

    return filteredBlips.filter((blip) => blip.quadrantId === activeQuadrant);
  }, [activeQuadrant, filteredBlips]);

  const quadrantLegendBlips = useMemo(
    () =>
      config.quadrants.map((_, quadrantId) =>
        sortedBlips.filter((blip) => blip.quadrantId === quadrantId)
      ),
    [config.quadrants, sortedBlips]
  );

  function formatDate(timestamp: number): string {
    if (!mounted) {
      return "";
    }

    return new Date(timestamp).toLocaleDateString();
  }

  function isBlipNew(blip: Blip): boolean {
    if (!mounted) {
      return false;
    }

    return blip.createdAt > Date.now() - 1_209_600_000;
  }

  if (isLoading || isBlipsLoading || isExperiencesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar
          radarSearchPlaceholder={homeContent.searchPlaceholder}
          radarSearchValue={search}
          onRadarSearchChange={setSearch}
        />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!hasCompanyAccess || !authUser) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar
          radarSearchPlaceholder={homeContent.searchPlaceholder}
          radarSearchValue={search}
          onRadarSearchChange={setSearch}
        />
        <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <div className="space-y-3">
            <h1 className="text-5xl font-black tracking-tighter">
              {common.auth.companySignInRequired}
            </h1>
            <p className="max-w-xl text-lg font-medium text-muted-foreground">
              {homeContent.authError.description}
            </p>
          </div>
          <Button asChild className="rounded-full px-8">
            <Link href="/login">{common.auth.goToSignIn}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        radarSearchPlaceholder={homeContent.searchPlaceholder}
        radarSearchValue={search}
        onRadarSearchChange={setSearch}
      />

      <main className="relative mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-12 px-6 py-12 lg:grid-cols-12">
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 right-0 hidden bg-secondary/55 transition-all duration-200 lg:block ${
            isLatestExperiencesOpen
              ? "w-[calc(25%-0.75rem)] opacity-100"
              : "w-20 opacity-100"
          }`}
        />
        <div
          className={`relative z-10 space-y-8 transition-all duration-200 ${
            isLatestExperiencesOpen ? "lg:col-span-9" : "lg:col-span-11"
          }`}
        >
          <div className="flex flex-col gap-6 md:justify-between">
            <PageTitle
              label={homeContent.sectionLabel}
              title={homeContent.heading}
              highlight={homeContent.headingHighlight}
              description={homeContent.description}
              className="w-full space-y-3"
              titleClassName="text-2xl"
              descriptionClassName="max-w-lg text-sm"
            />
          </div>

          {!config.quadrants.length || !config.rings.length ? (
            <Card className="rounded-[3rem] border-none bg-secondary/20 shadow-none">
              <CardContent className="space-y-4 p-12 text-center">
                <h2 className="text-3xl font-black tracking-tight">
                  {homeContent.radarNotInitialized.heading}
                </h2>
                <p className="font-medium text-muted-foreground">
                  {homeContent.radarNotInitialized.description}
                </p>
                <Button asChild className="rounded-full px-8">
                  <Link href="/dashboard">{common.common.openDashboard}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 md:flex-nowrap">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={activeQuadrant === undefined ? "default" : "outline"}
                    className="cursor-pointer rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.12em]"
                    onClick={() => setActiveQuadrant(undefined)}
                  >
                    {homeContent.entireNetwork}
                  </Badge>
                  {config.quadrants.map((quadrant, index) => (
                    <Badge
                      key={quadrant}
                      variant={activeQuadrant === index ? "default" : "outline"}
                      className="cursor-pointer rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.12em]"
                      onClick={() => setActiveQuadrant(index)}
                    >
                      {quadrant}
                    </Badge>
                  ))}
                </div>

                <div className="ml-auto">
                  <RadarBlipLegend />
                </div>
              </div>

              <div className="rounded-[3rem] border-2 border-secondary/20 bg-white p-4 shadow-2xl shadow-primary/5 lg:p-6 xl:p-8">
                <div className="grid gap-6 lg:grid-cols-[minmax(180px,0.9fr)_minmax(0,2.5fr)_minmax(180px,0.9fr)] lg:grid-rows-[auto_auto] lg:items-start xl:gap-8 xl:grid-cols-[minmax(220px,1fr)_minmax(0,2.4fr)_minmax(220px,1fr)]">
                  <div className="hidden lg:block">
                    <RadarQuadrantLegend
                      title={config.quadrants[2] ?? ""}
                      blips={quadrantLegendBlips[2] ?? []}
                      config={config}
                    />
                  </div>

                  <div className="lg:row-span-2">
                    <RadarChart
                      blips={filteredBlips}
                      config={config}
                      activeFilters={{ quadrant: activeQuadrant }}
                    />
                  </div>

                  <div className="hidden lg:block">
                    <RadarQuadrantLegend
                      title={config.quadrants[3] ?? ""}
                      blips={quadrantLegendBlips[3] ?? []}
                      config={config}
                      align="right"
                    />
                  </div>

                  <div className="hidden self-end lg:block">
                    <RadarQuadrantLegend
                      title={config.quadrants[1] ?? ""}
                      blips={quadrantLegendBlips[1] ?? []}
                      config={config}
                    />
                  </div>

                  <div className="hidden self-end lg:block">
                    <RadarQuadrantLegend
                      title={config.quadrants[0] ?? ""}
                      blips={quadrantLegendBlips[0] ?? []}
                      config={config}
                      align="right"
                    />
                  </div>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2 lg:hidden">
                  {[2, 3, 1, 0].map((quadrantId) => (
                    <RadarQuadrantLegend
                      key={config.quadrants[quadrantId] ?? quadrantId}
                      title={config.quadrants[quadrantId] ?? ""}
                      blips={quadrantLegendBlips[quadrantId] ?? []}
                      config={config}
                    />
                  ))}
                </div>
              </div>

              {activeQuadrant !== undefined ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b pb-6">
                    <h3 className="text-4xl font-black uppercase tracking-tighter">
                      {homeContent.focus}{" "}
                      <span className="text-primary">
                        {config.quadrants[activeQuadrant]}
                      </span>
                    </h3>
                    <Badge
                      variant="secondary"
                      className="rounded-full px-4 py-1.5 font-bold"
                    >
                      {focusBlips.length} {common.common.blips}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {focusBlips.map((blip) => (
                      <Link
                        key={blip.id}
                        href={`/blips/${blip.id}`}
                        className="group flex items-center justify-between rounded-[2.5rem] border-2 border-transparent bg-secondary/30 p-8 transition-all hover:border-primary/20 hover:bg-white"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-black tracking-tight transition-colors group-hover:text-primary">
                              {blip.name}
                            </span>
                            {isBlipNew(blip) ? (
                              <Sparkles className="h-4 w-4 text-primary" />
                            ) : null}
                          </div>
                          <div className="line-clamp-1 text-sm font-medium text-muted-foreground">
                            {blip.shortDesc}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className="rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest">
                            {config.rings[blip.ringId]}
                          </Badge>
                          <ChevronRight className="h-6 w-6 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div
          className={`relative z-10 space-y-8 transition-all duration-200 lg:flex lg:min-h-full lg:flex-col lg:items-end ${
            isLatestExperiencesOpen ? "lg:col-span-3" : "lg:col-span-1"
          }`}
        >
          <div className={`overflow-hidden text-right ${latestExperiencesWidthClass}`}>
            {isLatestExperiencesContentVisible ? (
              <div className={latestExperiencesContentMotionClass}>
                <button
                  type="button"
                  className="inline-flex text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
                  onClick={() => setLatestExperiencesOpenOverride(false)}
                >
                  {homeContent.latestExperiences.close}
                </button>
              </div>
            ) : null}
          </div>

          <Card
            className={`overflow-hidden border border-border/50 bg-background/80 shadow-none backdrop-blur-sm transition-[width,height,border-radius] duration-200 ${
              isLatestExperiencesOpen
                ? `${latestExperiencesWidthClass} rounded-[1.75rem]`
                : `${latestExperiencesWidthClass} rounded-[1.75rem] lg:size-20 lg:rounded-full`
            }`}
          >
            <Collapsible
              open={isLatestExperiencesOpen}
              onOpenChange={setLatestExperiencesOpenOverride}
            >
              <CardHeader
                className={`${
                  isLatestExperiencesOpen
                    ? "p-6"
                    : "flex h-full items-center justify-center p-0"
                }`}
              >
                {isLatestExperiencesOpen ? (
                  <div className="flex items-start gap-4">
                    <CardTitle className="flex items-center gap-3 text-base font-black uppercase tracking-tighter">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                        <Sparkles className="h-6 w-6" />
                      </span>
                      <span>{homeContent.latestExperiences.title}</span>
                    </CardTitle>
                  </div>
                ) : (
                  <CollapsibleTrigger
                    title={homeContent.latestExperiences.title}
                    aria-label={homeContent.latestExperiences.title}
                    className="flex h-full w-full cursor-pointer items-center justify-center rounded-full"
                  >
                    <CardTitle className="flex items-center justify-center">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                        <Sparkles className="h-6 w-6" />
                      </span>
                      <span className="sr-only">
                        {homeContent.latestExperiences.title}
                      </span>
                    </CardTitle>
                  </CollapsibleTrigger>
                )}
              </CardHeader>
              {isLatestExperiencesContentVisible ? (
                <div
                  className={`overflow-hidden ${latestExperiencesContentMotionClass}`}
                >
                  <CardContent className="w-full p-0 lg:w-[24rem]">
                    <div className="divide-y divide-border/50">
                      {recentExperiences.length ? (
                        recentExperiences.map((experience) => (
                          <Link
                            key={experience.id}
                            href={`/experiences/${experience.id}`}
                            className="group block p-8 transition-all hover:bg-white/50"
                          >
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                  {experience.outcomeRating ? (
                                    <OutcomeStars
                                      outcomeRating={experience.outcomeRating}
                                    />
                                  ) : (
                                    <span />
                                  )}
                                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                                </div>
                                <span className="text-xl font-bold tracking-tight transition-colors group-hover:text-primary">
                                  {experience.title}
                                </span>
                                <p className="line-clamp-2 text-sm font-medium text-muted-foreground">
                                  {experience.summary}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <UserIcon className="h-3 w-3" />
                                  {experience.creatorName ||
                                    common.auth.memberFallback}
                                </span>
                                <div className="h-1 w-1 rounded-full bg-border" />
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(experience.createdAt)}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="p-12 text-center text-sm font-medium italic text-muted-foreground">
                          {homeContent.latestExperiences.emptyState}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>
              ) : null}
            </Collapsible>
          </Card>

          <div className={`overflow-hidden text-right ${latestExperiencesWidthClass}`}>
            {isLatestExperiencesContentVisible ? (
              <div className={`space-y-3 lg:w-[24rem] ${latestExperiencesContentMotionClass}`}>
                <Link
                  href="/experiences"
                  className="inline-flex h-12 items-center gap-2 text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                >
                  {common.navigation.experiences}
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Button
                  asChild
                  className="h-14 w-full gap-2 rounded-full text-base font-bold shadow-xl transition-all hover:shadow-primary/20"
                >
                  <Link href="/experiences/new">
                    <Plus className="h-5 w-5" />
                    {homeContent.latestExperiences.button}
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
