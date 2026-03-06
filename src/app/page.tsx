"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, query, where } from "firebase/firestore";
import {
  ArrowRight,
  ChevronRight,
  Clock,
  History,
  Search,
  ShieldCheck,
  Sparkles,
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
import { Input } from "@/components/ui/input";
import { RadarConfigOption, RadarItem } from "@/app/lib/radar-types";
import {
  buildRadarConfig,
  sortConfigOptions,
  sortRadarItems,
} from "@/lib/radar-firestore";

export default function HomePage(): React.ReactElement {
  const db = useFirestore();
  const { authUser, hasCompanyAccess, isLoading } = useAppUser();
  const [search, setSearch] = useState("");
  const [activeQuadrant, setActiveQuadrant] = useState<number | undefined>();
  const [mounted, setMounted] = useState(false);

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
  const approvedItemsQuery = useMemoFirebase(() => {
    if (!authUser || !hasCompanyAccess) {
      return null;
    }

    return query(collection(db, "radarItems"), where("status", "==", "Approved"));
  }, [authUser, db, hasCompanyAccess]);

  const { data: quadrantDocs } = useCollection<RadarConfigOption>(quadrantsQuery);
  const { data: ringDocs } = useCollection<RadarConfigOption>(ringsQuery);
  const { data: approvedItems, isLoading: isItemsLoading } =
    useCollection<RadarItem>(approvedItemsQuery);

  const quadrants = sortConfigOptions(quadrantDocs);
  const rings = sortConfigOptions(ringDocs);
  const config = buildRadarConfig(quadrants, rings);
  const sortedItems = sortRadarItems(approvedItems);
  const recentItems = sortedItems.slice(0, 5);

  const filteredItems = useMemo(() => {
    return sortedItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.shortDesc.toLowerCase().includes(search.toLowerCase());
      const matchesQuadrant =
        activeQuadrant === undefined || item.quadrantId === activeQuadrant;

      return matchesSearch && matchesQuadrant;
    });
  }, [activeQuadrant, search, sortedItems]);

  const focusItems = useMemo(() => {
    if (activeQuadrant === undefined) {
      return [];
    }

    return filteredItems.filter((item) => item.quadrantId === activeQuadrant);
  }, [activeQuadrant, filteredItems]);

  function formatDate(timestamp: number): string {
    if (!mounted) {
      return "";
    }

    return new Date(timestamp).toLocaleDateString();
  }

  function isItemNew(item: RadarItem): boolean {
    if (!mounted) {
      return false;
    }

    return item.createdAt > Date.now() - 1_209_600_000;
  }

  if (isLoading || isItemsLoading) {
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
      <Navbar />

      <main className="container mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-12 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                {homeContent.sectionLabel}
              </div>
              <h1 className="text-6xl font-black uppercase leading-none tracking-tighter">
                {homeContent.heading} <br />
                <span className="text-primary">{homeContent.headingHighlight}</span>
              </h1>
              <p className="max-w-lg text-xl font-medium text-muted-foreground">
                {homeContent.description}
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={homeContent.searchPlaceholder}
                className="h-14 rounded-full border-2 border-border bg-secondary/30 pl-12 text-lg"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
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
                  className="cursor-pointer rounded-full px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.15em]"
                  onClick={() => setActiveQuadrant(undefined)}
                >
                  {homeContent.entireNetwork}
                </Badge>
                {config.quadrants.map((quadrant, index) => (
                  <Badge
                    key={quadrant}
                    variant={activeQuadrant === index ? "default" : "outline"}
                    className="cursor-pointer rounded-full px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.15em]"
                    onClick={() => setActiveQuadrant(index)}
                  >
                    {quadrant}
                  </Badge>
                ))}
              </div>

              <div className="rounded-[3rem] border-2 border-secondary/20 bg-white p-12 shadow-2xl shadow-primary/5">
                <RadarChart
                  items={filteredItems}
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
                      {focusItems.length} {common.common.blips}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {focusItems.map((item) => (
                      <Link
                        key={item.id}
                        href={`/items/${item.id}`}
                        className="group flex items-center justify-between rounded-[2.5rem] border-2 border-transparent bg-secondary/30 p-8 transition-all hover:border-primary/20 hover:bg-white"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-black tracking-tight transition-colors group-hover:text-primary">
                              {item.name}
                            </span>
                            {isItemNew(item) ? (
                              <Sparkles className="h-4 w-4 text-primary" />
                            ) : null}
                          </div>
                          <div className="line-clamp-1 text-sm font-medium text-muted-foreground">
                            {item.shortDesc}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className="rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest">
                            {config.rings[item.ringId]}
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

        <div className="space-y-8 lg:col-span-4">
          <Card className="overflow-hidden rounded-[2.5rem] border-none bg-secondary/30 shadow-none">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter">
                <History className="h-6 w-6 text-primary" />
                {homeContent.latestPulses.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {recentItems.length ? (
                  recentItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/items/${item.id}`}
                      className="group flex items-center justify-between p-8 transition-all hover:bg-white/50"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold tracking-tight transition-colors group-hover:text-primary">
                            {item.name}
                          </span>
                          {isItemNew(item) ? (
                            <Badge className="h-4 border-none bg-primary/20 text-[9px] font-black text-primary">
                              {common.common.new}
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(item.updatedAt)}
                          <div className="h-1 w-1 rounded-full bg-border" />
                          {config.rings[item.ringId]}
                        </div>
                      </div>
                      <ChevronRight className="h-6 w-6 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                    </Link>
                  ))
                ) : (
                  <div className="p-12 text-center text-sm font-medium italic text-muted-foreground">
                    {homeContent.latestPulses.emptyState}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none bg-primary p-4 text-primary-foreground shadow-2xl shadow-primary/20">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                <ShieldCheck className="h-4 w-4" />
                {homeContent.governance.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8 pt-0">
              <p className="text-xl font-medium leading-snug">
                {homeContent.governance.description}
              </p>
              <Button
                asChild
                variant="secondary"
                className="h-16 w-full gap-2 rounded-full text-lg font-bold"
              >
                <Link href="/dashboard">
                  {common.common.openDashboard}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
