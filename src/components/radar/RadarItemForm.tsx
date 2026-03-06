"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  Leaf,
  Save,
  Scale,
  Shield,
  Sparkles,
  Wand2,
} from "lucide-react";
import { aiItemCategorization } from "@/ai/flows/ai-item-categorization-flow";
import { aiShortDescriptionDrafting } from "@/ai/flows/ai-short-description-drafting";
import { RadarItem } from "@/app/lib/radar-types";
import { useAppUser } from "@/components/app/AppUserProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { buildRadarConfig, canEditRadarItem, sortConfigOptions } from "@/lib/radar-firestore";
import { getSeedTags, seedQuadrants, seedRings } from "@/lib/radar-seed";
import common from "@/content/common.json";
import formContent from "@/content/pages/item-form.json";

interface RadarItemFormProps {
  initialItem?: RadarItem | null;
}

interface RadarItemFormState {
  name: string;
  shortDesc: string;
  notes: string;
  quadrantId: string;
  ringId: string;
  team: string;
  costRange: RadarItem["costRange"];
  origin: RadarItem["origin"];
  sustainabilityNotes: string;
  securityNotes: string;
  ethicsNotes: string;
  tags: string;
  primaryLink: string;
}

function getFormState(item?: RadarItem | null): RadarItemFormState {
  return {
    name: item?.name || "",
    shortDesc: item?.shortDesc || "",
    notes: item?.notes || "",
    quadrantId: String(item?.quadrantId ?? 0),
    ringId: String(item?.ringId ?? 2),
    team: item?.team || "",
    costRange: item?.costRange || "Low",
    origin: item?.origin || "European",
    sustainabilityNotes: item?.sustainabilityNotes || "",
    securityNotes: item?.securityNotes || "",
    ethicsNotes: item?.ethicsNotes || "",
    tags: item?.tags?.join(", ") || "",
    primaryLink: item?.links?.[0] || "",
  };
}

export function RadarItemForm({
  initialItem,
}: RadarItemFormProps): React.ReactElement {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { authUser, hasCompanyAccess, profile, role } = useAppUser();
  const [formData, setFormData] = useState<RadarItemFormState>(() =>
    getFormState(initialItem),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

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
  const tagsQuery = useMemoFirebase(() => {
    if (!hasCompanyAccess) {
      return null;
    }

    return collection(db, "tags");
  }, [db, hasCompanyAccess]);

  const { data: quadrantDocs } = useCollection(quadrantsQuery);
  const { data: ringDocs } = useCollection(ringsQuery);
  const { data: tagDocs } = useCollection(tagsQuery);

  const quadrants = useMemo(() => {
    const items = sortConfigOptions(quadrantDocs);
    return items.length ? items : seedQuadrants;
  }, [quadrantDocs]);
  const rings = useMemo(() => {
    const items = sortConfigOptions(ringDocs);
    return items.length ? items : seedRings;
  }, [ringDocs]);
  const availableTags = useMemo(() => {
    if (tagDocs?.length) {
      return tagDocs.map((item) => item.name);
    }

    return getSeedTags().map((item) => item.name);
  }, [tagDocs]);
  const config = buildRadarConfig(quadrants, rings);
  const isEditMode = Boolean(initialItem);

  useEffect(() => {
    setFormData(getFormState(initialItem));
  }, [initialItem]);

  async function handleAiCategorize(): Promise<void> {
    if (!formData.name || !formData.notes) {
      toast({
        title: formContent.toasts.missingContextCategorize.title,
        description: formContent.toasts.missingContextCategorize.description,
        variant: "destructive",
      });
      return;
    }

    setIsAiLoading(true);

    try {
      const result = await aiItemCategorization({
        itemName: formData.name,
        itemDescription: formData.notes,
        availableQuadrants: config.quadrants,
        availableTags,
      });
      const nextQuadrantIndex = config.quadrants.indexOf(result.suggestedQuadrant);

      setFormData((currentState) => ({
        ...currentState,
        quadrantId:
          nextQuadrantIndex >= 0
            ? String(nextQuadrantIndex)
            : currentState.quadrantId,
        tags: result.suggestedTags.join(", "),
      }));
      toast({
        title: formContent.toasts.aiCategorized.title,
        description: formContent.toasts.aiCategorized.description,
      });
    } catch (error) {
      toast({
        title: formContent.toasts.aiCategorizeFailed.title,
        description: formContent.toasts.aiCategorizeFailed.description,
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  }

  async function handleAiSummarize(): Promise<void> {
    if (!formData.notes) {
      toast({
        title: formContent.toasts.missingContextSummarize.title,
        description: formContent.toasts.missingContextSummarize.description,
        variant: "destructive",
      });
      return;
    }

    setIsAiLoading(true);

    try {
      const result = await aiShortDescriptionDrafting({
        detailedNotes: formData.notes,
        links: formData.primaryLink ? [formData.primaryLink] : [],
      });

      setFormData((currentState) => ({
        ...currentState,
        shortDesc: result,
      }));
      toast({
        title: formContent.toasts.aiSummaryReady.title,
        description: formContent.toasts.aiSummaryReady.description,
      });
    } catch (error) {
      toast({
        title: formContent.toasts.aiSummaryFailed.title,
        description: formContent.toasts.aiSummaryFailed.description,
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!authUser || !profile || !hasCompanyAccess) {
      toast({
        title: common.auth.signInRequired,
        description: common.auth.signInRequiredDescription,
        variant: "destructive",
      });
      return;
    }

    if (initialItem && !canEditRadarItem(initialItem, authUser.uid, role)) {
      toast({
        title: formContent.toasts.editingNotAllowed.title,
        description: formContent.toasts.editingNotAllowed.description,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const now = Date.now();
    const nextStatus =
      initialItem?.status === "Draft" && initialItem.createdBy === authUser.uid
        ? "Pending"
        : initialItem?.status || "Pending";
    const payload = {
      name: formData.name,
      shortDesc: formData.shortDesc,
      notes: formData.notes,
      quadrantId: Number(formData.quadrantId),
      ringId: Number(formData.ringId),
      tags: formData.tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      team: formData.team,
      ownerId: initialItem?.ownerId || authUser.uid,
      ownerName: initialItem?.ownerName || profile.displayName,
      scores: initialItem?.scores || {
        maturity: 3,
        impact: 3,
        effort: 2,
        risk: 2,
      },
      costRange: formData.costRange,
      origin: formData.origin,
      sustainabilityNotes: formData.sustainabilityNotes,
      securityNotes: formData.securityNotes,
      ethicsNotes: formData.ethicsNotes,
      links: formData.primaryLink ? [formData.primaryLink] : [],
      status: nextStatus,
      submittedAt: initialItem?.submittedAt || now,
      submittedBy: initialItem?.submittedBy || authUser.uid,
      lastReviewedAt: initialItem?.lastReviewedAt || now,
      createdAt: initialItem?.createdAt || now,
      createdBy: initialItem?.createdBy || authUser.uid,
      updatedAt: now,
      updatedBy: authUser.uid,
      previousRingId: initialItem?.previousRingId,
      pricingTiers: initialItem?.pricingTiers || [],
      history: initialItem?.history || [],
      ...(initialItem?.status === "Draft"
        ? {
            reviewComment: "",
          }
        : {
            ...(initialItem?.reviewComment
              ? { reviewComment: initialItem.reviewComment }
              : {}),
            ...(typeof initialItem?.reviewedAt === "number"
              ? { reviewedAt: initialItem.reviewedAt }
              : {}),
            ...(initialItem?.reviewedBy
              ? { reviewedBy: initialItem.reviewedBy }
              : {}),
          }),
    };

    try {
      if (initialItem) {
        await updateDoc(doc(db, "radarItems", initialItem.id), payload);
        await addDoc(collection(db, "radarItems", initialItem.id, "itemHistory"), {
          itemId: initialItem.id,
          action:
            initialItem.status === "Draft" && nextStatus === "Pending"
              ? formContent.history.resubmitted
              : formContent.history.updated,
          note:
            initialItem.status === "Draft" && nextStatus === "Pending"
              ? formContent.history.resubmittedNote
              : formContent.history.updatedNote,
          before: initialItem.status,
          after: nextStatus,
          createdAt: now,
          createdBy: authUser.uid,
        });
        toast({
          title:
            nextStatus === "Pending" && initialItem.status === "Draft"
              ? formContent.toasts.blipResubmitted.title
              : formContent.toasts.changesSaved.title,
          description:
            nextStatus === "Pending" && initialItem.status === "Draft"
              ? formContent.toasts.blipResubmitted.description
              : formContent.toasts.changesSaved.description,
        });
        router.push(`/items/${initialItem.id}`);
      } else {
        const documentReference = await addDoc(collection(db, "radarItems"), payload);
        await addDoc(
          collection(db, "radarItems", documentReference.id, "itemHistory"),
          {
            itemId: documentReference.id,
            action: formContent.history.submitted,
            note: formContent.history.submittedNote,
            after: "Pending",
            createdAt: now,
            createdBy: authUser.uid,
          },
        );
        toast({
          title: formContent.toasts.suggestionSubmitted.title,
          description: formContent.toasts.suggestionSubmitted.description,
        });
        router.push("/dashboard");
      }
    } catch (error) {
      toast({
        title: formContent.toasts.saveFailed.title,
        description: formContent.toasts.saveFailed.description,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      <div className="mb-10">
        <Button
          variant="ghost"
          asChild
          className="gap-2 -ml-2 font-bold text-muted-foreground hover:text-primary"
        >
          <Link href={initialItem ? `/items/${initialItem.id}` : "/dashboard"}>
            <ArrowLeft className="h-5 w-5" />
            {common.common.return}
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-6xl font-black uppercase leading-none tracking-tighter text-foreground">
            {isEditMode ? formContent.edit.heading : formContent.create.heading} <br />
            <span className="text-primary">{formContent.headingHighlight}</span>
          </h1>
          <p className="text-xl font-medium text-muted-foreground">
            {isEditMode
              ? formContent.edit.description
              : formContent.create.description}
          </p>
        </div>
        <Button
          type="submit"
          className="h-14 gap-2 rounded-full px-12 text-lg font-bold shadow-lg hover:shadow-primary/20"
          disabled={isSubmitting}
        >
          <Save className="h-5 w-5" />
          {isEditMode ? formContent.edit.submitButton : formContent.create.submitButton}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
        <div className="space-y-10 md:col-span-8">
          <Card className="overflow-hidden rounded-[3rem] border-none bg-secondary/20 shadow-none">
            <CardHeader className="p-10 pb-2">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                {formContent.sections.identityContext}
              </div>
            </CardHeader>
            <CardContent className="space-y-8 p-10">
              <div className="space-y-3">
                <Label htmlFor="name" className="font-bold text-sm text-foreground/70">
                  {formContent.fields.toolName}
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  className="h-16 rounded-2xl border-2 border-border bg-white/50 text-xl"
                  onChange={(event) =>
                    setFormData((currentState) => ({
                      ...currentState,
                      name: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notes" className="font-bold text-sm text-foreground/70">
                    {formContent.fields.strategicContext}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 rounded-full font-bold text-primary hover:bg-primary/10"
                    onClick={handleAiCategorize}
                    disabled={isAiLoading}
                  >
                    <Sparkles className="h-4 w-4" />
                    {formContent.ai.pulse}
                  </Button>
                </div>
                <Textarea
                  id="notes"
                  required
                  value={formData.notes}
                  className="min-h-[220px] rounded-2xl border-2 border-border bg-white/50 p-6 text-lg font-medium"
                  onChange={(event) =>
                    setFormData((currentState) => ({
                      ...currentState,
                      notes: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="shortDesc"
                    className="font-bold text-sm text-foreground/70"
                  >
                    {formContent.fields.conciseSummary}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 rounded-full font-bold text-primary hover:bg-primary/10"
                    onClick={handleAiSummarize}
                    disabled={isAiLoading}
                  >
                    <Wand2 className="h-4 w-4" />
                    {formContent.ai.draft}
                  </Button>
                </div>
                <Input
                  id="shortDesc"
                  required
                  value={formData.shortDesc}
                  className="h-16 rounded-2xl border-2 border-border bg-white/50 text-xl"
                  onChange={(event) =>
                    setFormData((currentState) => ({
                      ...currentState,
                      shortDesc: event.target.value,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[3rem] border-none bg-secondary/20 shadow-none">
            <CardHeader className="p-10 pb-2">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                {formContent.sections.responsibilityReview}
              </div>
            </CardHeader>
            <CardContent className="space-y-8 p-10">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-bold text-sm text-foreground/70">
                    <Leaf className="h-4 w-4 text-primary" />
                    {common.labels.sustainability}
                  </Label>
                  <Textarea
                    value={formData.sustainabilityNotes}
                    className="h-32 rounded-2xl border-2 border-border bg-white/50"
                    onChange={(event) =>
                      setFormData((currentState) => ({
                        ...currentState,
                        sustainabilityNotes: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-bold text-sm text-foreground/70">
                    <Shield className="h-4 w-4 text-primary" />
                    {common.labels.securityGdpr}
                  </Label>
                  <Textarea
                    value={formData.securityNotes}
                    className="h-32 rounded-2xl border-2 border-border bg-white/50"
                    onChange={(event) =>
                      setFormData((currentState) => ({
                        ...currentState,
                        securityNotes: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="flex items-center gap-2 font-bold text-sm text-foreground/70">
                  <Scale className="h-4 w-4 text-primary" />
                  {common.labels.ethics}
                </Label>
                <Textarea
                  value={formData.ethicsNotes}
                  className="h-32 rounded-2xl border-2 border-border bg-white/50"
                  onChange={(event) =>
                    setFormData((currentState) => ({
                      ...currentState,
                      ethicsNotes: event.target.value,
                    }))
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
                {formContent.sections.pulsePlacement}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                  {formContent.fields.strategicFocus}
                </Label>
                <Select
                  value={formData.quadrantId}
                  onValueChange={(value) =>
                    setFormData((currentState) => ({
                      ...currentState,
                      quadrantId: value,
                    }))
                  }
                >
                  <SelectTrigger className="h-14 rounded-xl border-2 border-transparent bg-secondary/30 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {quadrants.map((quadrant) => (
                      <SelectItem
                        key={quadrant.id}
                        value={String(quadrant.order)}
                        className="p-3 font-bold"
                      >
                        {quadrant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                  {formContent.fields.maturityTrial}
                </Label>
                <Select
                  value={formData.ringId}
                  onValueChange={(value) =>
                    setFormData((currentState) => ({
                      ...currentState,
                      ringId: value,
                    }))
                  }
                >
                  <SelectTrigger className="h-14 rounded-xl border-2 border-transparent bg-secondary/30 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {rings.map((ring) => (
                      <SelectItem
                        key={ring.id}
                        value={String(ring.order)}
                        className="p-3 font-bold"
                      >
                        {ring.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-50">
                  <Globe className="h-4 w-4" />
                  {formContent.origin.label}
                </Label>
                <Select
                  value={formData.origin}
                  onValueChange={(value: RadarItem["origin"]) =>
                    setFormData((currentState) => ({
                      ...currentState,
                      origin: value,
                    }))
                  }
                >
                  <SelectTrigger className="h-14 rounded-xl border-2 border-transparent bg-secondary/30 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="European" className="p-3 font-bold">
                      {formContent.origin.european}
                    </SelectItem>
                    <SelectItem value="American" className="p-3 font-bold">
                      {formContent.origin.american}
                    </SelectItem>
                    <SelectItem value="Other" className="p-3 font-bold">
                      {formContent.origin.other}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[3rem] border-none bg-white p-4 shadow-xl shadow-primary/5">
            <CardHeader>
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                {formContent.sections.metadata}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                  {formContent.fields.team}
                </Label>
                <Input
                  value={formData.team}
                  className="h-14 rounded-xl border-2 border-transparent bg-secondary/30 font-bold"
                  onChange={(event) =>
                    setFormData((currentState) => ({
                      ...currentState,
                      team: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                  {formContent.fields.costRange}
                </Label>
                <Select
                  value={formData.costRange}
                  onValueChange={(value: RadarItem["costRange"]) =>
                    setFormData((currentState) => ({
                      ...currentState,
                      costRange: value,
                    }))
                  }
                >
                  <SelectTrigger className="h-14 rounded-xl border-2 border-transparent bg-secondary/30 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="Free" className="p-3 font-bold">
                      {formContent.costOptions.free}
                    </SelectItem>
                    <SelectItem value="Low" className="p-3 font-bold">
                      {formContent.costOptions.low}
                    </SelectItem>
                    <SelectItem value="Medium" className="p-3 font-bold">
                      {formContent.costOptions.medium}
                    </SelectItem>
                    <SelectItem value="High" className="p-3 font-bold">
                      {formContent.costOptions.high}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                  {formContent.fields.tags}
                </Label>
                <Input
                  value={formData.tags}
                  className="h-14 rounded-xl border-2 border-transparent bg-secondary/30 font-bold"
                  onChange={(event) =>
                    setFormData((currentState) => ({
                      ...currentState,
                      tags: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                  {formContent.fields.primaryLink}
                </Label>
                <Input
                  value={formData.primaryLink}
                  className="h-14 rounded-xl border-2 border-transparent bg-secondary/30 font-bold"
                  onChange={(event) =>
                    setFormData((currentState) => ({
                      ...currentState,
                      primaryLink: event.target.value,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
