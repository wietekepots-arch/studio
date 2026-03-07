"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type DataSensitivity,
  type Experience,
  type ExperienceToolContext,
  type RadarFamily,
  type RadarItem,
} from "@/app/lib/radar-types";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Save,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { addDocumentNonBlocking } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useAppUser } from "@/components/app/AppUserProvider";
import { mergeRadarFamilies } from "@/lib/radar-firestore";
import { seedFamilies } from "@/lib/radar-seed";
import common from "@/content/common.json";
import formContent from "@/content/pages/experience-form.json";

const NONE_SELECT_VALUE = "__none__";

interface ExperienceFormState {
  title: string;
  summary: string;
  toolLinks: string[];
  toolContexts: ExperienceToolContext[];
  howUsed: string;
  promptsOrTemplates: string;
  findings: string;
  recommendations: string;
  roleTitle: string;
  team: string;
  projectContext: string;
  dataSensitivity: DataSensitivity;
  outcomeRating: number;
  timeSavedHours: number;
  tags: string;
}

function trimToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

function buildToolContext(tool?: RadarItem | null): ExperienceToolContext {
  return {
    itemId: tool?.id || "",
    ...(tool?.providerId ? { providerId: tool.providerId } : {}),
    ...(tool?.familyId ? { familyId: tool.familyId } : {}),
  };
}

function isProviderContextTool(tool?: RadarItem | null): boolean {
  return Boolean(
    tool &&
      (tool.entityType === "provider" ||
        tool.providerId ||
        tool.modelEntries?.length),
  );
}

function NewExperiencePageContent(): React.ReactElement {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillToolId = searchParams.get("toolId");
  const db = useFirestore();
  const { authUser, hasCompanyAccess, isLoading, profile } = useAppUser();

  const [loading, setLoading] = useState(false);
  const [toolSearch, setToolSearch] = useState("");

  const toolsQuery = useMemoFirebase(() => {
    if (!db || !authUser || !hasCompanyAccess) {
      return null;
    }

    return query(collection(db, "radarItems"), where("status", "==", "Approved"));
  }, [db, authUser, hasCompanyAccess]);
  const familiesQuery = useMemoFirebase(() => {
    if (!db || !authUser || !hasCompanyAccess) {
      return null;
    }

    return collection(db, "radarFamilies");
  }, [db, authUser, hasCompanyAccess]);

  const { data: allTools } = useCollection<RadarItem>(toolsQuery);
  const { data: familyDocs } = useCollection<RadarFamily>(familiesQuery);

  const families = useMemo(() => {
    return mergeRadarFamilies(familyDocs, seedFamilies);
  }, [familyDocs]);
  const familyMap = useMemo(() => {
    return new Map(families.map((family) => [family.id, family]));
  }, [families]);

  const [formData, setFormData] = useState<ExperienceFormState>({
    title: "",
    summary: "",
    toolLinks: [],
    toolContexts: [],
    howUsed: "",
    promptsOrTemplates: "",
    findings: "",
    recommendations: "",
    roleTitle: "",
    team: "",
    projectContext: "",
    dataSensitivity: "Internal",
    outcomeRating: 3,
    timeSavedHours: 0,
    tags: "",
  });

  useEffect(() => {
    if (!prefillToolId || !allTools?.length) {
      return;
    }

    const prefillTool = allTools.find((tool) => tool.id === prefillToolId);

    if (!prefillTool) {
      return;
    }

    setFormData((currentState) => {
      if (currentState.toolLinks.includes(prefillToolId)) {
        return currentState;
      }

      return {
        ...currentState,
        toolLinks: [...currentState.toolLinks, prefillToolId],
        toolContexts: [...currentState.toolContexts, buildToolContext(prefillTool)],
      };
    });
  }, [allTools, prefillToolId]);

  const selectedTools = useMemo(() => {
    if (!allTools?.length) {
      return [];
    }

    return formData.toolLinks
      .map((toolId) => allTools.find((tool) => tool.id === toolId) || null)
      .filter((tool): tool is RadarItem => Boolean(tool));
  }, [allTools, formData.toolLinks]);
  const filteredTools = useMemo(() => {
    if (!allTools?.length) {
      return [];
    }

    return allTools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(toolSearch.toLowerCase()) &&
        !formData.toolLinks.includes(tool.id),
    );
  }, [allTools, formData.toolLinks, toolSearch]);

  function getToolContext(toolId: string): ExperienceToolContext {
    const existingContext = formData.toolContexts.find(
      (context) => context.itemId === toolId,
    );

    if (existingContext) {
      return existingContext;
    }

    const tool = allTools?.find((candidate) => candidate.id === toolId) || null;
    return buildToolContext(tool);
  }

  function handleAddTool(toolId: string): void {
    const tool = allTools?.find((candidate) => candidate.id === toolId) || null;

    setFormData((currentState) => {
      if (currentState.toolLinks.includes(toolId)) {
        return currentState;
      }

      return {
        ...currentState,
        toolLinks: [...currentState.toolLinks, toolId],
        toolContexts: [...currentState.toolContexts, buildToolContext(tool)],
      };
    });
    setToolSearch("");
  }

  function handleRemoveTool(toolId: string): void {
    setFormData((currentState) => ({
      ...currentState,
      toolLinks: currentState.toolLinks.filter((id) => id !== toolId),
      toolContexts: currentState.toolContexts.filter(
        (context) => context.itemId !== toolId,
      ),
    }));
  }

  function updateToolContext(
    toolId: string,
    patch: Partial<ExperienceToolContext>,
  ): void {
    const tool = allTools?.find((candidate) => candidate.id === toolId) || null;

    setFormData((currentState) => {
      const existingContext = currentState.toolContexts.find(
        (context) => context.itemId === toolId,
      );
      const nextContext = {
        ...(existingContext || buildToolContext(tool)),
        ...patch,
        itemId: toolId,
      };

      return {
        ...currentState,
        toolContexts: existingContext
          ? currentState.toolContexts.map((context) =>
              context.itemId === toolId ? nextContext : context,
            )
          : [...currentState.toolContexts, nextContext],
      };
    });
  }

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();

    if (!authUser || !db || !hasCompanyAccess) {
      return;
    }

    if (formData.toolLinks.length === 0) {
      toast({
        title: formContent.toasts.validationError.title,
        description: formContent.toasts.validationError.description,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const now = Date.now();
    const toolContexts = formData.toolLinks
      .map((toolId) => {
        const context = getToolContext(toolId);
        const tool = allTools?.find((candidate) => candidate.id === toolId) || null;
        const familyId = trimToUndefined(context.familyId);
        const modelName = trimToUndefined(context.modelName);
        const modelVersion = trimToUndefined(context.modelVersion);
        const providerId = context.providerId || tool?.providerId;

        return {
          itemId: toolId,
          ...(providerId ? { providerId } : {}),
          ...(familyId ? { familyId } : {}),
          ...(modelName ? { modelName } : {}),
          ...(modelVersion ? { modelVersion } : {}),
        };
      })
      .filter(
        (context) => context.familyId || context.modelName || context.modelVersion,
      );

    const experienceData: Partial<Experience> = {
      title: formData.title.trim(),
      summary: formData.summary.trim(),
      toolLinks: formData.toolLinks,
      ...(toolContexts.length ? { toolContexts } : {}),
      howUsed: formData.howUsed.trim(),
      ...(trimToUndefined(formData.promptsOrTemplates)
        ? { promptsOrTemplates: formData.promptsOrTemplates.trim() }
        : {}),
      findings: formData.findings.trim(),
      ...(trimToUndefined(formData.recommendations)
        ? { recommendations: formData.recommendations.trim() }
        : {}),
      roleTitle: formData.roleTitle.trim(),
      team: formData.team.trim(),
      ...(trimToUndefined(formData.projectContext)
        ? { projectContext: formData.projectContext.trim() }
        : {}),
      dataSensitivity: formData.dataSensitivity,
      outcomeRating: formData.outcomeRating,
      ...(formData.timeSavedHours ? { timeSavedHours: formData.timeSavedHours } : {}),
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      status: "Published",
      createdAt: now,
      createdBy: authUser.uid,
      creatorName:
        profile?.displayName || authUser.displayName || "Greenberry Member",
      updatedAt: now,
      updatedBy: authUser.uid,
      viewsCount: 0,
      likesCount: 0,
    };

    try {
      addDocumentNonBlocking(collection(db, "experiences"), experienceData);
      toast({
        title: formContent.toasts.experienceLogged.title,
        description: formContent.toasts.experienceLogged.description,
      });
      router.push("/experiences");
    } catch {
      toast({
        title: formContent.toasts.saveFailed.title,
        description: formContent.toasts.saveFailed.description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

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
        <main className="container mx-auto max-w-4xl px-6 py-24 text-center">
          <h1 className="text-4xl font-black">{common.auth.companySignInRequired}</h1>
          <p className="mt-4 text-muted-foreground">
            {formContent.authError.description}
          </p>
          <Button asChild className="mt-8 rounded-full px-8">
            <Link href="/login">{common.auth.goToSignIn}</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <Button
            variant="ghost"
            asChild
            className="gap-2 -ml-2 font-bold text-muted-foreground hover:text-primary"
          >
            <Link href="/experiences">
              <ArrowLeft className="h-5 w-5" />
              {formContent.returnToExperiences}
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="space-y-2">
              <h1 className="text-6xl font-black uppercase leading-none tracking-tighter text-foreground">
                {formContent.heading} <br />
                <span className="text-primary">{formContent.headingHighlight}</span>
              </h1>
              <p className="text-xl font-medium text-muted-foreground">
                {formContent.description}
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="h-14 rounded-full border-2 px-10 text-lg font-bold"
                onClick={() => router.push("/experiences")}
              >
                {formContent.discard}
              </Button>
              <Button
                type="submit"
                className="h-14 gap-2 rounded-full px-12 text-lg font-bold shadow-lg hover:shadow-primary/20"
                disabled={loading}
              >
                <Save className="h-5 w-5" />
                {loading ? formContent.submittingButton : formContent.submitButton}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            <div className="space-y-10 md:col-span-8">
              <Card className="overflow-hidden rounded-[3rem] border-none bg-secondary/20 shadow-none">
                <CardHeader className="p-10 pb-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    {formContent.sections.strategicContext}
                  </div>
                </CardHeader>
                <CardContent className="space-y-8 p-10">
                  <div className="space-y-3">
                    <Label
                      htmlFor="title"
                      className="font-bold text-sm tracking-tight text-foreground/70"
                    >
                      {formContent.fields.experienceTitle.label}
                    </Label>
                    <Input
                      id="title"
                      placeholder={formContent.fields.experienceTitle.placeholder}
                      className="h-16 rounded-2xl border-2 border-border bg-white/50 text-xl focus:border-primary"
                      required
                      value={formData.title}
                      onChange={(event) =>
                        setFormData({ ...formData, title: event.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="summary"
                      className="font-bold text-sm tracking-tight text-foreground/70"
                    >
                      {formContent.fields.conciseSummary.label}
                    </Label>
                    <Input
                      id="summary"
                      placeholder={formContent.fields.conciseSummary.placeholder}
                      className="h-16 rounded-2xl border-2 border-border bg-white/50 text-lg focus:border-primary"
                      required
                      value={formData.summary}
                      onChange={(event) =>
                        setFormData({ ...formData, summary: event.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="font-bold text-sm tracking-tight text-foreground/70">
                      {formContent.fields.linkedTools.label}
                    </Label>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {formData.toolLinks.map((toolId) => {
                        const tool = allTools?.find((candidate) => candidate.id === toolId);
                        return (
                          <Badge
                            key={toolId}
                            variant="secondary"
                            className="gap-2 rounded-full border-none bg-primary px-4 py-2 font-bold text-primary-foreground"
                          >
                            {tool?.name || "Loading..."}
                            <X
                              className="h-4 w-4 cursor-pointer hover:opacity-70"
                              onClick={() => handleRemoveTool(toolId)}
                            />
                          </Badge>
                        );
                      })}
                      {formData.toolLinks.length === 0 ? (
                        <div className="py-2 text-sm italic text-muted-foreground">
                          {formContent.fields.linkedTools.emptyState}
                        </div>
                      ) : null}
                    </div>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={formContent.fields.linkedTools.searchPlaceholder}
                        className="h-14 rounded-2xl border-2 border-border bg-white/50 pl-12 focus:border-primary"
                        value={toolSearch}
                        onChange={(event) => setToolSearch(event.target.value)}
                      />
                      {toolSearch && filteredTools.length > 0 ? (
                        <Card className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border-2 p-2 shadow-xl">
                          {filteredTools.map((tool) => (
                            <Button
                              key={tool.id}
                              type="button"
                              variant="ghost"
                              className="h-12 w-full justify-start gap-3 rounded-xl px-4 font-bold"
                              onClick={() => handleAddTool(tool.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                              {tool.name}
                            </Button>
                          ))}
                        </Card>
                      ) : null}
                    </div>

                    {selectedTools.some((tool) => isProviderContextTool(tool)) ? (
                      <div className="space-y-4 pt-4">
                        <div className="text-sm font-bold tracking-tight text-foreground/70">
                          {formContent.fields.toolContext.label}
                        </div>
                        <div className="rounded-[2rem] border border-primary/10 bg-white/70 p-5 text-sm font-medium text-muted-foreground">
                          {formContent.fields.toolContext.description}
                        </div>
                        {selectedTools.map((tool) => {
                          if (!isProviderContextTool(tool)) {
                            return null;
                          }

                          const context = getToolContext(tool.id);
                          const providerFamilies = families.filter(
                            (family) => family.providerId === tool.providerId,
                          );
                          const modelPlaceholder = tool.modelEntries?.length
                            ? tool.modelEntries
                                .map((entry) => entry.name)
                                .slice(0, 3)
                                .join(", ")
                            : formContent.fields.toolContext.modelNamePlaceholder;

                          return (
                            <Card
                              key={`tool-context-${tool.id}`}
                              className="border-none bg-white shadow-none"
                            >
                              <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-black tracking-tight">
                                  {tool.name}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                                    {formContent.fields.toolContext.family}
                                  </Label>
                                  <Select
                                    value={context.familyId || NONE_SELECT_VALUE}
                                    onValueChange={(value) =>
                                      updateToolContext(tool.id, {
                                        familyId:
                                          value === NONE_SELECT_VALUE ? undefined : value,
                                        providerId: tool.providerId,
                                      })
                                    }
                                  >
                                    <SelectTrigger className="h-12 rounded-xl">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                      <SelectItem value={NONE_SELECT_VALUE}>
                                        {formContent.fields.toolContext.noFamily}
                                      </SelectItem>
                                      {providerFamilies.map((family) => (
                                        <SelectItem key={family.id} value={family.id}>
                                          {family.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                                    {formContent.fields.toolContext.modelVersion}
                                  </Label>
                                  <Input
                                    placeholder={formContent.fields.toolContext.modelVersionPlaceholder}
                                    value={context.modelVersion || ""}
                                    onChange={(event) =>
                                      updateToolContext(tool.id, {
                                        modelVersion: event.target.value,
                                        providerId: tool.providerId,
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                                    {formContent.fields.toolContext.modelName}
                                  </Label>
                                  <Input
                                    placeholder={modelPlaceholder}
                                    value={context.modelName || ""}
                                    onChange={(event) =>
                                      updateToolContext(tool.id, {
                                        modelName: event.target.value,
                                        providerId: tool.providerId,
                                      })
                                    }
                                  />
                                </div>
                                {context.familyId ? (
                                  <div className="md:col-span-2 text-sm font-medium text-muted-foreground">
                                    {formContent.fields.toolContext.familyResolved.replace(
                                      "{family}",
                                      familyMap.get(context.familyId)?.name || context.familyId,
                                    )}
                                  </div>
                                ) : null}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-[3rem] border-none bg-secondary/20 shadow-none">
                <CardHeader className="p-10 pb-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    {formContent.sections.theProcess}
                  </div>
                </CardHeader>
                <CardContent className="space-y-10 p-10">
                  <div className="space-y-3">
                    <Label className="font-bold text-sm tracking-tight text-foreground/70">
                      {formContent.fields.workflowSteps.label}
                    </Label>
                    <Textarea
                      placeholder={formContent.fields.workflowSteps.placeholder}
                      className="min-h-[200px] rounded-2xl border-2 border-border bg-white/50 p-6 text-lg focus:border-primary"
                      required
                      value={formData.howUsed}
                      onChange={(event) =>
                        setFormData({ ...formData, howUsed: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-sm tracking-tight text-foreground/70">
                      {formContent.fields.promptsTemplates.label}
                    </Label>
                    <Textarea
                      placeholder={formContent.fields.promptsTemplates.placeholder}
                      className="min-h-[150px] rounded-2xl border-2 border-border bg-white/50 p-6 font-mono text-base focus:border-primary"
                      value={formData.promptsOrTemplates}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          promptsOrTemplates: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-sm tracking-tight text-foreground/70">
                      {formContent.fields.keyFindings.label}
                    </Label>
                    <Textarea
                      placeholder={formContent.fields.keyFindings.placeholder}
                      className="min-h-[200px] rounded-2xl border-2 border-border bg-white/50 p-6 text-lg focus:border-primary"
                      required
                      value={formData.findings}
                      onChange={(event) =>
                        setFormData({ ...formData, findings: event.target.value })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-10 md:col-span-4">
              <Card className="rounded-[3rem] border-none bg-white p-4 shadow-xl shadow-primary/5">
                <CardHeader>
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    {formContent.sections.pulseMetadata}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                      {formContent.fields.yourRole.label}
                    </Label>
                    <Input
                      placeholder={formContent.fields.yourRole.placeholder}
                      className="h-14 rounded-xl border-2 border-transparent bg-secondary/30 px-4 font-bold transition-all focus:border-primary focus:bg-white"
                      required
                      value={formData.roleTitle}
                      onChange={(event) =>
                        setFormData({ ...formData, roleTitle: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                      {formContent.fields.studioTeam.label}
                    </Label>
                    <Input
                      placeholder={formContent.fields.studioTeam.placeholder}
                      className="h-14 rounded-xl border-2 border-transparent bg-secondary/30 px-4 font-bold transition-all focus:border-primary focus:bg-white"
                      required
                      value={formData.team}
                      onChange={(event) =>
                        setFormData({ ...formData, team: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                      {formContent.fields.outcomeRating.label}
                    </Label>
                    <Select
                      value={formData.outcomeRating.toString()}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          outcomeRating: parseInt(value, 10),
                        })
                      }
                    >
                      <SelectTrigger className="h-14 rounded-xl border-2 border-transparent bg-secondary/30 font-bold transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {[5, 4, 3, 2, 1].map((value) => (
                          <SelectItem
                            key={value}
                            value={value.toString()}
                            className="p-3 font-bold"
                          >
                            {value}{" "}
                            {value > 1
                              ? formContent.fields.outcomeRating.starPlural
                              : formContent.fields.outcomeRating.starSingular}{" "}
                            {value === 5
                              ? formContent.fields.outcomeRating.gameChanger
                              : value === 1
                                ? formContent.fields.outcomeRating.caution
                                : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[3rem] border-none bg-white p-4 shadow-xl shadow-primary/5">
                <CardHeader>
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    {formContent.sections.governanceImpact}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-50">
                      <ShieldAlert className="h-4 w-4" />
                      {formContent.fields.dataSensitivity.label}
                    </Label>
                    <Select
                      value={formData.dataSensitivity}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          dataSensitivity: value as DataSensitivity,
                        })
                      }
                    >
                      <SelectTrigger className="h-14 rounded-xl border-2 border-transparent bg-secondary/30 font-bold transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="Public" className="p-3 font-bold">
                          {formContent.fields.dataSensitivity.public}
                        </SelectItem>
                        <SelectItem value="Internal" className="p-3 font-bold">
                          {formContent.fields.dataSensitivity.internal}
                        </SelectItem>
                        <SelectItem
                          value="Client Confidential"
                          className="p-3 font-bold"
                        >
                          {formContent.fields.dataSensitivity.clientConfidential}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-50">
                      <Clock className="h-4 w-4" />
                      {formContent.fields.timeSaved.label}
                    </Label>
                    <Input
                      type="number"
                      placeholder={formContent.fields.timeSaved.placeholder}
                      className="h-14 rounded-xl border-2 border-transparent bg-secondary/30 px-4 font-bold transition-all focus:border-primary focus:bg-white"
                      value={formData.timeSavedHours}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          timeSavedHours: parseFloat(event.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                      {formContent.fields.tags.label}
                    </Label>
                    <Input
                      placeholder={formContent.fields.tags.placeholder}
                      className="h-14 rounded-xl border-2 border-transparent bg-secondary/30 px-4 font-bold transition-all focus:border-primary focus:bg-white"
                      value={formData.tags}
                      onChange={(event) =>
                        setFormData({ ...formData, tags: event.target.value })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function NewExperiencePage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        </div>
      }
    >
      <NewExperiencePageContent />
    </Suspense>
  );
}
