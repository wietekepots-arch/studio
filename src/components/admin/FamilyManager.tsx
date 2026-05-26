"use client";

import React, { useEffect, useMemo, useState } from "react";
import { doc, setDoc, type Firestore } from "firebase/firestore";
import { PlusCircle, Save } from "lucide-react";
import {
  Origin,
  RadarFamily,
  RadarProvider,
  RadarSecurityReference,
} from "@/app/lib/radar-types";
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

const NONE_VALUE = "__none__";

interface FamilyManagerProps {
  db: Firestore;
  providers: RadarProvider[];
  families: RadarFamily[];
}

interface FamilyDraft {
  id: string;
  providerId: string;
  name: string;
  order: string;
  description: string;
  origin: Origin | "";
  sustainabilityNotes: string;
  securityNotes: string;
  securityCertifications: string;
  ethicsNotes: string;
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function serializeSecurityReferences(
  references?: RadarSecurityReference[],
): string {
  if (!references?.length) {
    return "";
  }

  return references
    .map((reference) =>
      [reference.label, reference.url || "", reference.details || ""].join(" | "),
    )
    .join("\n");
}

function parseSecurityReferences(
  value: string,
): RadarSecurityReference[] | undefined {
  const references = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label = "", url = "", details = ""] = line
        .split("|")
        .map((part) => part.trim());

      if (!label) {
        return null;
      }

      return {
        label,
        ...(url ? { url } : {}),
        ...(details ? { details } : {}),
      };
    })
    .filter((reference): reference is RadarSecurityReference => Boolean(reference));

  return references.length ? references : undefined;
}

function getFamilyDraft(
  family: RadarFamily | null | undefined,
  families: RadarFamily[],
): FamilyDraft {
  return {
    id: family?.id || "",
    providerId: family?.providerId || "",
    name: family?.name || "",
    order: String(family?.order ?? families.length),
    description: family?.description || "",
    origin: family?.origin || "",
    sustainabilityNotes: family?.sustainabilityNotes || "",
    securityNotes: family?.securityNotes || "",
    securityCertifications: serializeSecurityReferences(
      family?.securityCertifications,
    ),
    ethicsNotes: family?.ethicsNotes || "",
  };
}

export function FamilyManager({
  db,
  providers,
  families,
}: FamilyManagerProps): React.ReactElement {
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(families[0]?.id || null);
  const selectedFamily = families.find((item) => item.id === selectedId) || null;
  const [draft, setDraft] = useState<FamilyDraft>(() =>
    getFamilyDraft(selectedFamily, families),
  );
  const isEditing = Boolean(selectedFamily);
  const selectedProvider = useMemo(() => {
    return providers.find((item) => item.id === draft.providerId) || null;
  }, [draft.providerId, providers]);

  useEffect(() => {
    setDraft(getFamilyDraft(selectedFamily, families));
  }, [families, selectedFamily]);

  async function handleSave(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const name = draft.name.trim();
    const id = (draft.id.trim() || toSlug(name)).trim();

    if (!name || !id || !draft.providerId) {
      toast({
        title: "Family details required",
        description: "Family name, id, and provider are required.",
        variant: "destructive",
      });
      return;
    }

    const payload: RadarFamily = {
      id,
      providerId: draft.providerId,
      providerName: selectedProvider?.name,
      name,
      order: Number(draft.order) || 0,
      ...(draft.description.trim()
        ? { description: draft.description.trim() }
        : {}),
      ...(draft.origin ? { origin: draft.origin } : {}),
      ...(draft.sustainabilityNotes.trim()
        ? { sustainabilityNotes: draft.sustainabilityNotes.trim() }
        : {}),
      ...(draft.securityNotes.trim()
        ? { securityNotes: draft.securityNotes.trim() }
        : {}),
      ...(parseSecurityReferences(draft.securityCertifications)
        ? {
            securityCertifications: parseSecurityReferences(
              draft.securityCertifications,
            ),
          }
        : {}),
      ...(draft.ethicsNotes.trim()
        ? { ethicsNotes: draft.ethicsNotes.trim() }
        : {}),
    };

    try {
      await setDoc(doc(db, "radarFamilies", id), payload);
      setSelectedId(id);
      toast({
        title: isEditing ? "Family updated" : "Family created",
        description: `${name} now resolves defaults through ${selectedProvider?.name || "its provider"}.`,
      });
    } catch {
      toast({
        title: "Save failed",
        description: "The family profile could not be stored.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="border-none bg-white shadow-xl shadow-primary/5">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-2xl font-black tracking-tight">
            Families
          </CardTitle>
          <p className="text-sm font-medium text-muted-foreground">
            Model lines like GPT or Claude. Blank fields inherit from the provider.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={() => setSelectedId(null)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Family
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          {families.map((family) => (
            <button
              key={family.id}
              type="button"
              className={`w-full rounded-[1.5rem] border p-4 text-left transition-all ${
                selectedId === family.id
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/60 bg-secondary/20 hover:border-primary/20"
              }`}
              onClick={() => setSelectedId(family.id)}
            >
              <div className="text-lg font-black tracking-tight">{family.name}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {family.providerName || family.providerId}
              </div>
            </button>
          ))}
        </div>
        <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="family-id">Id</Label>
            <Input
              id="family-id"
              value={draft.id}
              onChange={(event) =>
                setDraft((current) => ({ ...current, id: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select
              value={draft.providerId || NONE_VALUE}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  providerId: value === NONE_VALUE ? "" : value,
                }))
              }
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Select provider</SelectItem>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="family-name">Name</Label>
            <Input
              id="family-name"
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="family-order">Order</Label>
            <Input
              id="family-order"
              type="number"
              value={draft.order}
              onChange={(event) =>
                setDraft((current) => ({ ...current, order: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="family-description">Description</Label>
            <Textarea
              id="family-description"
              value={draft.description}
              className="min-h-24"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Origin Override</Label>
            <Select
              value={draft.origin || NONE_VALUE}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  origin:
                    value === "European" || value === "American" || value === "Other"
                      ? value
                      : "",
                }))
              }
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>
                  Inherit {selectedProvider?.origin || "provider origin"}
                </SelectItem>
                <SelectItem value="European">European</SelectItem>
                <SelectItem value="American">American</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 rounded-[1.5rem] border border-dashed border-border p-4 text-sm font-medium text-muted-foreground">
            Provider defaults: {selectedProvider?.name || "Pick a provider first"}.
            Blank notes below inherit from the provider profile.
          </div>
          <div className="space-y-2">
            <Label htmlFor="family-sustainability">Sustainability Override</Label>
            <Textarea
              id="family-sustainability"
              value={draft.sustainabilityNotes}
              placeholder={selectedProvider?.sustainabilityNotes || ""}
              className="min-h-28"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  sustainabilityNotes: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="family-security">Security Override</Label>
            <Textarea
              id="family-security"
              value={draft.securityNotes}
              placeholder={selectedProvider?.securityNotes || ""}
              className="min-h-28"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  securityNotes: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="family-security-certifications">
              Security Certifications Override
            </Label>
            <Textarea
              id="family-security-certifications"
              value={draft.securityCertifications}
              placeholder={serializeSecurityReferences(
                selectedProvider?.securityCertifications,
              )}
              className="min-h-28"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  securityCertifications: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="family-ethics">Ethics Override</Label>
            <Textarea
              id="family-ethics"
              value={draft.ethicsNotes}
              placeholder={selectedProvider?.ethicsNotes || ""}
              className="min-h-28"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  ethicsNotes: event.target.value,
                }))
              }
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" className="rounded-full px-6">
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? "Save Family" : "Create Family"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
