"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  DatabaseZap,
  Eye,
  Pencil,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { collection, query, where } from "firebase/firestore";
import { Navbar } from "@/components/layout/Navbar";
import { PageTitle } from "@/components/layout/PageTitle";
import { useAppUser } from "@/components/app/AppUserProvider";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import common from "@/content/common.json";
import dashboardContent from "@/content/pages/dashboard.json";
import { Blip, RadarConfigOption } from "@/app/lib/radar-types";
import {
  canEditBlip,
  getStatusBadgeVariant,
  mergeConfigOptions,
  reviewBlip,
  seedRadarCollections,
  sortBlips,
} from "@/lib/radar-firestore";
import { seedQuadrants, seedRings } from "@/lib/radar-seed";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function formatTemplate<T extends object>(template: string, values: T): string {
  return Object.entries(values as Record<string, unknown>).reduce(
    (result, [key, value]) => {
      return result.replaceAll(`{${key}}`, String(value));
    },
    template
  );
}

function getStatusLabel(status: Blip["status"]): string {
  switch (status) {
    case "Approved":
      return "Goedgekeurd";
    case "Pending":
      return "In review";
    case "Draft":
      return "Concept";
    case "Archived":
      return "Gearchiveerd";
    default:
      return status;
  }
}

export default function DashboardPage(): React.ReactElement {
  const db = useFirestore();
  const { toast } = useToast();
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [actionItemId, setActionItemId] = useState<string | null>(null);
  const { authUser, canReview, hasCompanyAccess, isLoading, profile, role } =
    useAppUser();

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
  const approvedBlipsQuery = useMemoFirebase(() => {
    if (!authUser || !hasCompanyAccess) {
      return null;
    }

    return query(
      collection(db, "radarItems"),
      where("status", "==", "Approved")
    );
  }, [authUser, db, hasCompanyAccess]);
  const ownBlipsQuery = useMemoFirebase(() => {
    if (!authUser || !hasCompanyAccess) {
      return null;
    }

    return query(
      collection(db, "radarItems"),
      where("createdBy", "==", authUser.uid)
    );
  }, [authUser, db, hasCompanyAccess]);
  const allBlipsQuery = useMemoFirebase(() => {
    if (!authUser || !canReview || !hasCompanyAccess) {
      return null;
    }

    return collection(db, "radarItems");
  }, [authUser, canReview, db, hasCompanyAccess]);
  const pendingBlipsQuery = useMemoFirebase(() => {
    if (!authUser || !canReview || !hasCompanyAccess) {
      return null;
    }

    return query(
      collection(db, "radarItems"),
      where("status", "==", "Pending")
    );
  }, [authUser, canReview, db, hasCompanyAccess]);

  const { data: quadrantDocs } =
    useCollection<RadarConfigOption>(quadrantsQuery);
  const { data: ringDocs } = useCollection<RadarConfigOption>(ringsQuery);
  const { data: approvedBlips, isLoading: isApprovedBlipsLoading } =
    useCollection<Blip>(approvedBlipsQuery);
  const { data: ownBlips, isLoading: isOwnBlipsLoading } =
    useCollection<Blip>(ownBlipsQuery);
  const { data: allBlips, isLoading: isAllBlipsLoading } =
    useCollection<Blip>(allBlipsQuery);
  const { data: pendingBlips, isLoading: isPendingBlipsLoading } =
    useCollection<Blip>(pendingBlipsQuery);

  const quadrants = mergeConfigOptions(quadrantDocs, seedQuadrants, true);
  const rings = mergeConfigOptions(ringDocs, seedRings);
  const quadrantMap = useMemo(() => {
    return new Map(quadrants.map((item) => [item.order, item.name]));
  }, [quadrants]);
  const ringMap = useMemo(() => {
    return new Map(rings.map((item) => [item.order, item.name]));
  }, [rings]);

  const mainBlips = useMemo(() => {
    if (canReview) {
      return sortBlips(allBlips);
    }

    const dedupedBlips = new Map<string, Blip>();

    for (const blip of approvedBlips || []) {
      dedupedBlips.set(blip.id, blip);
    }

    for (const blip of ownBlips || []) {
      dedupedBlips.set(blip.id, blip);
    }

    return sortBlips(Array.from(dedupedBlips.values()));
  }, [allBlips, approvedBlips, canReview, ownBlips]);

  const pendingCoworkerBlips = useMemo(() => {
    return sortBlips(
      (pendingBlips || []).filter((blip) => blip.createdBy !== authUser?.uid)
    );
  }, [authUser?.uid, pendingBlips]);

  const isAnyTableLoading =
    isLoading ||
    isApprovedBlipsLoading ||
    isOwnBlipsLoading ||
    isAllBlipsLoading ||
    isPendingBlipsLoading;
  const needsSeed =
    !quadrants.length ||
    !rings.length ||
    !(approvedBlips && approvedBlips.length);

  async function handleApprove(blip: Blip): Promise<void> {
    if (!profile) {
      return;
    }

    setActionItemId(blip.id);

    try {
      await reviewBlip(
        db,
        blip,
        profile,
        "Approved",
        reviewNotes[blip.id] || ""
      );
      toast({
        title: dashboardContent.toasts.approved.title,
        description: formatTemplate(
          dashboardContent.toasts.approved.description,
          {
            name: blip.name,
          }
        ),
      });
    } catch (error) {
      toast({
        title: dashboardContent.toasts.approvalFailed.title,
        description: dashboardContent.toasts.approvalFailed.description,
        variant: "destructive",
      });
    } finally {
      setActionItemId(null);
    }
  }

  async function handleReject(blip: Blip): Promise<void> {
    if (!profile) {
      return;
    }

    setActionItemId(blip.id);

    try {
      await reviewBlip(db, blip, profile, "Draft", reviewNotes[blip.id] || "");
      toast({
        title: dashboardContent.toasts.returnedToDraft.title,
        description: formatTemplate(
          dashboardContent.toasts.returnedToDraft.description,
          { name: blip.name }
        ),
      });
    } catch (error) {
      toast({
        title: dashboardContent.toasts.reviewFailed.title,
        description: dashboardContent.toasts.reviewFailed.description,
        variant: "destructive",
      });
    } finally {
      setActionItemId(null);
    }
  }

  async function handleSeed(): Promise<void> {
    if (!profile) {
      return;
    }

    setActionItemId("seed");

    try {
      const result = await seedRadarCollections(db, profile);
      toast({
        title: dashboardContent.toasts.seeded.title,
        description: formatTemplate(
          dashboardContent.toasts.seeded.description,
          result
        ),
      });
    } catch (error) {
      console.error("Failed to seed starter radar", error);
      toast({
        title: dashboardContent.toasts.seedFailed.title,
        description: getErrorMessage(
          error,
          dashboardContent.toasts.seedFailed.description
        ),
        variant: "destructive",
      });
    } finally {
      setActionItemId(null);
    }
  }

  async function handleResetSeed(): Promise<void> {
    if (!profile) {
      return;
    }

    if (
      typeof window !== "undefined" &&
      !window.confirm(dashboardContent.seed.confirmReset)
    ) {
      return;
    }

    setActionItemId("reset-seed");

    try {
      const result = await seedRadarCollections(db, profile, { reset: true });
      toast({
        title: dashboardContent.toasts.reset.title,
        description: formatTemplate(
          dashboardContent.toasts.reset.description,
          result
        ),
      });
    } catch (error) {
      console.error("Failed to reset starter radar", error);
      toast({
        title: dashboardContent.toasts.resetFailed.title,
        description: getErrorMessage(
          error,
          dashboardContent.toasts.resetFailed.description
        ),
        variant: "destructive",
      });
    } finally {
      setActionItemId(null);
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
              {dashboardContent.authError.description}
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

      <main className="container mx-auto max-w-7xl px-6 py-12">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <PageTitle
            label={dashboardContent.sectionLabel}
            title={dashboardContent.heading}
            highlight={dashboardContent.headingHighlight}
            description={dashboardContent.description}
            className="space-y-3"
            titleClassName="text-6xl"
            descriptionClassName="max-w-2xl text-lg"
          />

          {canReview ? (
            <div className="flex flex-col items-start gap-2 md:items-end">
              <div className="flex flex-wrap gap-2">
                <Button
                  className="h-14 gap-2 rounded-full px-8 font-bold"
                  onClick={handleSeed}
                  disabled={actionItemId === "seed" || actionItemId === "reset-seed"}
                  title={dashboardContent.seed.tooltip}
                >
                  <DatabaseZap className="h-5 w-5" />
                  {needsSeed
                    ? dashboardContent.seed.button
                    : dashboardContent.seed.reseedButton}
                </Button>
                {!needsSeed ? (
                  <Button
                    variant="outline"
                    className="h-14 gap-2 rounded-full px-8 font-bold"
                    onClick={handleResetSeed}
                    disabled={actionItemId === "seed" || actionItemId === "reset-seed"}
                    title={dashboardContent.seed.resetTooltip}
                  >
                    <XCircle className="h-5 w-5" />
                    {dashboardContent.seed.resetButton}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : needsSeed ? (
            <div className="flex flex-col items-start gap-2 md:items-end">
              <Button
                className="h-14 gap-2 rounded-full px-8 font-bold"
                onClick={handleSeed}
                disabled
                title={dashboardContent.seed.restrictedTooltip}
              >
                <DatabaseZap className="h-5 w-5" />
                {dashboardContent.seed.button}
              </Button>
              <p className="max-w-sm text-right text-sm font-medium text-muted-foreground">
                {formatTemplate(dashboardContent.seed.restrictedMessage, {
                  role: role || common.auth.memberFallback,
                })}
              </p>
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-none bg-secondary/20 shadow-none">
            <CardHeader>
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                {common.labels.role}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-black tracking-tight">
              {role}
            </CardContent>
          </Card>
          <Card className="border-none bg-secondary/20 shadow-none">
            <CardHeader>
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                {common.labels.visibleBlips}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-black tracking-tight">
              {mainBlips.length}
            </CardContent>
          </Card>
          <Card className="border-none bg-secondary/20 shadow-none">
            <CardHeader>
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                {common.labels.pendingCoworkerReview}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-black tracking-tight">
              {canReview ? pendingCoworkerBlips.length : 0}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-10 border-none bg-white shadow-xl shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">
                {canReview
                  ? dashboardContent.table.allBlips
                  : dashboardContent.table.yourDashboard}
              </CardTitle>
              <p className="text-sm font-medium text-muted-foreground">
                {canReview
                  ? dashboardContent.table.allBlipsDescription
                  : dashboardContent.table.yourDashboardDescription}
              </p>
            </div>
            <Button asChild className="rounded-full px-6 font-bold">
              <Link href="/blips/new">
                {dashboardContent.table.suggestBlip}
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isAnyTableLoading ? (
              <div className="py-12 text-center text-muted-foreground">
                {common.common.loadingDashboardData}
              </div>
            ) : mainBlips.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{dashboardContent.table.columns.blip}</TableHead>
                    <TableHead>
                      {dashboardContent.table.columns.status}
                    </TableHead>
                    <TableHead>
                      {dashboardContent.table.columns.quadrant}
                    </TableHead>
                    <TableHead>{dashboardContent.table.columns.ring}</TableHead>
                    <TableHead>
                      {dashboardContent.table.columns.updated}
                    </TableHead>
                    <TableHead className="text-right">
                      {dashboardContent.table.columns.actions}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mainBlips.map((blip) => (
                    <TableRow key={blip.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold">{blip.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {blip.team}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(blip.status)}>
                          {getStatusLabel(blip.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {quadrantMap.get(blip.quadrantId) ||
                          common.common.unassigned}
                      </TableCell>
                      <TableCell>
                        {ringMap.get(blip.ringId) || common.common.unassigned}
                      </TableCell>
                      <TableCell>
                        {new Date(blip.updatedAt).toLocaleDateString("nl-NL")}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/blips/${blip.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              {common.common.view}
                            </Link>
                          </Button>
                          {canEditBlip(blip, authUser.uid, role) ? (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/blips/${blip.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                {common.common.edit}
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <ClipboardList className="mx-auto mb-4 h-10 w-10 text-primary" />
                <div className="text-xl font-black">
                  {dashboardContent.emptyState.heading}
                </div>
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  {dashboardContent.emptyState.description}
                </p>
                {!canReview ? (
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    {dashboardContent.emptyState.seedRestricted}
                  </p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        {canReview ? (
          <Card className="mt-10 border-none bg-white shadow-xl shadow-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl font-black tracking-tight">
                {dashboardContent.coworkerReview.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingCoworkerBlips.length ? (
                pendingCoworkerBlips.map((blip) => (
                  <div
                    key={blip.id}
                    className="rounded-[2rem] border border-border/60 p-6"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-2xl font-black tracking-tight">
                            {blip.name}
                          </h3>
                          <Badge variant="secondary">
                            {getStatusLabel(blip.status)}
                          </Badge>
                        </div>
                        <p className="max-w-3xl text-sm font-medium text-muted-foreground">
                          {blip.shortDesc}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          <span>{blip.team}</span>
                          <span>
                            {quadrantMap.get(blip.quadrantId) ||
                              common.common.unassigned}
                          </span>
                          <span>
                            {ringMap.get(blip.ringId) ||
                              common.common.unassigned}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" asChild>
                        <Link href={`/blips/${blip.id}`}>
                          {dashboardContent.coworkerReview.openDetail}
                        </Link>
                      </Button>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto_auto]">
                      <Input
                        placeholder={
                          dashboardContent.coworkerReview.reviewPlaceholder
                        }
                        value={reviewNotes[blip.id] || ""}
                        onChange={(event) =>
                          setReviewNotes((currentState) => ({
                            ...currentState,
                            [blip.id]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        className="gap-2"
                        disabled={actionItemId === blip.id}
                        onClick={() => handleApprove(blip)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {common.common.approve}
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        disabled={actionItemId === blip.id}
                        onClick={() => handleReject(blip)}
                      >
                        <XCircle className="h-4 w-4" />
                        {common.common.sendToDraft}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-sm font-medium text-muted-foreground">
                  {dashboardContent.coworkerReview.emptyState}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
