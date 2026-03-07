"use client";

import React, { useEffect, useState } from "react";
import { doc, setDoc, type Firestore } from "firebase/firestore";
import { PlusCircle, Save } from "lucide-react";
import {
  Origin,
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

interface ProviderManagerProps {
  db: Firestore;
  providers: RadarProvider[];
}

interface ProviderDraft {
  id: string;
  name: string;
  order: string;
  description: string;
  website: string;
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

function getProviderDraft(
  provider: RadarProvider | null | undefined,
  providers: RadarProvider[],
): ProviderDraft {
  return {
    id: provider?.id || "",
    name: provider?.name || "",
    order: String(provider?.order ?? providers.length),
    description: provider?.description || "",
    website: provider?.website || "",
    origin: provider?.origin || "",
    sustainabilityNotes: provider?.sustainabilityNotes || "",
    securityNotes: provider?.securityNotes || "",
    securityCertifications: serializeSecurityReferences(
      provider?.securityCertifications,
    ),
    ethicsNotes: provider?.ethicsNotes || "",
  };
}

export function ProviderManager({
  db,
  providers,
}: ProviderManagerProps): React.ReactElement {
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(providers[0]?.id || null);
  const selectedProvider =
    providers.find((item) => item.id === selectedId) || null;
  const [draft, setDraft] = useState<ProviderDraft>(() =>
    getProviderDraft(selectedProvider, providers),
  );
  const isEditing = Boolean(selectedProvider);

  useEffect(() => {
    setDraft(getProviderDraft(selectedProvider, providers));
  }, [providers, selectedProvider]);

  async function handleSave(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const name = draft.name.trim();
    const id = (draft.id.trim() || toSlug(name)).trim();

    if (!name || !id) {
      toast({
        title: "Provider details required",
        description: "Name and a valid id are required.",
        variant: "destructive",
      });
      return;
    }

    const payload: RadarProvider = {
      id,
      name,
      order: Number(draft.order) || 0,
      ...(draft.description.trim()
        ? { description: draft.description.trim() }
        : {}),
      ...(draft.website.trim() ? { website: draft.website.trim() } : {}),
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
      await setDoc(doc(db, "radarProviders", id), payload);
      setSelectedId(id);
      toast({
        title: isEditing ? "Provider updated" : "Provider created",
        description: `${name} is ready for family and blip inheritance.`,
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "The provider profile could not be stored.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="border-none bg-white shadow-xl shadow-primary/5">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-2xl font-black tracking-tight">
            Providers
          </CardTitle>
          <p className="text-sm font-medium text-muted-foreground">
            Shared defaults for vendors like OpenAI or Anthropic.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={() => setSelectedId(null)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Provider
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          {providers.map((provider) => (
            <button
              key={provider.id}
              type="button"
              className={`w-full rounded-[1.5rem] border p-4 text-left transition-all ${
                selectedId === provider.id
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/60 bg-secondary/20 hover:border-primary/20"
              }`}
              onClick={() => setSelectedId(provider.id)}
            >
              <div className="text-lg font-black tracking-tight">{provider.name}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Order {provider.order}
              </div>
            </button>
          ))}
        </div>
        <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="provider-id">Id</Label>
            <Input
              id="provider-id"
              value={draft.id}
              onChange={(event) =>
                setDraft((current) => ({ ...current, id: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider-name">Name</Label>
            <Input
              id="provider-name"
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider-order">Order</Label>
            <Input
              id="provider-order"
              type="number"
              value={draft.order}
              onChange={(event) =>
                setDraft((current) => ({ ...current, order: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider-website">Website</Label>
            <Input
              id="provider-website"
              value={draft.website}
              onChange={(event) =>
                setDraft((current) => ({ ...current, website: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="provider-description">Description</Label>
            <Textarea
              id="provider-description"
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
            <Label>Origin</Label>
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
                <SelectItem value={NONE_VALUE}>No default origin</SelectItem>
                <SelectItem value="European">European</SelectItem>
                <SelectItem value="American">American</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2" />
          <div className="space-y-2">
            <Label htmlFor="provider-sustainability">Sustainability</Label>
            <Textarea
              id="provider-sustainability"
              value={draft.sustainabilityNotes}
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
            <Label htmlFor="provider-security">Security</Label>
            <Textarea
              id="provider-security"
              value={draft.securityNotes}
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
            <Label htmlFor="provider-security-certifications">
              Security Certifications
            </Label>
            <Textarea
              id="provider-security-certifications"
              value={draft.securityCertifications}
              className="min-h-28"
              placeholder="ISO 27001 | https://example.com | Optional note"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  securityCertifications: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="provider-ethics">Ethics</Label>
            <Textarea
              id="provider-ethics"
              value={draft.ethicsNotes}
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
              {isEditing ? "Save Provider" : "Create Provider"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
