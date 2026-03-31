"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, orderBy, query, where } from "firebase/firestore";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import common from "@/content/common.json";
import homeContent from "@/content/pages/home.json";
import { Navbar } from "@/components/layout/Navbar";
import { useAppUser } from "@/components/app/AppUserProvider";
import { RadarChart } from "@/components/radar/RadarChart";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Blip, Experience, RadarConfigOption } from "@/app/lib/radar-types";
import {
  buildRadarConfig,
  sortConfigOptions,
  sortBlips,
} from "@/lib/radar-firestore";

export default function HomePage(): React.ReactElement {
  const db = useFirestore();
  const { authUser, hasCompanyAccess, isLoading } = useAppUser();
  const [search, setSearch] = useState("");
  const [activeQuadrant, setActiveQuadrant] = useState<number | undefined>();
  const [mounted, setMounted] = useState(false);
  const [isLatestExperiencesOpen, setIsLatestExperiencesOpen] = useState(true);

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

      <main className="container mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-12 lg:grid-cols-12">
        <div
          className={`space-y-8 transition-all duration-300 ${
            isLatestExperiencesOpen ? "lg:col-span-8" : "lg:col-span-11"
          }`}
        >
          <div className="flex flex-col gap-6 md:justify-between">
            <div className="space-y-3 w-full">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                {homeContent.sectionLabel}
              </div>
              <h1 className="text-3xl font-black uppercase leading-none tracking-tighter">
                {homeContent.heading}{" "}
                <span className="text-primary">
                  {homeContent.headingHighlight}
                </span>
              </h1>
              <p className="max-w-lg text-m font-medium text-muted-foreground">
                {homeContent.description}
              </p>
            </div>
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

              <div className="rounded-[3rem] border-2 border-secondary/20 bg-white p-8 shadow-2xl shadow-primary/5 md:p-10">
                <RadarChart
                  blips={filteredBlips}
                  config={config}
                  activeFilters={{ quadrant: activeQuadrant }}
                />
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
          className={`space-y-8 lg:flex lg:flex-col lg:items-end transition-all duration-300 ${
            isLatestExperiencesOpen ? "lg:col-span-4" : "lg:col-span-1"
          }`}
        >
          <Card
            className={`overflow-hidden rounded-[2.5rem] border-none bg-secondary/30 shadow-none transition-[width] duration-300 ${
              isLatestExperiencesOpen ? "w-full lg:w-[24rem]" : "w-full lg:w-24"
            }`}
          >
            <Collapsible
              open={isLatestExperiencesOpen}
              onOpenChange={setIsLatestExperiencesOpen}
            >
              <CardHeader
                className={`p-8 ${isLatestExperiencesOpen ? "" : "items-center"}`}
              >
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CollapsibleTrigger
                        title="Toggle experiences"
                        className={`flex w-full items-center gap-4 text-left ${
                          isLatestExperiencesOpen
                            ? "justify-between"
                            : "justify-center"
                        }`}
                      >
                        <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tighter">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/70 text-primary">
                            <Sparkles className="h-6 w-6" />
                          </span>
                          {isLatestExperiencesOpen ? (
                            <span>{homeContent.latestExperiences.title}</span>
                          ) : (
                            <span className="sr-only">
                              {homeContent.latestExperiences.title}
                            </span>
                          )}
                        </CardTitle>
                        {isLatestExperiencesOpen ? (
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-muted-foreground transition-colors hover:text-primary">
                            <ChevronLeft className="h-5 w-5" />
                          </span>
                        ) : null}
                      </CollapsibleTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      {isLatestExperiencesOpen
                        ? "Collapse experiences"
                        : "Toggle experiences"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <CardContent className="p-0">
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
                                <Badge
                                  variant="outline"
                                  className="rounded-full border-none bg-primary/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary"
                                >
                                  {experience.team}
                                </Badge>
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
              </CollapsibleContent>
            </Collapsible>
          </Card>

          <div
            className={`space-y-3 transition-all duration-200 ${
              isLatestExperiencesOpen
                ? "w-full lg:w-[24rem] opacity-100"
                : "pointer-events-none w-full lg:w-24 opacity-0"
            }`}
          >
            <Button
              asChild
              variant="outline"
              className="h-12 w-full rounded-full font-bold"
            >
              <Link href="/experiences">{common.navigation.experiences}</Link>
            </Button>
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
        </div>
      </main>
    </div>
  );
}
