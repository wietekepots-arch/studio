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
import common from "@/content/common.json";
import formContent from "@/content/pages/item-form.json";

interface RadarItemFormProps {
  initialItem?: RadarItem | null;
}

const NONE_SELECT_VALUE = "__none__";
const INHERIT_SELECT_VALUE = "__inherit__";

interface RadarItemFormState {
  name: string;
  shortDesc: string;
  notes: string;
  availabilitySummary: string;
  accessNotes: string;
  accessRequestUrl: string;
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

function formatTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value));
  }, template);
}

function getOriginLabel(origin: RadarItem["origin"]): string {
  switch (origin) {
    case "European":
      return formContent.origin.european;
    case "American":
      return formContent.origin.american;
    case "Other":
      return formContent.origin.other;
    default:
      return origin;
  }
}

function getFormState(item?: RadarItem | null): RadarItemFormState {
  const usesSharedProfile = Boolean(item?.providerId || item?.familyId);

  return {
    name: item?.name || "",
    shortDesc: item?.shortDesc || "",
    notes: item?.notes || "",
    availabilitySummary: item?.availabilitySummary || "",
    accessNotes: item?.accessNotes || "",
    accessRequestUrl: item?.accessRequestUrl || "",
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
    ? `${selectedProvider?.name || selectedFamily.providerName || formContent.fields.provider} / ${selectedFamily.name}`
    : selectedProvider?.name || "";
  const config = buildRadarConfig(quadrants, rings);
  const isEditMode = Boolean(initialItem);
  const isResubmittingForReview = authUser
    ? isRadarItemEditResubmission(initialItem, authUser.uid, role)
    : false;
  const submitLabel = isEditMode
    ? isResubmittingForReview
      ? formContent.edit.resubmitButton
      : formContent.edit.submitButton
    : formContent.create.submitButton;
  const helperText = !isEditMode
    ? formContent.create.description
    : initialItem?.status === "Approved" && isResubmittingForReview
      ? formContent.edit.approvedResubmitDescription
      : isResubmittingForReview
        ? formContent.edit.resubmitDescription
        : formContent.edit.description;

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
      const shouldDefaultToInheritance =
        !currentState.providerId &&
        !currentState.familyId &&
        currentState.origin === "European";

      return {
        ...currentState,
        providerId: value,
        familyId: nextFamilyId,
        origin: shouldDefaultToInheritance ? "" : currentState.origin,
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
      origin:
        !currentState.providerId &&
        !currentState.familyId &&
        currentState.origin === "European"
          ? ""
          : currentState.origin,
    }));
  }

  function handleOriginChange(value: string): void {
    setFormData((currentState) => ({
      ...currentState,
      origin:
        value === "European" || value === "American" || value === "Other"
          ? value
          : "",
    }));
  }

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
    } catch {
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
    } catch {
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
    const nextStatus = getNextRadarItemStatus(initialItem, authUser.uid, role);
    const nextRingId = Number(formData.ringId);
    const providerId = selectedFamily?.providerId || formData.providerId;
    const providerName = selectedProvider?.name || selectedFamily?.providerName;
    const familyId = selectedFamily?.id;
    const familyName = selectedFamily?.name;
    const effectiveOrigin = formData.origin || sharedDefaults.origin;
    const effectiveSustainability =
      formData.sustainabilityNotes || sharedDefaults.sustainabilityNotes;
    const effectiveSecurity = formData.securityNotes || sharedDefaults.securityNotes;
    const effectiveEthics = formData.ethicsNotes || sharedDefaults.ethicsNotes;
    const originOverride = hasSharedProfile && formData.origin
      ? formData.origin
      : undefined;
    const sustainabilityOverride =
      hasSharedProfile && formData.sustainabilityNotes
        ? formData.sustainabilityNotes
        : undefined;
    const securityOverride =
      hasSharedProfile && formData.securityNotes
        ? formData.securityNotes
        : undefined;
    const ethicsOverride = hasSharedProfile && formData.ethicsNotes
      ? formData.ethicsNotes
      : undefined;
    const availabilitySummary = formData.availabilitySummary.trim();
    const accessNotes = formData.accessNotes.trim();
    const accessRequestUrl = formData.accessRequestUrl.trim();
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
      costRange: formData.costRange,
      origin: effectiveOrigin,
      sustainabilityNotes: effectiveSustainability,
      securityNotes: effectiveSecurity,
      ethicsNotes: effectiveEthics,
      links: formData.primaryLink ? [formData.primaryLink] : [],
      status: nextStatus,
      submittedAt: !initialItem?.submittedAt || isResubmittingForReview ? now : initialItem.submittedAt,
      submittedBy: !initialItem?.submittedBy || isResubmittingForReview ? authUser.uid : initialItem.submittedBy,
      lastReviewedAt: initialItem?.lastReviewedAt || now,
      createdAt: initialItem?.createdAt || now,
      createdBy: initialItem?.createdBy || authUser.uid,
      updatedAt: now,
      updatedBy: authUser.uid,
      pricingTiers: initialItem?.pricingTiers || [],
      history: initialItem?.history || [],
      ...(availabilitySummary ? { availabilitySummary } : {}),
      ...(accessNotes ? { accessNotes } : {}),
      ...(accessRequestUrl ? { accessRequestUrl } : {}),
      ...(providerId ? { providerId } : {}),
      ...(providerName ? { providerName } : {}),
      ...(familyId ? { familyId } : {}),
      ...(familyName ? { familyName } : {}),
      ...(originOverride ? { originOverride } : {}),
      ...(sustainabilityOverride ? { sustainabilityNotesOverride: sustainabilityOverride } : {}),
      ...(securityOverride ? { securityNotesOverride: securityOverride } : {}),
      ...(ethicsOverride ? { ethicsNotesOverride: ethicsOverride } : {}),
    };

    try {
      if (initialItem) {
        const payload: UpdateData<DocumentData> = { ...basePayload };

        if (initialItem.ringId !== nextRingId) {
          payload.previousRingId = initialItem.ringId;
        } else if (typeof initialItem.previousRingId === "number") {
          payload.previousRingId = initialItem.previousRingId;
        }

        setOptionalUpdateField(payload, "providerId", providerId || undefined, initialItem.providerId);
        setOptionalUpdateField(payload, "providerName", providerName, initialItem.providerName);
        setOptionalUpdateField(payload, "familyId", familyId, initialItem.familyId);
        setOptionalUpdateField(payload, "familyName", familyName, initialItem.familyName);
        setOptionalUpdateField(payload, "originOverride", originOverride, initialItem.originOverride);
        setOptionalUpdateField(
          payload,
          "sustainabilityNotesOverride",
          sustainabilityOverride,
          initialItem.sustainabilityNotesOverride,
        );
        setOptionalUpdateField(
          payload,
          "securityNotesOverride",
          securityOverride,
          initialItem.securityNotesOverride,
        );
        setOptionalUpdateField(
          payload,
          "ethicsNotesOverride",
          ethicsOverride,
          initialItem.ethicsNotesOverride,
        );
        setOptionalUpdateField(
          payload,
          "availabilitySummary",
          availabilitySummary || undefined,
          initialItem.availabilitySummary,
        );
        setOptionalUpdateField(
          payload,
          "accessNotes",
          accessNotes || undefined,
          initialItem.accessNotes,
        );
        setOptionalUpdateField(
          payload,
          "accessRequestUrl",
          accessRequestUrl || undefined,
          initialItem.accessRequestUrl,
        );

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
          action: isResubmittingForReview ? formContent.history.resubmitted : formContent.history.updated,
          note: isResubmittingForReview
            ? initialItem.status === "Approved"
              ? formContent.history.resubmittedApprovedNote
              : formContent.history.resubmittedNote
            : formContent.history.updatedNote,
          before: initialItem.status,
          after: nextStatus,
          createdAt: now,
          createdBy: authUser.uid,
        });
        toast({
          title: isResubmittingForReview
            ? formContent.toasts.blipResubmitted.title
            : formContent.toasts.changesSaved.title,
          description: isResubmittingForReview
            ? formContent.toasts.blipResubmitted.description
            : formContent.toasts.changesSaved.description,
        });
        router.push(`/items/${initialItem.id}`);
      } else {
        const documentReference = await addDoc(collection(db, "radarItems"), basePayload);
        await addDoc(collection(db, "radarItems", documentReference.id, "itemHistory"), {
          itemId: documentReference.id,
          action: formContent.history.submitted,
          note: formContent.history.submittedNote,
          after: "Pending",
          createdAt: now,
          createdBy: authUser.uid,
        });
        toast({
          title: formContent.toasts.suggestionSubmitted.title,
          description: formContent.toasts.suggestionSubmitted.description,
        });
        router.push("/dashboard");
      }
    } catch {
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
                {formContent.sections.availabilityAccess}
              </div>
            </CardHeader>
            <CardContent className="space-y-8 p-10">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="availabilitySummary" className="font-bold text-sm text-foreground/70">
                    {formContent.fields.availabilitySummary}
                  </Label>
                  <Textarea
                    id="availabilitySummary"
                    value={formData.availabilitySummary}
                    placeholder={formContent.fields.availabilityPlaceholder}
                    className="h-32 rounded-2xl border-2 border-border bg-white/50"
                    onChange={(event) =>
                      setFormData((currentState) => ({
                        ...currentState,
                        availabilitySummary: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="accessNotes" className="font-bold text-sm text-foreground/70">
                    {formContent.fields.accessNotes}
                  </Label>
                  <Textarea
                    id="accessNotes"
                    value={formData.accessNotes}
                    placeholder={formContent.fields.accessPlaceholder}
                    className="h-32 rounded-2xl border-2 border-border bg-white/50"
                    onChange={(event) =>
                      setFormData((currentState) => ({
                        ...currentState,
                        accessNotes: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="accessRequestUrl" className="font-bold text-sm text-foreground/70">
                  {formContent.fields.accessRequestUrl}
                </Label>
                <Input
                  id="accessRequestUrl"
                  value={formData.accessRequestUrl}
                  className="h-14 rounded-2xl border-2 border-border bg-white/50"
                  onChange={(event) =>
                    setFormData((currentState) => ({
                      ...currentState,
                      accessRequestUrl: event.target.value,
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
              {hasSharedProfile ? (
                <div className="rounded-[2rem] border border-primary/10 bg-white/70 p-5 text-sm font-medium text-muted-foreground">
                  {formContent.inheritance.sharedProfile}:{" "}
                  <span className="font-black text-foreground">{sharedProfileLabel}</span>.{" "}
                  {formatTemplate(formContent.inheritance.description, {
                    label: formContent.inheritance.followSharedProfile,
                  })}
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-bold text-sm text-foreground/70">
                    <Leaf className="h-4 w-4 text-primary" />
                    {common.labels.sustainability}
                  </Label>
                  <Textarea
                    value={formData.sustainabilityNotes}
                    placeholder={
                      hasSharedProfile
                        ? sharedDefaults.sustainabilityNotes ||
                          formContent.inheritance.noSharedSustainability
                        : ""
                    }
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
                    placeholder={
                      hasSharedProfile
                        ? sharedDefaults.securityNotes ||
                          formContent.inheritance.noSharedSecurity
                        : ""
                    }
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
                  placeholder={
                    hasSharedProfile
                      ? sharedDefaults.ethicsNotes || formContent.inheritance.noSharedEthics
                      : ""
                  }
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
                      <SelectItem key={ring.id} value={String(ring.order)} className="p-3 font-bold">
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
                  value={formData.origin || (hasSharedProfile ? INHERIT_SELECT_VALUE : "European")}
                  onValueChange={handleOriginChange}
                >
                  <SelectTrigger className="h-14 rounded-xl border-2 border-transparent bg-secondary/30 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {hasSharedProfile ? (
                      <SelectItem value={INHERIT_SELECT_VALUE} className="p-3 font-bold">
                        {formContent.inheritance.followSharedProfile} ({getOriginLabel(sharedDefaults.origin)})
                      </SelectItem>
                    ) : null}
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
                <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-50">
                  <Layers3 className="h-4 w-4" />
                  {formContent.fields.provider}
                </Label>
                <Select
                  value={formData.providerId || NONE_SELECT_VALUE}
                  onValueChange={handleProviderChange}
                >
                  <SelectTrigger className="h-14 rounded-xl border-2 border-transparent bg-secondary/30 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value={NONE_SELECT_VALUE} className="p-3 font-bold">
                      {formContent.inheritance.providerNone}
                    </SelectItem>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id} className="p-3">
                        <span className="flex flex-col">
                          <span className="font-bold">{provider.name}</span>
                          {provider.description ? (
                            <span className="text-xs font-medium text-muted-foreground">
                              {provider.description}
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
                  {formContent.fields.family}
                </Label>
                <Select
                  value={formData.familyId || NONE_SELECT_VALUE}
                  onValueChange={handleFamilyChange}
                >
                  <SelectTrigger className="h-14 rounded-xl border-2 border-transparent bg-secondary/30 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value={NONE_SELECT_VALUE} className="p-3 font-bold">
                      {formContent.inheritance.familyNone}
                    </SelectItem>
                    {filteredFamilies.map((family) => (
                      <SelectItem key={family.id} value={family.id} className="p-3">
                        <span className="flex flex-col">
                          <span className="font-bold">{family.name}</span>
                          {family.description ? (
                            <span className="text-xs font-medium text-muted-foreground">
                              {family.description}
                            </span>
                          ) : null}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasSharedProfile ? (
                  <p className="text-xs font-medium text-muted-foreground">
                    {formatTemplate(formContent.inheritance.governanceFrom, {
                      label: sharedProfileLabel,
                    })}
                  </p>
                ) : null}
              </div>

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
