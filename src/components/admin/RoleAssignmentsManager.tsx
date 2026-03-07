"use client";

import React, { useEffect, useMemo, useState } from "react";
import { collection, doc, setDoc, type Firestore } from "firebase/firestore";
import { Save, ShieldCheck } from "lucide-react";
import { Role, RoleAssignment, UserProfile } from "@/app/lib/radar-types";
import { useAppUser } from "@/components/app/AppUserProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useMemoFirebase } from "@/firebase";

const ROLE_OPTIONS: Role[] = ["Member", "PowerUser", "Admin"];

interface RoleAssignmentsManagerProps {
  db: Firestore;
}

interface AccessRow {
  uid: string;
  displayName: string;
  email: string;
  team: string;
  profileRole: Role | null;
  assignedRole: Role | null;
  effectiveRole: Role;
  lastUpdatedAt: number | null;
  hasProfile: boolean;
}

function getRoleLabel(role: Role): string {
  switch (role) {
    case "PowerUser":
      return "Power user";
    case "Admin":
      return "Admin";
    default:
      return "Lid";
  }
}

function formatTimestamp(value: number | null): string {
  if (!value) {
    return "Nog niet vastgelegd";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function RoleAssignmentsManager({
  db,
}: RoleAssignmentsManagerProps): React.ReactElement {
  const { authUser } = useAppUser();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [draftRoles, setDraftRoles] = useState<Record<string, Role>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const profilesQuery = useMemoFirebase(() => {
    return collection(db, "userProfiles");
  }, [db]);
  const assignmentsQuery = useMemoFirebase(() => {
    return collection(db, "roleAssignments");
  }, [db]);

  const { data: profileDocs, isLoading: isProfilesLoading } =
    useCollection<UserProfile>(profilesQuery);
  const { data: assignmentDocs, isLoading: isAssignmentsLoading } =
    useCollection<RoleAssignment>(assignmentsQuery);

  const rows = useMemo<AccessRow[]>(() => {
    const merged = new Map<string, AccessRow>();

    for (const profile of profileDocs || []) {
      merged.set(profile.uid, {
        uid: profile.uid,
        displayName: profile.displayName || profile.email || profile.uid,
        email: profile.email || "",
        team: profile.team || "",
        profileRole: profile.role,
        assignedRole: null,
        effectiveRole: profile.role,
        lastUpdatedAt: profile.updatedAt || null,
        hasProfile: true,
      });
    }

    for (const assignment of assignmentDocs || []) {
      const current = merged.get(assignment.uid);
      const nextUpdatedAt = assignment.updatedAt || current?.lastUpdatedAt || null;

      merged.set(assignment.uid, {
        uid: assignment.uid,
        displayName:
          current?.displayName || assignment.email || assignment.uid,
        email: assignment.email || current?.email || "",
        team: current?.team || "",
        profileRole: current?.profileRole || null,
        assignedRole: assignment.role,
        effectiveRole: assignment.role,
        lastUpdatedAt: nextUpdatedAt,
        hasProfile: current?.hasProfile || false,
      });
    }

    return Array.from(merged.values()).sort((left, right) => {
      return left.displayName.localeCompare(right.displayName, "nl");
    });
  }, [assignmentDocs, profileDocs]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      return (
        row.displayName.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.uid.toLowerCase().includes(query)
      );
    });
  }, [rows, search]);

  const assignmentByUserId = useMemo(() => {
    return new Map((assignmentDocs || []).map((assignment) => [assignment.uid, assignment]));
  }, [assignmentDocs]);

  useEffect(() => {
    setDraftRoles((current) => {
      const next: Record<string, Role> = {};

      for (const row of rows) {
        next[row.uid] = current[row.uid] || row.effectiveRole;
      }

      const hasSameKeys =
        Object.keys(current).length === Object.keys(next).length &&
        Object.entries(next).every(([key, value]) => current[key] === value);

      return hasSameKeys ? current : next;
    });
  }, [rows]);

  async function handleSave(row: AccessRow): Promise<void> {
    if (!authUser) {
      return;
    }

    const nextRole = draftRoles[row.uid] || row.effectiveRole;
    const isSelfRoleChange =
      row.uid === authUser.uid && nextRole !== row.effectiveRole;

    if (isSelfRoleChange) {
      toast({
        title: "Eigen rol niet gewijzigd",
        description:
          "Pas je eigen rol niet via deze tabel aan. Gebruik deze rij alleen om je huidige rol vast te leggen.",
        variant: "destructive",
      });
      return;
    }

    setSavingId(row.uid);
    const now = Date.now();
    const existingAssignment = assignmentByUserId.get(row.uid);

    try {
      await setDoc(
        doc(db, "roleAssignments", row.uid),
        {
          uid: row.uid,
          email: row.email,
          role: nextRole,
          createdAt: existingAssignment?.createdAt || now,
          createdBy: existingAssignment?.createdBy || authUser.uid,
          updatedAt: now,
          updatedBy: authUser.uid,
        } satisfies RoleAssignment,
      );

      if (row.hasProfile) {
        await setDoc(
          doc(db, "userProfiles", row.uid),
          {
            role: nextRole,
            updatedAt: now,
          },
          { merge: true },
        );
      }

      toast({
        title: "Rol opgeslagen",
        description: `${row.displayName} staat nu op ${getRoleLabel(nextRole)}.`,
      });
    } catch (error) {
      toast({
        title: "Opslaan mislukt",
        description: "De roltoewijzing kon niet worden opgeslagen.",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Card className="border-none bg-white shadow-xl shadow-primary/5">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-black tracking-tight">
              Toegang en rollen
            </CardTitle>
            <p className="text-sm font-medium text-muted-foreground">
              `roleAssignments` is nu de vaste bron voor rollen. Een opnieuw
              aangemaakt profiel neemt daardoor weer de juiste rol over.
            </p>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1 font-bold">
            Alleen admin
          </Badge>
        </div>
        <div className="rounded-[1.5rem] border border-primary/10 bg-primary/5 p-4 text-sm text-muted-foreground">
          <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Waarom dit nodig is
          </div>
          <p>
            De oude setup gebruikte `userProfiles.role` als bron. Als een profiel
            opnieuw werd aangemaakt, viel de rol terug naar `Member`. Met
            `roleAssignments` blijft een toegekende Admin- of PowerUser-rol
            behouden.
          </p>
        </div>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Zoek op naam, e-mail of uid"
          className="max-w-md"
        />
      </CardHeader>
      <CardContent>
        {isProfilesLoading || isAssignmentsLoading ? (
          <div className="py-8 text-sm text-muted-foreground">
            Rollen worden geladen...
          </div>
        ) : filteredRows.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gebruiker</TableHead>
                <TableHead>Profielrol</TableHead>
                <TableHead>Toewijzing</TableHead>
                <TableHead>Nieuwe rol</TableHead>
                <TableHead>Laatst bijgewerkt</TableHead>
                <TableHead className="text-right">Actie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => {
                const nextRole = draftRoles[row.uid] || row.effectiveRole;
                const canSave =
                  savingId !== row.uid &&
                  (nextRole !== row.assignedRole || !row.assignedRole);

                return (
                  <TableRow key={row.uid}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-semibold">{row.displayName}</div>
                        <div className="text-sm text-muted-foreground">
                          {row.email || row.uid}
                        </div>
                        {row.team ? (
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            Team: {row.team}
                          </div>
                        ) : null}
                        {!row.hasProfile ? (
                          <Badge variant="secondary" className="rounded-full">
                            Nog geen profiel
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.profileRole ? (
                        <Badge variant="outline" className="rounded-full">
                          {getRoleLabel(row.profileRole)}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Geen</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.assignedRole ? (
                        <Badge className="rounded-full">{getRoleLabel(row.assignedRole)}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Nog niet vastgelegd</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={nextRole}
                        onValueChange={(value) =>
                          setDraftRoles((current) => ({
                            ...current,
                            [row.uid]: value as Role,
                          }))
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((role) => (
                            <SelectItem key={role} value={role}>
                              {getRoleLabel(role)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimestamp(row.lastUpdatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full"
                        disabled={!canSave}
                        onClick={() => void handleSave(row)}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Opslaan
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8 text-sm text-muted-foreground">
            Er zijn nog geen gebruikersprofielen om te beheren.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
