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
  Layers3,
  Leaf,
  PlusCircle,
  Save,
  Scale,
  Shield,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { aiBlipCategorization } from "@/ai/flows/ai-blip-categorization-flow";
import { aiBlipPrefill } from "@/ai/flows/ai-blip-prefill-flow";
import { aiBlipShortDescriptionDrafting } from "@/ai/flows/ai-short-description-drafting";
import {
  type Blip,
  type RadarEntityType,
  type RadarFamily,
  type RadarModelEntry,
  type RadarProvider,
  type RadarSecurityReference,
} from "@/app/lib/radar-types";
import { useAppUser } from "@/components/app/AppUserProvider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  BLIP_HISTORY_COLLECTION,
  RADAR_BLIPS_COLLECTION,
  buildRadarConfig,
  canEditBlip,
  getNextBlipStatus,
  isBlipEditResubmission,
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
import formContent from "@/content/pages/blip-form.json";

interface RadarBlipFormProps {
  initialBlip?: Blip | null;
}

const NONE_SELECT_VALUE = "__none__";
const INHERIT_SELECT_VALUE = "__inherit__";
const DEFAULT_ENTITY_TYPE: RadarEntityType = "product";

interface SecurityCertificationDraft {
  label: string;
  url: string;
  details: string;
}

interface ModelBenchmarkDraft {
  label: string;
  url: string;
}

interface ModelEntryDraft {
  name: string;
  familyId: string;
  summary: string;
  vendorLink: string;
  benchmarkLinks: ModelBenchmarkDraft[];
}

interface RadarBlipFormState {
  name: string;
  shortDesc: string;
  notes: string;
  entityType: RadarEntityType;
  availabilitySummary: string;
  accessNotes: string;
  accessRequestUrl: string;
  pricingSummary: string;
  pricingUrl: string;
  quadrantId: string;
  ringId: string;
  providerId: string;
  familyId: string;
  team: string;
  origin: Blip["origin"] | "";
  sustainabilityNotes: string;
  securityNotes: string;
  securityCertifications: SecurityCertificationDraft[];
  ethicsNotes: string;
  modelEntries: ModelEntryDraft[];
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

function trimToUndefined(value: string): string | undefined {
  const trimmed = value.trim();

  return trimmed ? trimmed : undefined;
}

function getOriginLabel(origin: Blip["origin"]): string {
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

function getDefaultEntityType(blip?: Blip | null): RadarEntityType {
  if (blip?.entityType) {
    return blip.entityType;
  }

  if (blip?.modelEntries?.length) {
    return "provider";
  }

  return DEFAULT_ENTITY_TYPE;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeTags(tags: string[]): string[] {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

function toSecurityCertificationDrafts(
  references?: RadarSecurityReference[],
): SecurityCertificationDraft[] {
  if (!references?.length) {
    return [];
  }

  return references.map((reference) => ({
    label: reference.label || "",
    url: reference.url || "",
    details: reference.details || "",
  }));
}

function toModelEntryDrafts(entries?: RadarModelEntry[]): ModelEntryDraft[] {
  if (!entries?.length) {
    return [];
  }

  return entries.map((entry) => ({
    name: entry.name || "",
    familyId: entry.familyId || "",
    summary: entry.summary || "",
    vendorLink: entry.vendorLink || "",
    benchmarkLinks:
      entry.benchmarkLinks?.map((link) => ({
        label: link.label || "",
        url: link.url || "",
      })) || [],
  }));
}

function toSecurityCertifications(
  drafts: SecurityCertificationDraft[],
): RadarSecurityReference[] | undefined {
  const nextDrafts = drafts
    .map((draft) => ({
      label: draft.label.trim(),
      url: trimToUndefined(draft.url),
      details: trimToUndefined(draft.details),
    }))
    .filter((draft) => draft.label);

  if (!nextDrafts.length) {
    return undefined;
  }

  return nextDrafts.map((draft) => ({
    label: draft.label,
    ...(draft.url && isValidHttpUrl(draft.url) ? { url: draft.url } : {}),
    ...(draft.details ? { details: draft.details } : {}),
  }));
}

function toModelEntries(
  drafts: ModelEntryDraft[],
): RadarModelEntry[] | undefined {
  const nextEntries = drafts
    .map((draft) => {
      const name = draft.name.trim();
      const summary = draft.summary.trim();
      const vendorLink = trimToUndefined(draft.vendorLink);
      const benchmarkLinks = draft.benchmarkLinks
        .map((benchmark) => ({
          label: benchmark.label.trim(),
          url: benchmark.url.trim(),
        }))
        .filter(
          (benchmark) => benchmark.label && benchmark.url && isValidHttpUrl(benchmark.url),
        );

      if (!name || !summary) {
        return null;
      }

      return {
        name,
        ...(draft.familyId ? { familyId: draft.familyId } : {}),
        summary,
        ...(vendorLink && isValidHttpUrl(vendorLink) ? { vendorLink } : {}),
        ...(benchmarkLinks.length ? { benchmarkLinks } : {}),
      };
    })
    .filter((entry): entry is RadarModelEntry => Boolean(entry));

  if (!nextEntries.length) {
    return undefined;
  }

  return nextEntries;
}

function hasModelEntryWithoutOutboundLink(drafts: ModelEntryDraft[]): boolean {
  return drafts.some((draft) => {
    const hasContent = draft.name.trim() || draft.summary.trim();

    if (!hasContent) {
      return false;
    }

    const hasVendorLink = Boolean(
      draft.vendorLink.trim() && isValidHttpUrl(draft.vendorLink.trim()),
    );
    const hasBenchmarkLink = draft.benchmarkLinks.some(
      (benchmark) =>
        benchmark.label.trim() &&
        benchmark.url.trim() &&
        isValidHttpUrl(benchmark.url.trim()),
    );

    return !hasVendorLink && !hasBenchmarkLink;
  });
}

function getFormState(blip?: Blip | null): RadarBlipFormState {
  const usesSharedProfile = Boolean(blip?.providerId || blip?.familyId);

  return {
    name: blip?.name || "",
    shortDesc: blip?.shortDesc || "",
    notes: blip?.notes || "",
    entityType: getDefaultEntityType(blip),
    availabilitySummary: blip?.availabilitySummary || "",
    accessNotes: blip?.accessNotes || "",
    accessRequestUrl: blip?.accessRequestUrl || "",
    pricingSummary: blip?.pricingSummary || "",
    pricingUrl: blip?.pricingUrl || "",
    quadrantId: String(blip?.quadrantId ?? 0),
    ringId: String(blip?.ringId ?? 2),
    providerId: blip?.providerId || "",
    familyId: blip?.familyId || "",
    team: blip?.team || "",
    origin:
      blip?.originOverride || (usesSharedProfile ? "" : blip?.origin || "European"),
    sustainabilityNotes:
      blip?.sustainabilityNotesOverride ||
      (usesSharedProfile ? "" : blip?.sustainabilityNotes || ""),
    securityNotes:
      blip?.securityNotesOverride ||
      (usesSharedProfile ? "" : blip?.securityNotes || ""),
    securityCertifications: toSecurityCertificationDrafts(
      blip?.securityCertifications,
    ),
    ethicsNotes:
      blip?.ethicsNotesOverride ||
      (usesSharedProfile ? "" : blip?.ethicsNotes || ""),
    modelEntries: toModelEntryDrafts(blip?.modelEntries),
    tags: blip?.tags?.join(", ") || "",
    primaryLink: blip?.links?.[0] || "",
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

function setOptionalJsonUpdateField(
  payload: UpdateData<DocumentData>,
  field: string,
  value: unknown,
  existingValue: unknown,
): void {
  if (typeof value !== "undefined") {
    payload[field] = value;
    return;
  }

  if (typeof existingValue !== "undefined") {
    payload[field] = deleteField();
  }
}

export function RadarBlipForm({
  initialBlip,
}: RadarBlipFormProps): React.ReactElement {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { authUser, hasCompanyAccess, profile, role } = useAppUser();
  const [formData, setFormData] = useState<RadarBlipFormState>(() =>
    getFormState(initialBlip),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiNeedsVerification, setAiNeedsVerification] = useState<string[]>([]);

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
  const isEditMode = Boolean(initialBlip);
  const isProviderBlip = formData.entityType === "provider";
  const isResubmittingForReview = authUser
    ? isBlipEditResubmission(initialBlip, authUser.uid, role)
    : false;
  const submitLabel = isEditMode
    ? isResubmittingForReview
      ? formContent.edit.resubmitButton
      : formContent.edit.submitButton
    : formContent.create.submitButton;
  const helperText = !isEditMode
    ? formContent.create.description
    : initialBlip?.status === "Approved" && isResubmittingForReview
      ? formContent.edit.approvedResubmitDescription
      : isResubmittingForReview
        ? formContent.edit.resubmitDescription
        : formContent.edit.description;

  useEffect(() => {
    setFormData(getFormState(initialBlip));
    setAiNeedsVerification([]);
  }, [initialBlip]);

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

  function updateSecurityCertification(
    index: number,
    field: keyof SecurityCertificationDraft,
    value: string,
  ): void {
    setFormData((currentState) => ({
      ...currentState,
      securityCertifications: currentState.securityCertifications.map(
        (certification, certificationIndex) =>
          certificationIndex === index
            ? { ...certification, [field]: value }
            : certification,
      ),
    }));
  }

  function addSecurityCertification(): void {
    setFormData((currentState) => ({
      ...currentState,
      securityCertifications: [
        ...currentState.securityCertifications,
        { label: "", url: "", details: "" },
      ],
    }));
  }

  function removeSecurityCertification(index: number): void {
    setFormData((currentState) => ({
      ...currentState,
      securityCertifications: currentState.securityCertifications.filter(
        (_, certificationIndex) => certificationIndex !== index,
      ),
    }));
  }

  function updateModelEntry(
    index: number,
    field: keyof Omit<ModelEntryDraft, "benchmarkLinks">,
    value: string,
  ): void {
    setFormData((currentState) => ({
      ...currentState,
      modelEntries: currentState.modelEntries.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }));
  }

  function addModelEntry(): void {
    setFormData((currentState) => ({
      ...currentState,
      modelEntries: [
        ...currentState.modelEntries,
        {
          name: "",
          familyId: "",
          summary: "",
          vendorLink: "",
          benchmarkLinks: [],
        },
      ],
    }));
  }

  function removeModelEntry(index: number): void {
    setFormData((currentState) => ({
      ...currentState,
      modelEntries: currentState.modelEntries.filter(
        (_, entryIndex) => entryIndex !== index,
      ),
    }));
  }

  function addBenchmark(modelIndex: number): void {
    setFormData((currentState) => ({
      ...currentState,
      modelEntries: currentState.modelEntries.map((entry, entryIndex) =>
        entryIndex === modelIndex
          ? {
              ...entry,
              benchmarkLinks: [
                ...entry.benchmarkLinks,
                { label: "", url: "" },
              ],
            }
          : entry,
      ),
    }));
  }

  function updateBenchmark(
    modelIndex: number,
    benchmarkIndex: number,
    field: keyof ModelBenchmarkDraft,
    value: string,
  ): void {
    setFormData((currentState) => ({
      ...currentState,
      modelEntries: currentState.modelEntries.map((entry, entryIndex) =>
        entryIndex === modelIndex
          ? {
              ...entry,
              benchmarkLinks: entry.benchmarkLinks.map((benchmark, currentIndex) =>
                currentIndex === benchmarkIndex
                  ? { ...benchmark, [field]: value }
                  : benchmark,
              ),
            }
          : entry,
      ),
    }));
  }

  function removeBenchmark(modelIndex: number, benchmarkIndex: number): void {
    setFormData((currentState) => ({
      ...currentState,
      modelEntries: currentState.modelEntries.map((entry, entryIndex) =>
        entryIndex === modelIndex
          ? {
              ...entry,
              benchmarkLinks: entry.benchmarkLinks.filter(
                (_, currentIndex) => currentIndex !== benchmarkIndex,
              ),
            }
          : entry,
      ),
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
      const result = await aiBlipCategorization({
        blipName: formData.name,
        blipDescription: formData.notes,
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

  async function handleAiPrefill(): Promise<void> {
    if (!formData.name.trim() || (!formData.notes.trim() && !formData.primaryLink.trim())) {
      toast({
        title: formContent.toasts.missingContextPrefill.title,
        description: formContent.toasts.missingContextPrefill.description,
        variant: "destructive",
      });
      return;
    }

    setIsAiLoading(true);

    try {
      const result = await aiBlipPrefill({
        blipName: formData.name.trim(),
        existingNotes: trimToUndefined(formData.notes),
        primaryLink: trimToUndefined(formData.primaryLink),
        entityType: formData.entityType,
        providerName: selectedProvider?.name,
        familyName: selectedFamily?.name,
        availableTags,
      });

      setFormData((currentState) => ({
        ...currentState,
        shortDesc: result.shortDescription || currentState.shortDesc,
        notes: result.notes || currentState.notes,
        securityNotes: result.securityNotes || currentState.securityNotes,
        securityCertifications: result.securityCertifications.length
          ? result.securityCertifications.map((label) => ({
              label,
              url: "",
              details: "",
            }))
          : currentState.securityCertifications,
        origin: result.origin || currentState.origin,
        pricingSummary: result.pricingSummary || currentState.pricingSummary,
        tags: result.tags.length ? result.tags.join(", ") : currentState.tags,
        modelEntries:
          formData.entityType === "provider" && result.modelEntries.length
            ? result.modelEntries.map((entry) => ({
                name: entry.name,
                familyId: "",
                summary: entry.summary,
                vendorLink: entry.vendorLink || "",
                benchmarkLinks:
                  entry.benchmarkLinks?.map((link) => ({
                    label: link.label,
                    url: link.url,
                  })) || [],
              }))
            : currentState.modelEntries,
      }));
      setAiNeedsVerification(result.needsVerification);
      toast({
        title: formContent.toasts.aiPrefillReady.title,
        description: formContent.toasts.aiPrefillReady.description,
      });
    } catch {
      toast({
        title: formContent.toasts.aiPrefillFailed.title,
        description: formContent.toasts.aiPrefillFailed.description,
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
      const result = await aiBlipShortDescriptionDrafting({
        detailedNotes: formData.notes,
        links: formData.primaryLink ? [formData.primaryLink] : [],
      });

      setFormData((currentState) => ({
        ...currentState,
        shortDesc: result.shortDescription,
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

    if (initialBlip && !canEditBlip(initialBlip, authUser.uid, role)) {
      toast({
        title: formContent.toasts.editingNotAllowed.title,
        description: formContent.toasts.editingNotAllowed.description,
        variant: "destructive",
      });
      return;
    }

    if (isProviderBlip && hasModelEntryWithoutOutboundLink(formData.modelEntries)) {
      toast({
        title: formContent.toasts.modelEntriesInvalid.title,
        description: formContent.toasts.modelEntriesInvalid.description,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const now = Date.now();
    const nextStatus = getNextBlipStatus(initialBlip, authUser.uid, role);
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
    const availabilitySummary = trimToUndefined(formData.availabilitySummary);
    const accessNotes = trimToUndefined(formData.accessNotes);
    const accessRequestUrl = trimToUndefined(formData.accessRequestUrl);
    const pricingSummary = trimToUndefined(formData.pricingSummary);
    const pricingUrl = trimToUndefined(formData.pricingUrl);
    const primaryLink = trimToUndefined(formData.primaryLink);
    const securityCertifications = toSecurityCertifications(
      formData.securityCertifications,
    );
    const modelEntries = isProviderBlip ? toModelEntries(formData.modelEntries) : undefined;
    const normalizedTags = normalizeTags(formData.tags.split(","));

    const basePayload: WithFieldValue<DocumentData> = {
      name: formData.name.trim(),
      shortDesc: formData.shortDesc.trim(),
      notes: formData.notes.trim(),
      entityType: formData.entityType,
      quadrantId: Number(formData.quadrantId),
      ringId: nextRingId,
      tags: normalizedTags,
      team: formData.team.trim(),
      ownerId: initialBlip?.ownerId || authUser.uid,
      ownerName: initialBlip?.ownerName || profile.displayName,
      origin: effectiveOrigin,
      sustainabilityNotes: effectiveSustainability,
      securityNotes: effectiveSecurity,
      ethicsNotes: effectiveEthics,
      links: primaryLink ? [primaryLink] : [],
      status: nextStatus,
      submittedAt:
        !initialBlip?.submittedAt || isResubmittingForReview
          ? now
          : initialBlip.submittedAt,
      submittedBy:
        !initialBlip?.submittedBy || isResubmittingForReview
          ? authUser.uid
          : initialBlip.submittedBy,
      lastReviewedAt: initialBlip?.lastReviewedAt || now,
      createdAt: initialBlip?.createdAt || now,
      createdBy: initialBlip?.createdBy || authUser.uid,
      updatedAt: now,
      updatedBy: authUser.uid,
      history: initialBlip?.history || [],
      ...(initialBlip?.pricingTiers ? { pricingTiers: initialBlip.pricingTiers } : {}),
      ...(initialBlip?.costRange ? { costRange: initialBlip.costRange } : {}),
      ...(availabilitySummary ? { availabilitySummary } : {}),
      ...(accessNotes ? { accessNotes } : {}),
      ...(accessRequestUrl ? { accessRequestUrl } : {}),
      ...(pricingSummary ? { pricingSummary } : {}),
      ...(pricingUrl ? { pricingUrl } : {}),
      ...(providerId ? { providerId } : {}),
      ...(providerName ? { providerName } : {}),
      ...(familyId ? { familyId } : {}),
      ...(familyName ? { familyName } : {}),
      ...(originOverride ? { originOverride } : {}),
      ...(sustainabilityOverride
        ? { sustainabilityNotesOverride: sustainabilityOverride }
        : {}),
      ...(securityOverride ? { securityNotesOverride: securityOverride } : {}),
      ...(securityCertifications ? { securityCertifications } : {}),
      ...(ethicsOverride ? { ethicsNotesOverride: ethicsOverride } : {}),
      ...(modelEntries ? { modelEntries } : {}),
    };

    try {
      if (initialBlip) {
        const payload: UpdateData<DocumentData> = { ...basePayload };

        if (initialBlip.ringId !== nextRingId) {
          payload.previousRingId = initialBlip.ringId;
        } else if (typeof initialBlip.previousRingId === "number") {
          payload.previousRingId = initialBlip.previousRingId;
        }

        setOptionalUpdateField(
          payload,
          "providerId",
          providerId || undefined,
          initialBlip.providerId,
        );
        setOptionalUpdateField(
          payload,
          "providerName",
          providerName,
          initialBlip.providerName,
        );
        setOptionalUpdateField(payload, "familyId", familyId, initialBlip.familyId);
        setOptionalUpdateField(
          payload,
          "familyName",
          familyName,
          initialBlip.familyName,
        );
        setOptionalUpdateField(
          payload,
          "originOverride",
          originOverride,
          initialBlip.originOverride,
        );
        setOptionalUpdateField(
          payload,
          "sustainabilityNotesOverride",
          sustainabilityOverride,
          initialBlip.sustainabilityNotesOverride,
        );
        setOptionalUpdateField(
          payload,
          "securityNotesOverride",
          securityOverride,
          initialBlip.securityNotesOverride,
        );
        setOptionalUpdateField(
          payload,
          "ethicsNotesOverride",
          ethicsOverride,
          initialBlip.ethicsNotesOverride,
        );
        setOptionalUpdateField(
          payload,
          "availabilitySummary",
          availabilitySummary,
          initialBlip.availabilitySummary,
        );
        setOptionalUpdateField(
          payload,
          "accessNotes",
          accessNotes,
          initialBlip.accessNotes,
        );
        setOptionalUpdateField(
          payload,
          "accessRequestUrl",
          accessRequestUrl,
          initialBlip.accessRequestUrl,
        );
        setOptionalUpdateField(
          payload,
          "pricingSummary",
          pricingSummary,
          initialBlip.pricingSummary,
        );
        setOptionalUpdateField(
          payload,
          "pricingUrl",
          pricingUrl,
          initialBlip.pricingUrl,
        );
        setOptionalJsonUpdateField(
          payload,
          "securityCertifications",
          securityCertifications,
          initialBlip.securityCertifications,
        );
        setOptionalJsonUpdateField(
          payload,
          "modelEntries",
          modelEntries,
          initialBlip.modelEntries,
        );

        if (isResubmittingForReview) {
          payload.reviewComment = "";
          payload.reviewedAt = deleteField();
          payload.reviewedBy = deleteField();
        } else {
          if (initialBlip.reviewComment) {
            payload.reviewComment = initialBlip.reviewComment;
          }
          if (typeof initialBlip.reviewedAt === "number") {
            payload.reviewedAt = initialBlip.reviewedAt;
          }
          if (initialBlip.reviewedBy) {
            payload.reviewedBy = initialBlip.reviewedBy;
          }
        }

        await updateDoc(doc(db, RADAR_BLIPS_COLLECTION, initialBlip.id), payload);
        await addDoc(
          collection(
            db,
            RADAR_BLIPS_COLLECTION,
            initialBlip.id,
            BLIP_HISTORY_COLLECTION,
          ),
          {
            blipId: initialBlip.id,
            itemId: initialBlip.id,
            action: isResubmittingForReview
              ? formContent.history.resubmitted
              : formContent.history.updated,
            note: isResubmittingForReview
              ? initialBlip.status === "Approved"
                ? formContent.history.resubmittedApprovedNote
                : formContent.history.resubmittedNote
              : formContent.history.updatedNote,
            before: initialBlip.status,
            after: nextStatus,
            createdAt: now,
            createdBy: authUser.uid,
          },
        );
        toast({
          title: isResubmittingForReview
            ? formContent.toasts.blipResubmitted.title
            : formContent.toasts.changesSaved.title,
          description: isResubmittingForReview
            ? formContent.toasts.blipResubmitted.description
            : formContent.toasts.changesSaved.description,
        });
        router.push(`/blips/${initialBlip.id}`);
      } else {
        const documentReference = await addDoc(
          collection(db, RADAR_BLIPS_COLLECTION),
          basePayload,
        );
        await addDoc(
          collection(
            db,
            RADAR_BLIPS_COLLECTION,
            documentReference.id,
            BLIP_HISTORY_COLLECTION,
          ),
          {
            blipId: documentReference.id,
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
          <Link href={initialBlip ? `/blips/${initialBlip.id}` : "/dashboard"}>
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
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Label htmlFor="notes" className="font-bold text-sm text-foreground/70">
                    {formContent.fields.strategicContext}
                  </Label>
                  <div className="flex flex-wrap gap-2">
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 rounded-full font-bold text-primary hover:bg-primary/10"
                      onClick={handleAiPrefill}
                      disabled={isAiLoading}
                    >
                      <Sparkles className="h-4 w-4" />
                      {formContent.ai.prefill}
                    </Button>
                  </div>
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
                <div className="flex flex-wrap items-center justify-between gap-3">
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
                  maxLength={160}
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

              {aiNeedsVerification.length ? (
                <div className="rounded-[2rem] border border-amber-200 bg-amber-50 px-6 py-5 text-sm font-medium text-amber-900">
                  <div className="font-black">{formContent.fields.needsVerification}</div>
                  <div className="mt-2">
                    {aiNeedsVerification.join(", ")}.
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[3rem] border-none bg-secondary/20 shadow-none">
            <CardHeader className="p-10 pb-2">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                {formContent.sections.pricingSources}
              </div>
            </CardHeader>
            <CardContent className="space-y-8 p-10">
              <div className="space-y-3">
                <Label htmlFor="pricingSummary" className="font-bold text-sm text-foreground/70">
                  {formContent.fields.pricingSummary}
                </Label>
                <Textarea
                  id="pricingSummary"
                  value={formData.pricingSummary}
                  className="min-h-[120px] rounded-2xl border-2 border-border bg-white/50"
                  onChange={(event) =>
                    setFormData((currentState) => ({
                      ...currentState,
                      pricingSummary: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="pricingUrl" className="font-bold text-sm text-foreground/70">
                    {formContent.fields.pricingUrl}
                  </Label>
                  <Input
                    id="pricingUrl"
                    value={formData.pricingUrl}
                    className="h-14 rounded-2xl border-2 border-border bg-white/50"
                    onChange={(event) =>
                      setFormData((currentState) => ({
                        ...currentState,
                        pricingUrl: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="primaryLink" className="font-bold text-sm text-foreground/70">
                    {formContent.fields.primaryLink}
                  </Label>
                  <Input
                    id="primaryLink"
                    required
                    value={formData.primaryLink}
                    className="h-14 rounded-2xl border-2 border-border bg-white/50"
                    onChange={(event) =>
                      setFormData((currentState) => ({
                        ...currentState,
                        primaryLink: event.target.value,
                      }))
                    }
                  />
                </div>
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

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Label className="font-bold text-sm text-foreground/70">
                    {formContent.fields.securityCertifications}
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={addSecurityCertification}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {formContent.actions.addCertification}
                  </Button>
                </div>

                {formData.securityCertifications.length ? (
                  formData.securityCertifications.map((certification, index) => (
                    <div
                      key={`certification-${index}`}
                      className="rounded-[2rem] border border-border/60 bg-white p-5"
                    >
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div className="text-sm font-black tracking-tight">
                          {formContent.fields.securityCertificationLabel} {index + 1}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-full"
                          onClick={() => removeSecurityCertification(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Input
                          value={certification.label}
                          placeholder={formContent.fields.securityCertificationLabel}
                          onChange={(event) =>
                            updateSecurityCertification(
                              index,
                              "label",
                              event.target.value,
                            )
                          }
                        />
                        <Input
                          value={certification.url}
                          placeholder={formContent.fields.securityCertificationUrl}
                          onChange={(event) =>
                            updateSecurityCertification(
                              index,
                              "url",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                      <Textarea
                        value={certification.details}
                        placeholder={formContent.fields.securityCertificationDetails}
                        className="mt-4 h-24"
                        onChange={(event) =>
                          updateSecurityCertification(
                            index,
                            "details",
                            event.target.value,
                          )
                        }
                      />
                    </div>
                  ))
                ) : (
                  <div className="rounded-[2rem] border border-dashed border-border p-6 text-sm font-medium text-muted-foreground">
                    {formContent.emptyStates.noCertifications}
                  </div>
                )}
              </div>

              <Accordion type="single" collapsible className="rounded-[2rem] border bg-white px-6">
                <AccordionItem value="advanced-metadata" className="border-none">
                  <AccordionTrigger className="text-sm font-black tracking-tight">
                    {formContent.sections.secondaryMetadata}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-8 pb-4">
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
                          <Scale className="h-4 w-4 text-primary" />
                          {common.labels.ethics}
                        </Label>
                        <Textarea
                          value={formData.ethicsNotes}
                          placeholder={
                            hasSharedProfile
                              ? sharedDefaults.ethicsNotes ||
                                formContent.inheritance.noSharedEthics
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
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {isProviderBlip ? (
            <Card className="overflow-hidden rounded-[3rem] border-none bg-secondary/20 shadow-none">
              <CardHeader className="p-10 pb-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    {formContent.sections.modelsBenchmarks}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={addModelEntry}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {formContent.actions.addModel}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-10">
                {formData.modelEntries.length ? (
                  formData.modelEntries.map((entry, index) => (
                    <div
                      key={`model-entry-${index}`}
                      className="rounded-[2rem] border border-border/60 bg-white p-6"
                    >
                      <div className="mb-6 flex items-center justify-between gap-4">
                        <div className="text-lg font-black tracking-tight">
                          {formContent.fields.modelEntryLabel} {index + 1}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-full"
                          onClick={() => removeModelEntry(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                            {formContent.fields.modelName}
                          </Label>
                          <Input
                            value={entry.name}
                            onChange={(event) =>
                              updateModelEntry(index, "name", event.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                            {formContent.fields.modelFamily}
                          </Label>
                          <Select
                            value={entry.familyId || NONE_SELECT_VALUE}
                            onValueChange={(value) =>
                              updateModelEntry(
                                index,
                                "familyId",
                                value === NONE_SELECT_VALUE ? "" : value,
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE_SELECT_VALUE}>
                                {formContent.inheritance.familyNone}
                              </SelectItem>
                              {filteredFamilies.map((family) => (
                                <SelectItem key={family.id} value={family.id}>
                                  {family.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                          {formContent.fields.modelSummary}
                        </Label>
                        <Textarea
                          value={entry.summary}
                          className="min-h-[120px]"
                          onChange={(event) =>
                            updateModelEntry(index, "summary", event.target.value)
                          }
                        />
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                          {formContent.fields.modelVendorLink}
                        </Label>
                        <Input
                          value={entry.vendorLink}
                          onChange={(event) =>
                            updateModelEntry(index, "vendorLink", event.target.value)
                          }
                        />
                      </div>

                      <div className="mt-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-xs font-bold uppercase tracking-widest opacity-50">
                            {formContent.fields.benchmarkLinks}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => addBenchmark(index)}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {formContent.actions.addBenchmark}
                          </Button>
                        </div>

                        {entry.benchmarkLinks.length ? (
                          entry.benchmarkLinks.map((benchmark, benchmarkIndex) => (
                            <div
                              key={`benchmark-${index}-${benchmarkIndex}`}
                              className="rounded-[1.5rem] border border-border/60 p-4"
                            >
                              <div className="mb-3 flex items-center justify-between gap-4">
                                <div className="text-sm font-black tracking-tight">
                                  {formContent.fields.benchmarkLabel} {benchmarkIndex + 1}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full"
                                  onClick={() => removeBenchmark(index, benchmarkIndex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Input
                                  value={benchmark.label}
                                  placeholder={formContent.fields.benchmarkLabel}
                                  onChange={(event) =>
                                    updateBenchmark(
                                      index,
                                      benchmarkIndex,
                                      "label",
                                      event.target.value,
                                    )
                                  }
                                />
                                <Input
                                  value={benchmark.url}
                                  placeholder={formContent.fields.benchmarkUrl}
                                  onChange={(event) =>
                                    updateBenchmark(
                                      index,
                                      benchmarkIndex,
                                      "url",
                                      event.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-[1.5rem] border border-dashed border-border p-5 text-sm font-medium text-muted-foreground">
                            {formContent.emptyStates.noBenchmarks}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[2rem] border border-dashed border-border p-8 text-sm font-medium text-muted-foreground">
                    {formContent.emptyStates.noModels}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
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
                <Label className="text-xs font-bold uppercase tracking-widest opacity-50">
                  {formContent.fields.entityType}
                </Label>
                <Select
                  value={formData.entityType}
                  onValueChange={(value) =>
                    setFormData((currentState) => ({
                      ...currentState,
                      entityType: value as RadarEntityType,
                    }))
                  }
                >
                  <SelectTrigger className="h-14 rounded-xl border-2 border-transparent bg-secondary/30 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="provider">{formContent.entityTypes.provider}</SelectItem>
                    <SelectItem value="product">{formContent.entityTypes.product}</SelectItem>
                    <SelectItem value="workflow">{formContent.entityTypes.workflow}</SelectItem>
                    <SelectItem value="governance">{formContent.entityTypes.governance}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
