"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collection, doc, documentId, query, where } from "firebase/firestore";
import {
  ArrowLeft,
  Award,
  ChevronRight,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  User as UserIcon,
  Zap,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useAppUser } from "@/components/app/AppUserProvider";
import { useCollection, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Experience, RadarFamily, RadarItem } from "@/app/lib/radar-types";
import { mergeRadarFamilies } from "@/lib/radar-firestore";
import { seedFamilies } from "@/lib/radar-seed";

interface ExperienceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ExperienceDetailPage({
  params,
}: ExperienceDetailPageProps): React.ReactElement {
  const { id } = React.use(params);
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const {
    authUser,
    hasCompanyAccess,
    isLoading: isAuthLoading,
  } = useAppUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  const experienceRef = useMemoFirebase(() => {
    if (!db || !authUser || !hasCompanyAccess) {
      return null;
    }

    return doc(db, "experiences", id);
  }, [authUser, db, hasCompanyAccess, id]);
  const { data: experience, isLoading: isExperienceLoading } =
    useDoc<Experience>(experienceRef);
  const familiesQuery = useMemoFirebase(() => {
    if (!db || !authUser || !hasCompanyAccess) {
      return null;
    }

    return collection(db, "radarFamilies");
  }, [authUser, db, hasCompanyAccess]);
  const { data: familyDocs } = useCollection<RadarFamily>(familiesQuery);
  const families = React.useMemo(() => {
    return mergeRadarFamilies(familyDocs, seedFamilies);
  }, [familyDocs]);
  const familyMap = React.useMemo(() => {
    return new Map(families.map((family) => [family.id, family]));
  }, [families]);
  const effectiveToolIds = React.useMemo(() => {
    const ids =
      experience?.toolContexts?.map((context) => context.itemId) ||
      experience?.toolLinks ||
      [];

    return Array.from(new Set(ids));
  }, [experience?.toolContexts, experience?.toolLinks]);
  const toolContextMap = React.useMemo(() => {
    const entries =
      experience?.toolContexts?.map((context) => [context.itemId, context] as const) ||
      [];

    return new Map(entries);
  }, [experience?.toolContexts]);

  const linkedToolsQuery = useMemoFirebase(() => {
    if (
      !db ||
      !authUser ||
      !hasCompanyAccess ||
      !effectiveToolIds.length
    ) {
      return null;
    }

    return query(
      collection(db, "radarItems"),
      where(documentId(), "in", effectiveToolIds),
    );
  }, [authUser, db, effectiveToolIds, hasCompanyAccess]);
  const { data: linkedTools, isLoading: isLinkedToolsLoading } =
    useCollection<RadarItem>(linkedToolsQuery);

  function formatDate(timestamp: number): string {
    if (!mounted) {
      return "";
    }

    return new Date(timestamp).toLocaleDateString();
  }

  if (isAuthLoading || isExperienceLoading) {
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
              Locked Experience
            </h1>
            <p className="text-xl font-medium text-muted-foreground">
              Strategic workflow details are reserved for authenticated
              Greenberry members.
            </p>
          </div>
          <Button
            asChild
            className="h-14 rounded-full px-10 text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20"
          >
            <Link href="/login">Sign In to View</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 py-32 text-center">
          <h1 className="mb-6 text-4xl font-black">Experience Not Found</h1>
          <Button asChild className="rounded-full px-8">
            <Link href="/experiences">Back to Feed</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto max-w-7xl px-6 py-12 lg:px-12">
        <div className="mb-16 flex items-center justify-between">
          <Button
            variant="ghost"
            asChild
            className="-ml-4 gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
          >
            <Link href="/experiences">
              <ArrowLeft className="h-5 w-5" />
              Return to Feed
            </Link>
          </Button>

          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className="gap-2 rounded-full border-2 border-primary px-6 py-2 font-black uppercase text-primary"
            >
              <ShieldCheck className="h-4 w-4" />
              {experience.dataSensitivity || "Internal"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-20 lg:grid-cols-12">
          <div className="space-y-16 lg:col-span-8">
            <div className="space-y-10">
              <div className="flex flex-wrap items-center gap-4">
                <Badge className="rounded-full border-none bg-primary/10 px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  {experience.team}
                </Badge>
                {experience.outcomeRating ? (
                  <Badge
                    variant="secondary"
                    className="gap-2 rounded-full border-none bg-yellow-50 px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-yellow-600"
                  >
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {experience.outcomeRating}/5 Outcome
                  </Badge>
                ) : null}
              </div>
              <h1 className="text-8xl font-black leading-[0.85] tracking-tighter text-foreground">
                {experience.title}
              </h1>
              <p className="max-w-4xl text-4xl font-medium leading-[1.1] text-muted-foreground/90">
                {experience.summary}
              </p>

              <div className="flex flex-wrap gap-3 pt-4">
                {experience.tags?.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="rounded-full border-2 bg-secondary/10 px-6 py-2.5 text-base font-bold"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-12">
              <section className="space-y-8">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  <Zap className="h-6 w-6" />
                  The Workflow
                </div>
                <div className="prose prose-2xl max-w-none whitespace-pre-wrap font-medium leading-relaxed text-foreground/90">
                  {experience.howUsed}
                </div>
              </section>

              {experience.promptsOrTemplates ? (
                <section className="space-y-8">
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                    <MessageSquare className="h-6 w-6" />
                    Prompts & Templates
                  </div>
                  <div className="rounded-[2.5rem] border-2 border-primary/10 bg-secondary/30 p-8 font-mono text-lg whitespace-pre-wrap">
                    {experience.promptsOrTemplates}
                  </div>
                </section>
              ) : null}

              <section className="space-y-8">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  <Sparkles className="h-6 w-6" />
                  Key Findings & Outcomes
                </div>
                <div className="rounded-[3.5rem] bg-primary/5 p-12 shadow-inner">
                  <div className="prose prose-2xl max-w-none whitespace-pre-wrap font-medium leading-relaxed text-foreground/90">
                    {experience.findings}
                  </div>
                </div>
              </section>

              {experience.recommendations ? (
                <section className="space-y-8">
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                    <Award className="h-6 w-6" />
                    Strategic Recommendations
                  </div>
                  <div className="prose prose-xl max-w-none whitespace-pre-wrap font-medium italic leading-relaxed text-muted-foreground">
                    {experience.recommendations}
                  </div>
                </section>
              ) : null}
            </div>
          </div>

          <div className="space-y-12 lg:col-span-4">
            <Card className="overflow-hidden rounded-[3.5rem] border-none bg-white shadow-2xl shadow-primary/10">
              <CardHeader className="bg-primary p-12 text-primary-foreground">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">
                  Experience Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-12 p-12">
                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Contributor
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                      <UserIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-xl font-black tracking-tight">
                        {experience.creatorName}
                      </div>
                      <div className="text-sm font-bold uppercase text-muted-foreground">
                        {experience.roleTitle}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Studio
                    </div>
                    <div className="text-lg font-black tracking-tight">
                      {experience.team}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Date Logged
                    </div>
                    <div className="text-lg font-black tracking-tight">
                      {formatDate(experience.createdAt)}
                    </div>
                  </div>
                </div>

                {experience.timeSavedHours ? (
                  <div className="flex items-center justify-between rounded-[2.5rem] border-2 border-yellow-100 bg-yellow-50 p-8">
                    <div className="text-[10px] font-black uppercase tracking-widest text-yellow-700">
                      Efficiency Gain
                    </div>
                    <div className="text-3xl font-black text-yellow-700">
                      +{experience.timeSavedHours}h
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <div className="space-y-8 px-8">
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                <Tag className="h-5 w-5" />
                Linked Tools
              </div>
              <div className="space-y-4">
                {isLinkedToolsLoading ? (
                  <div className="space-y-4 animate-pulse">
                    {[1, 2].map((index) => (
                      <div
                        key={index}
                        className="h-24 rounded-3xl bg-secondary/20"
                      />
                    ))}
                  </div>
                ) : (
                  linkedTools?.map((tool) => (
                    <Link key={tool.id} href={`/items/${tool.id}`}>
                      <Card className="group rounded-[2.5rem] border-2 border-transparent p-6 transition-all hover:border-primary/20 hover:bg-secondary/10">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="text-xl font-black tracking-tight transition-colors group-hover:text-primary">
                              {tool.name}
                            </div>
                            <div className="text-xs font-bold uppercase text-muted-foreground">
                              {tool.team}
                            </div>
                            {toolContextMap.get(tool.id) ? (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {toolContextMap.get(tool.id)?.familyId ? (
                                  <Badge variant="outline" className="rounded-full">
                                    {familyMap.get(toolContextMap.get(tool.id)!.familyId || "")
                                      ?.name || toolContextMap.get(tool.id)!.familyId}
                                  </Badge>
                                ) : null}
                                {toolContextMap.get(tool.id)?.modelName ? (
                                  <Badge variant="outline" className="rounded-full">
                                    {toolContextMap.get(tool.id)?.modelName}
                                  </Badge>
                                ) : null}
                                {toolContextMap.get(tool.id)?.modelVersion ? (
                                  <Badge variant="outline" className="rounded-full">
                                    v{toolContextMap.get(tool.id)?.modelVersion}
                                  </Badge>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                          <ChevronRight className="h-6 w-6 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                      </Card>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
