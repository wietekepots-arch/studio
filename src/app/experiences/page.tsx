"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, orderBy, query, where } from "firebase/firestore";
import {
  ChevronRight,
  Clock,
  Lock,
  Plus,
  Search,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { OutcomeStars } from "@/components/experiences";
import { Navbar } from "@/components/layout/Navbar";
import { PageTitle } from "@/components/layout/PageTitle";
import { useAppUser } from "@/components/app/AppUserProvider";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Blip, Experience } from "@/app/lib/radar-types";
import experiencesContent from "@/content/pages/experiences.json";

export default function ExperiencesPage(): React.ReactElement {
  const [search, setSearch] = useState("");
  const [activeTeam, setActiveTeam] = useState<string | undefined>();
  const [mounted, setMounted] = useState(false);
  const db = useFirestore();
  const { authUser, hasCompanyAccess, isLoading: isUserLoading } = useAppUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  const experiencesQuery = useMemoFirebase(() => {
    if (!db || !authUser || !hasCompanyAccess) {
      return null;
    }

    return query(
      collection(db, "experiences"),
      where("status", "==", "Published"),
      orderBy("createdAt", "desc"),
    );
  }, [authUser, db, hasCompanyAccess]);
  const blipsQuery = useMemoFirebase(() => {
    if (!db || !authUser || !hasCompanyAccess) {
      return null;
    }

    return collection(db, "radarItems");
  }, [authUser, db, hasCompanyAccess]);

  const { data: experiences, isLoading } = useCollection<Experience>(experiencesQuery);
  const { data: blips } = useCollection<Blip>(blipsQuery);

  const blipsById = useMemo(() => {
    return new Map((blips ?? []).map((blip) => [blip.id, blip]));
  }, [blips]);

  const filteredExperiences = useMemo(() => {
    if (!experiences) {
      return [];
    }

    return experiences.filter((experience) => {
      const matchesSearch =
        experience.title.toLowerCase().includes(search.toLowerCase()) ||
        experience.summary.toLowerCase().includes(search.toLowerCase());
      const matchesTeam = !activeTeam || experience.team === activeTeam;

      return matchesSearch && matchesTeam;
    });
  }, [activeTeam, experiences, search]);

  const teams = useMemo(() => {
    if (!experiences) {
      return [];
    }

    return Array.from(new Set(experiences.map((experience) => experience.team)));
  }, [experiences]);

  function formatDate(timestamp: number): string {
    if (!mounted) {
      return "";
    }

    return new Date(timestamp).toLocaleDateString();
  }

  function getExperienceBlipNames(experience: Experience): string[] {
    const ids = Array.from(
      new Set([
        ...experience.toolLinks,
        ...(experience.toolContexts ?? []).map(
          (context) => context.blipId || context.itemId || "",
        ),
      ]),
    ).filter(Boolean);

    return ids.map((id) => blipsById.get(id)?.name || experiencesContent.card.toolPulled);
  }

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!hasCompanyAccess) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center space-y-8 px-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-10 w-10" />
          </div>
          <div className="max-w-md space-y-4">
            <h1 className="text-5xl font-black tracking-tighter">
              {experiencesContent.locked.heading}
            </h1>
            <p className="text-xl font-medium text-muted-foreground">
              {experiencesContent.locked.description}
            </p>
          </div>
          <Button
            asChild
            className="h-14 rounded-full px-10 text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20"
          >
            <Link href="/login">{experiencesContent.locked.button}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto max-w-7xl px-6 py-12">
        <div className="mb-16 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <PageTitle
            title={experiencesContent.heading}
            highlight={experiencesContent.headingHighlight}
            suffix={experiencesContent.headingEnd}
            description={experiencesContent.description}
            breakAfterHighlight
            className="space-y-4"
            titleClassName="text-7xl"
            descriptionClassName="max-w-2xl text-2xl"
          />
          <Button
            asChild
            className="h-16 gap-3 rounded-full px-10 text-lg font-bold shadow-xl transition-all hover:shadow-primary/20"
          >
            <Link href="/experiences/new">
              <Plus className="h-6 w-6" />
              {experiencesContent.logExperience}
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-3">
            <div className="space-y-4">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                {experiencesContent.search.label}
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={experiencesContent.search.placeholder}
                  className="h-14 rounded-2xl border-2 border-border bg-secondary/20 pl-12 focus:border-primary"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                {experiencesContent.filter.label}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant={!activeTeam ? "secondary" : "ghost"}
                  className="h-12 justify-start rounded-xl px-4 font-bold"
                  onClick={() => setActiveTeam(undefined)}
                >
                  {experiencesContent.filter.allStudios}
                </Button>
                {teams.map((team) => (
                  <Button
                    key={team}
                    variant={activeTeam === team ? "secondary" : "ghost"}
                    className="h-12 justify-start rounded-xl px-4 font-bold"
                    onClick={() => setActiveTeam(team)}
                  >
                    {team}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-9">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {[1, 2, 3, 4].map((index) => (
                  <div
                    key={index}
                    className="h-64 animate-pulse rounded-[2.5rem] bg-secondary/20"
                  />
                ))}
              </div>
            ) : filteredExperiences.length > 0 ? (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {filteredExperiences.map((experience) => {
                  const blipNames = getExperienceBlipNames(experience);

                  return (
                    <Link key={experience.id} href={`/experiences/${experience.id}`}>
                      <Card className="group flex h-full flex-col overflow-hidden rounded-[3rem] border-none bg-white shadow-xl shadow-primary/5 transition-all hover:shadow-primary/10">
                        <CardHeader className="p-8 pb-4">
                          <div className="mb-4 flex items-start justify-between">
                            <Badge
                              variant="outline"
                              className="rounded-full border-none bg-primary/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary"
                            >
                              {experience.team}
                            </Badge>
                            {experience.outcomeRating
                              ? <OutcomeStars outcomeRating={experience.outcomeRating} />
                              : null}
                          </div>
                          <CardTitle className="text-3xl font-black leading-tight tracking-tighter transition-colors group-hover:text-primary">
                            {experience.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col justify-between space-y-6 p-8 pt-0">
                          <p className="line-clamp-3 font-medium text-muted-foreground">
                            {experience.summary}
                          </p>
                          <div className="space-y-4 border-t border-secondary pt-6">
                            <div className="flex flex-wrap gap-2">
                              {blipNames.slice(0, 2).map((blipName, index) => (
                                <Badge
                                  key={`${experience.id}-tool-${index}`}
                                  variant="secondary"
                                  className="rounded-full bg-secondary/40 px-3 py-1 text-[10px] font-bold uppercase"
                                >
                                  {blipName}
                                </Badge>
                              ))}
                              {blipNames.length > 2 ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-bold opacity-50"
                                >
                                  {experiencesContent.card.more.replace(
                                    "{count}",
                                    String(blipNames.length - 2),
                                  )}
                                </Badge>
                              ) : null}
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                              <span className="flex items-center gap-2">
                                <UserIcon className="h-3.5 w-3.5" />
                                {experience.creatorName || "Member"}
                              </span>
                              <span className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5" />
                                {formatDate(experience.createdAt)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-6 py-32 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20 text-muted-foreground">
                  <Sparkles className="h-10 w-10" />
                </div>
                <h3 className="text-3xl font-black tracking-tight">
                  {experiencesContent.emptyState.heading}
                </h3>
                <p className="mx-auto max-w-sm text-muted-foreground">
                  {experiencesContent.emptyState.description}
                </p>
                <Button asChild variant="outline" className="rounded-full border-2 px-8">
                  <Link href="/experiences/new">{experiencesContent.emptyState.button}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
