"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  deleteField,
  doc,
  updateDoc,
  type DocumentData,
  type UpdateData,
  type WithFieldValue,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  Leaf,
  Layers3,
  Save,
  Scale,
  Shield,
  Sparkles,
  Wand2,
} from "lucide-react";
import { aiItemCategorization } from "@/ai/flows/ai-item-categorization-flow";
import { aiShortDescriptionDrafting } from "@/ai/flows/ai-short-description-drafting";
import { RadarFamily, RadarItem, RadarProvider } from "@/app/lib/radar-types";
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
import {
  buildRadarConfig,
  canEditRadarItem,
  getNextRadarItemStatus,
  isRadarItemEditResubmission,
  mergeConfigOptions,
  mergeRadarFamilies,
  mergeRadarProviders,
  resolveRadarSharedProfile,
} from "@/lib/radar-firestore";
import {
  getSeedTags,
  seedFamilies,
  seedProviders,
  seedQuadrants,
  seedRings,
} from "@/lib/radar-seed";

interface RadarItemFormProps {
  initialItem?: RadarItem | null;
}

const NONE_SELECT_VALUE = "__none__";
const INHERIT_SELECT_VALUE = "__inherit__";

interface RadarItemFormState {
  name: string;
  shortDesc: string;
  notes: string;
  quadrantId: string;
  ringId: string;
  providerId: string;
  familyId: string;
  team: string;
  costRange: RadarItem["costRange"];
  origin: RadarItem["origin"] | "";
  sustainabilityNotes: string;
  securityNotes: string;
  ethicsNotes: string;
  tags: string;
  primaryLink: string;
}

function getFormState(item?: RadarItem | null): RadarItemFormState {
  const usesSharedProfile = Boolean(item?.providerId || item?.familyId);

  return {
    name: item?.name || "",
    shortDesc: item?.shortDesc || "",
    notes: item?.notes || "",
    quadrantId: String(item?.quadrantId ?? 0),
    ringId: String(item?.ringId ?? 2),
    providerId: item?.providerId || "",
    familyId: item?.familyId || "",
    team: item?.team || "",
    costRange: item?.costRange || "Low",
    origin:
      item?.originOverride || (usesSharedProfile ? "" : item?.origin || "European"),
    sustainabilityNotes:
      item?.sustainabilityNotesOverride ||
      (usesSharedProfile ? "" : item?.sustainabilityNotes || ""),
    securityNotes:
      item?.securityNotesOverride ||
      (usesSharedProfile ? "" : item?.securityNotes || ""),
    ethicsNotes:
      item?.ethicsNotesOverride ||
      (usesSharedProfile ? "" : item?.ethicsNotes || ""),
    tags: item?.tags?.join(", ") || "",
    primaryLink: item?.links?.[0] || "",
  };
}

function setOptionalUpdateField(
  payload: UpdateData<DocumentData>,
  field: string,
  value: string | undefined,
  existingValue: unknown,
): void {
  if (typeof value === "string") {
    payload[field] = value;
    return;
  }

  if (typeof existingValue !== "undefined") {
    payload[field] = deleteField();
  }
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

  const { data: quadrantDocs } = useCollection(quadrantsQuery);
  const { data: ringDocs } = useCollection(ringsQuery);
  const { data: tagDocs } = useCollection(tagsQuery);
  const { data: providerDocs } = useCollection<RadarProvider>(providersQuery);
  const { data: familyDocs } = useCollection<RadarFamily>(familiesQuery);

  const quadrants = useMemo(() => {
    return mergeConfigOptions(quadrantDocs, seedQuadrants, true);
  }, [quadrantDocs]);
  const rings = useMemo(() => {
    return mergeConfigOptions(ringDocs, seedRings);
  }, [ringDocs]);
  const availableTags = useMemo(() => {
    if (tagDocs?.length) {
      return tagDocs.map((item) => item.name);
    }

    return getSeedTags().map((item) => item.name);
  }, [tagDocs]);
  const providers = useMemo(() => {
    return mergeRadarProviders(providerDocs, seedProviders);
  }, [providerDocs]);
  const families = useMemo(() => {
    return mergeRadarFamilies(familyDocs, seedFamilies);
  }, [familyDocs]);
  const selectedFamily = useMemo(() => {
    if (!formData.familyId) {
      return null;
    }

    return families.find((item) => item.id === formData.familyId) || null;
  }, [families, formData.familyId]);
  const selectedProvider = useMemo(() => {
    const providerId = selectedFamily?.providerId || formData.providerId;

    if (!providerId) {
      return null;
    }

    return providers.find((item) => item.id === providerId) || null;
  }, [formData.providerId, providers, selectedFamily]);
  const filteredFamilies = useMemo(() => {
    const providerId = formData.providerId || selectedFamily?.providerId;

    if (!providerId) {
      return families;
    }

    return families.filter((item) => item.providerId === providerId);
  }, [families, formData.providerId, selectedFamily]);
  const sharedDefaults = useMemo(() => {
    return resolveRadarSharedProfile(selectedProvider, selectedFamily, "European");
  }, [selectedFamily, selectedProvider]);
  const hasSharedProfile = Boolean(selectedProvider || selectedFamily);
  const sharedProfileLabel = selectedFamily
    ? `${selectedProvider?.name || selectedFamily.providerName || "Provider"} / ${selectedFamily.name}`
    : selectedProvider?.name || "";
  const config = buildRadarConfig(quadrants, rings);
  const isEditMode = Boolean(initialItem);
  const isResubmittingForReview = authUser
    ? isRadarItemEditResubmission(initialItem, authUser.uid, role)
    : false;
  const submitLabel = isEditMode
    ? isResubmittingForReview
      ? "Save & Resubmit"
      : "Save Changes"
    : "Submit Suggestion";
  const helperText = !isEditMode
    ? "Submit a new tool suggestion for review."
    : initialItem?.status === "Approved" && isResubmittingForReview
      ? "Update the approved blip. Saving will send it back to the review queue."
      : isResubmittingForReview
        ? "Update the blip and send it back for review."
        : "Update the blip and keep the workflow moving.";

  useEffect(() => {
    setFormData(getFormState(initialItem));
  }, [initialItem]);

  function handleProviderChange(value: string): void {
    if (value === NONE_SELECT_VALUE) {
      setFormData((currentState) => ({
        ...currentState,
        providerId: "",
        familyId: "",
      }));
      return;
    }

    setFormData((currentState) => {
      const nextFamilyId =
        currentState.familyId &&
        families.some(
          (item) =>
            item.id === currentState.familyId && item.providerId === value,
        )
          ? currentState.familyId
          : "";

      return {
        ...currentState,
        providerId: value,
        familyId: nextFamilyId,
      };
    });
  }

  function handleFamilyChange(value: string): void {
    if (value === NONE_SELECT_VALUE) {
      setFormData((currentState) => ({
        ...currentState,
        familyId: "",
      }));
      return;
    }

    const family = families.find((item) => item.id === value);

    setFormData((currentState) => ({
      ...currentState,
      familyId: value,
      providerId: family?.providerId || currentState.providerId,
    }));
  }

  function handleOriginChange(value: string): void {
    setFormData((currentState) => ({
      ...currentState,
      origin:
        value === INHERIT_SELECT_VALUE ? "" : (value as RadarItem["origin"]),
    }));
  }

  async function handleAiCategorize(): Promise<void> {
    if (!formData.name || !formData.notes) {
      toast({
        title: "Missing context",
        description: "Name and strategic context are required for AI help.",
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
        title: "AI updated the suggestion",
        description: "Quadrant and tags were refreshed.",
      });
    } catch (error) {
      toast({
        title: "AI categorization failed",
        description: "The tool could not be categorized right now.",
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  }

  async function handleAiSummarize(): Promise<void> {
    if (!formData.notes) {
      toast({
        title: "Missing context",
        description: "Add strategic context first so the summary can be drafted.",
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
        title: "AI summary ready",
        description: "The concise summary was drafted.",
      });
    } catch (error) {
      toast({
        title: "AI summary failed",
        description: "The summary could not be generated.",
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
        title: "Sign-in required",
        description: "You must be signed in with a company account.",
        variant: "destructive",
      });
      return;
    }

    if (initialItem && !canEditRadarItem(initialItem, authUser.uid, role)) {
      toast({
        title: "Editing not allowed",
        description: "You do not have access to change this blip.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const now = Date.now();
    const nextStatus = getNextRadarItemStatus(initialItem, authUser.uid, role);
    const isResubmittingForReview = isRadarItemEditResubmission(
      initialItem,
      authUser.uid,
      role,
    );
    const nextRingId = Number(formData.ringId);
    const basePayload: WithFieldValue<DocumentData> = {
      name: formData.name,
      shortDesc: formData.shortDesc,
      notes: formData.notes,
      quadrantId: Number(formData.quadrantId),
      ringId: nextRingId,
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
      submittedAt:
        isResubmittingForReview || !initialItem?.submittedAt
          ? now
          : initialItem.submittedAt,
      submittedBy:
        isResubmittingForReview || !initialItem?.submittedBy
          ? authUser.uid
          : initialItem.submittedBy,
      lastReviewedAt: initialItem?.lastReviewedAt || now,
      createdAt: initialItem?.createdAt || now,
      createdBy: initialItem?.createdBy || authUser.uid,
      updatedAt: now,
      updatedBy: authUser.uid,
      pricingTiers: initialItem?.pricingTiers || [],
      history: initialItem?.history || [],
    };

    try {
      if (initialItem) {
        const payload: UpdateData<DocumentData> = { ...basePayload };

        if (initialItem.ringId !== nextRingId) {
          payload.previousRingId = initialItem.ringId;
        } else if (typeof initialItem.previousRingId === "number") {
          payload.previousRingId = initialItem.previousRingId;
        }

        if (isResubmittingForReview) {
          payload.reviewComment = "";
          payload.reviewedAt = deleteField();
          payload.reviewedBy = deleteField();
        } else {
          if (initialItem.reviewComment) {
            payload.reviewComment = initialItem.reviewComment;
          }

          if (typeof initialItem.reviewedAt === "number") {
            payload.reviewedAt = initialItem.reviewedAt;
          }

          if (initialItem.reviewedBy) {
            payload.reviewedBy = initialItem.reviewedBy;
          }
        }

        await updateDoc(doc(db, "radarItems", initialItem.id), payload);
        await addDoc(collection(db, "radarItems", initialItem.id, "itemHistory"), {
          itemId: initialItem.id,
          action: isResubmittingForReview ? "resubmitted" : "updated",
          note: isResubmittingForReview
            ? initialItem.status === "Approved"
              ? "Updated after approval and sent back for review."
              : "Reworked and sent back for review."
            : "Details updated.",
          before: initialItem.status,
          after: nextStatus,
          createdAt: now,
          createdBy: authUser.uid,
        });
        toast({
          title: isResubmittingForReview ? "Blip resubmitted" : "Changes saved",
          description: isResubmittingForReview
            ? "The updated blip is now pending reviewer approval."
            : "The blip details were updated.",
        });
        router.push(`/items/${initialItem.id}`);
      } else {
        const documentReference = await addDoc(
          collection(db, "radarItems"),
          basePayload,
        );
        await addDoc(
          collection(db, "radarItems", documentReference.id, "itemHistory"),
          {
            itemId: documentReference.id,
            action: "submitted",
            note: "Submitted for power user review.",
            after: "Pending",
            createdAt: now,
            createdBy: authUser.uid,
          },
        );
        toast({
          title: "Suggestion submitted",
          description: "Your blip is now pending review.",
        });
        router.push("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: "The blip could not be saved to Firestore.",
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
            Return
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-6xl font-black uppercase leading-none tracking-tighter text-foreground">
            {isEditMode ? "Edit" : "Propose"} <br />
            <span className="text-primary">Tool Blip</span>
          </h1>
          <p className="text-xl font-medium text-muted-foreground">{helperText}</p>
        </div>
        <Button
          type="submit"
          className="h-14 gap-2 rounded-full px-12 text-lg font-bold shadow-lg hover:shadow-primary/20"
          disabled={isSubmitting}
        >
          <Save className="h-5 w-5" />
          {submitLabel}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
        <div className="space-y-10 md:col-span-8">
          <Card className="overflow-hidden rounded-[3rem] border-none bg-secondary/20 shadow-none">
            <CardHeader className="p-10 pb-2">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                Identity & Context
              </div>
            </CardHeader>
            <CardContent className="space-y-8 p-10">
              <div className="space-y-3">
                <Label htmlFor="name" className="font-bold text-sm text-foreground/70">
                  Tool Name
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
                    Strategic Context
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
                    AI Pulse
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
                    Concise Summary
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
                    AI Draft
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
                Responsibility Review
              </div>
            </CardHeader>
            <CardContent className="space-y-8 p-10">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-bold text-sm text-foreground/70">
                    <Leaf className="h-4 w-4 text-primary" />
                    Sustainability
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
                    Security & GDPR
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
                  Ethics
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
                Pulse Placement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                  Strategic Focus
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
                        textValue={quadrant.name}
                        className="p-3"
                      >
                        <span className="flex flex-col">
                          <span className="font-bold">{quadrant.name}</span>
                          {quadrant.description ? (
                            <span className="text-xs font-medium text-muted-foreground">
                              {quadrant.description}
                            </span>
                          ) : null}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                  Maturity Trial
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
                  Origin
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
                      European
                    </SelectItem>
                    <SelectItem value="American" className="p-3 font-bold">
                      American
                    </SelectItem>
                    <SelectItem value="Other" className="p-3 font-bold">
                      Other
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[3rem] border-none bg-white p-4 shadow-xl shadow-primary/5">
            <CardHeader>
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                  Team
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
                  Cost Range
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
                      Free
                    </SelectItem>
                    <SelectItem value="Low" className="p-3 font-bold">
                      Low
                    </SelectItem>
                    <SelectItem value="Medium" className="p-3 font-bold">
                      Medium
                    </SelectItem>
                    <SelectItem value="High" className="p-3 font-bold">
                      High
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                  Tags
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
                  Primary Link
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
