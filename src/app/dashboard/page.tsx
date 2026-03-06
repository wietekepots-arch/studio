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
import {
  RadarConfigOption,
  RadarItem,
} from "@/app/lib/radar-types";
import {
  canEditRadarItem,
  getStatusBadgeVariant,
  reviewRadarItem,
  seedRadarCollections,
  sortConfigOptions,
  sortRadarItems,
} from "@/lib/radar-firestore";

export default function DashboardPage(): React.ReactElement {
  const db = useFirestore();
  const { toast } = useToast();
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [actionItemId, setActionItemId] = useState<string | null>(null);
  const {
    authUser,
    canReview,
    hasCompanyAccess,
    isLoading,
    profile,
    role,
  } = useAppUser();

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
  const approvedItemsQuery = useMemoFirebase(() => {
    if (!authUser || !hasCompanyAccess) {
      return null;
    }

    return query(collection(db, "radarItems"), where("status", "==", "Approved"));
  }, [authUser, db, hasCompanyAccess]);
  const ownItemsQuery = useMemoFirebase(() => {
    if (!authUser || !hasCompanyAccess) {
      return null;
    }

    return query(
      collection(db, "radarItems"),
      where("createdBy", "==", authUser.uid),
    );
  }, [authUser, db, hasCompanyAccess]);
  const allItemsQuery = useMemoFirebase(() => {
    if (!authUser || !canReview || !hasCompanyAccess) {
      return null;
    }

    return collection(db, "radarItems");
  }, [authUser, canReview, db, hasCompanyAccess]);
  const pendingItemsQuery = useMemoFirebase(() => {
    if (!authUser || !canReview || !hasCompanyAccess) {
      return null;
    }

    return query(collection(db, "radarItems"), where("status", "==", "Pending"));
  }, [authUser, canReview, db, hasCompanyAccess]);

  const { data: quadrantDocs } = useCollection<RadarConfigOption>(quadrantsQuery);
  const { data: ringDocs } = useCollection<RadarConfigOption>(ringsQuery);
  const { data: approvedItems, isLoading: isApprovedItemsLoading } =
    useCollection<RadarItem>(approvedItemsQuery);
  const { data: ownItems, isLoading: isOwnItemsLoading } =
    useCollection<RadarItem>(ownItemsQuery);
  const { data: allItems, isLoading: isAllItemsLoading } =
    useCollection<RadarItem>(allItemsQuery);
  const { data: pendingItems, isLoading: isPendingItemsLoading } =
    useCollection<RadarItem>(pendingItemsQuery);

  const quadrants = sortConfigOptions(quadrantDocs);
  const rings = sortConfigOptions(ringDocs);
  const quadrantMap = useMemo(() => {
    return new Map(quadrants.map((item) => [item.order, item.name]));
  }, [quadrants]);
  const ringMap = useMemo(() => {
    return new Map(rings.map((item) => [item.order, item.name]));
  }, [rings]);

  const mainItems = useMemo(() => {
    if (canReview) {
      return sortRadarItems(allItems);
    }

    const dedupedItems = new Map<string, RadarItem>();

    for (const item of approvedItems || []) {
      dedupedItems.set(item.id, item);
    }

    for (const item of ownItems || []) {
      dedupedItems.set(item.id, item);
    }

    return sortRadarItems(Array.from(dedupedItems.values()));
  }, [allItems, approvedItems, canReview, ownItems]);

  const pendingCoworkerItems = useMemo(() => {
    return sortRadarItems(
      (pendingItems || []).filter((item) => item.createdBy !== authUser?.uid),
    );
  }, [authUser?.uid, pendingItems]);

  const isAnyTableLoading =
    isLoading ||
    isApprovedItemsLoading ||
    isOwnItemsLoading ||
    isAllItemsLoading ||
    isPendingItemsLoading;
  const needsSeed = !quadrants.length || !rings.length || !mainItems.length;

  async function handleApprove(item: RadarItem): Promise<void> {
    if (!profile) {
      return;
    }

    setActionItemId(item.id);

    try {
      await reviewRadarItem(
        db,
        item,
        profile,
        "Approved",
        reviewNotes[item.id] || "",
      );
      toast({
        title: dashboardContent.toasts.approved.title,
        description: dashboardContent.toasts.approved.description.replace("{name}", item.name),
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

  async function handleReject(item: RadarItem): Promise<void> {
    if (!profile) {
      return;
    }

    setActionItemId(item.id);

    try {
      await reviewRadarItem(
        db,
        item,
        profile,
        "Draft",
        reviewNotes[item.id] || "",
      );
      toast({
        title: dashboardContent.toasts.returnedToDraft.title,
        description: dashboardContent.toasts.returnedToDraft.description.replace("{name}", item.name),
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
        description: dashboardContent.toasts.seeded.description.replace("{items}", String(result.items)).replace("{tags}", String(result.tags)),
      });
    } catch (error) {
      toast({
        title: dashboardContent.toasts.seedFailed.title,
        description: dashboardContent.toasts.seedFailed.description,
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
          <div className="space-y-3">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              {dashboardContent.sectionLabel}
            </div>
            <h1 className="text-6xl font-black uppercase leading-none tracking-tighter">
              {dashboardContent.heading} <span className="text-primary">{dashboardContent.headingHighlight}</span>
            </h1>
            <p className="max-w-2xl text-lg font-medium text-muted-foreground">
              {dashboardContent.description}
            </p>
          </div>

          {needsSeed ? (
            <div className="flex flex-col items-start gap-2 md:items-end">
              <Button
                className="h-14 gap-2 rounded-full px-8 font-bold"
                onClick={handleSeed}
                disabled={!canReview || actionItemId === "seed"}
                title={
                  canReview
                    ? dashboardContent.seed.tooltip
                    : dashboardContent.seed.restrictedTooltip
                }
              >
                <DatabaseZap className="h-5 w-5" />
                {dashboardContent.seed.button}
              </Button>
              {!canReview ? (
                <p className="max-w-sm text-right text-sm font-medium text-muted-foreground">
                  {dashboardContent.seed.restrictedMessage.replace("{role}", role || "Member")}
                </p>
              ) : null}
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
              {mainItems.length}
            </CardContent>
          </Card>
          <Card className="border-none bg-secondary/20 shadow-none">
            <CardHeader>
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                {common.labels.pendingCoworkerReview}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-black tracking-tight">
              {canReview ? pendingCoworkerItems.length : 0}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-10 border-none bg-white shadow-xl shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">
                {canReview ? dashboardContent.table.allBlips : dashboardContent.table.yourDashboard}
              </CardTitle>
              <p className="text-sm font-medium text-muted-foreground">
                {canReview
                  ? dashboardContent.table.allBlipsDescription
                  : dashboardContent.table.yourDashboardDescription}
              </p>
            </div>
            <Button asChild className="rounded-full px-6 font-bold">
              <Link href="/items/new">{dashboardContent.table.suggestTool}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isAnyTableLoading ? (
              <div className="py-12 text-center text-muted-foreground">
                {common.common.loadingDashboardData}
              </div>
            ) : mainItems.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{dashboardContent.table.columns.blip}</TableHead>
                    <TableHead>{dashboardContent.table.columns.status}</TableHead>
                    <TableHead>{dashboardContent.table.columns.quadrant}</TableHead>
                    <TableHead>{dashboardContent.table.columns.ring}</TableHead>
                    <TableHead>{dashboardContent.table.columns.updated}</TableHead>
                    <TableHead className="text-right">{dashboardContent.table.columns.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mainItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.team}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {quadrantMap.get(item.quadrantId) || common.common.unassigned}
                      </TableCell>
                      <TableCell>{ringMap.get(item.ringId) || common.common.unassigned}</TableCell>
                      <TableCell>
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/items/${item.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              {common.common.view}
                            </Link>
                          </Button>
                          {canEditRadarItem(item, authUser.uid, role) ? (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/items/${item.id}/edit`}>
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
                <div className="text-xl font-black">{dashboardContent.emptyState.heading}</div>
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
              {pendingCoworkerItems.length ? (
                pendingCoworkerItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[2rem] border border-border/60 p-6"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-2xl font-black tracking-tight">
                            {item.name}
                          </h3>
                          <Badge variant="secondary">{item.status}</Badge>
                        </div>
                        <p className="max-w-3xl text-sm font-medium text-muted-foreground">
                          {item.shortDesc}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          <span>{item.team}</span>
                          <span>
                            {quadrantMap.get(item.quadrantId) || common.common.unassigned}
                          </span>
                          <span>{ringMap.get(item.ringId) || common.common.unassigned}</span>
                        </div>
                      </div>
                      <Button variant="ghost" asChild>
                        <Link href={`/items/${item.id}`}>{dashboardContent.coworkerReview.openDetail}</Link>
                      </Button>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto_auto]">
                      <Input
                        placeholder={dashboardContent.coworkerReview.reviewPlaceholder}
                        value={reviewNotes[item.id] || ""}
                        onChange={(event) =>
                          setReviewNotes((currentState) => ({
                            ...currentState,
                            [item.id]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        className="gap-2"
                        disabled={actionItemId === item.id}
                        onClick={() => handleApprove(item)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {common.common.approve}
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        disabled={actionItemId === item.id}
                        onClick={() => handleReject(item)}
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
