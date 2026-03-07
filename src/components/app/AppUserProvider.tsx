"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { doc, runTransaction, setDoc } from "firebase/firestore";
import { signOut, User } from "firebase/auth";
import { useAuth, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Role, RoleAssignment, UserProfile } from "@/app/lib/radar-types";
import {
  canReviewBlips,
  isAdminRole,
  isCompanyEmail,
} from "@/lib/company-auth";

interface AppUserContextValue {
  authUser: User | null;
  profile: UserProfile | null;
  role: Role | null;
  isLoading: boolean;
  hasCompanyAccess: boolean;
  canReview: boolean;
  isAdmin: boolean;
}

const AppUserContext = createContext<AppUserContextValue | undefined>(undefined);

interface AppUserProviderProps {
  children: React.ReactNode;
}

export function AppUserProvider({
  children,
}: AppUserProviderProps): React.ReactElement {
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isEnsuringProfile, setIsEnsuringProfile] = useState(false);
  const [isEnsuringRoleAssignment, setIsEnsuringRoleAssignment] = useState(false);
  const isSigningOutRef = useRef(false);
  const isCompanyUser = isCompanyEmail(user?.email);

  function isRole(value: unknown): value is Role {
    return value === "Member" || value === "PowerUser" || value === "Admin";
  }

  const profileRef = useMemoFirebase(() => {
    if (!db || !user || !isCompanyUser) {
      return null;
    }

    return doc(db, "userProfiles", user.uid);
  }, [db, user, isCompanyUser]);
  const roleAssignmentRef = useMemoFirebase(() => {
    if (!db || !user || !isCompanyUser) {
      return null;
    }

    return doc(db, "roleAssignments", user.uid);
  }, [db, user, isCompanyUser]);

  const {
    data: profileDocument,
    isLoading: isProfileLoading,
    error: profileError,
  } = useDoc<UserProfile>(profileRef);
  const {
    data: roleAssignmentDocument,
    isLoading: isRoleAssignmentLoading,
    error: roleAssignmentError,
  } = useDoc<RoleAssignment>(roleAssignmentRef);

  useEffect(() => {
    if (isUserLoading || !user || isCompanyUser || isSigningOutRef.current) {
      return;
    }

    isSigningOutRef.current = true;
    signOut(auth).finally(() => {
      isSigningOutRef.current = false;
    });
  }, [auth, isCompanyUser, isUserLoading, user]);

  useEffect(() => {
    if (
      !user ||
      !isCompanyUser ||
      isProfileLoading ||
      isRoleAssignmentLoading ||
      profileError ||
      roleAssignmentError ||
      profileDocument ||
      isEnsuringProfile ||
      !profileRef ||
      !roleAssignmentRef
    ) {
      return;
    }

    setIsEnsuringProfile(true);
    void runTransaction(db, async (transaction) => {
      const currentProfile = await transaction.get(profileRef);

      if (currentProfile.exists()) {
        return;
      }

      const currentRoleAssignment = await transaction.get(roleAssignmentRef);
      const assignedRole = currentRoleAssignment.data()?.role;
      const initialRole = isRole(assignedRole) ? assignedRole : "Member";

      transaction.set(profileRef, {
        uid: user.uid,
        displayName: user.displayName || user.email?.split("@")[0] || "Member",
        email: user.email || "",
        role: initialRole,
        team: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }).finally(() => {
      setIsEnsuringProfile(false);
    });
  }, [
    db,
    isCompanyUser,
    isEnsuringProfile,
    isProfileLoading,
    isRoleAssignmentLoading,
    profileError,
    roleAssignmentError,
    profileDocument,
    profileRef,
    roleAssignmentRef,
    user,
  ]);

  useEffect(() => {
    if (
      !user ||
      !isCompanyUser ||
      isProfileLoading ||
      isRoleAssignmentLoading ||
      profileError ||
      roleAssignmentError ||
      !profileDocument ||
      roleAssignmentDocument ||
      isEnsuringRoleAssignment ||
      !roleAssignmentRef ||
      profileDocument.role === "Member"
    ) {
      return;
    }

    setIsEnsuringRoleAssignment(true);
    const now = Date.now();

    void setDoc(
      roleAssignmentRef,
      {
        uid: user.uid,
        email: user.email || profileDocument.email || "",
        role: profileDocument.role,
        createdAt: now,
        createdBy: user.uid,
        updatedAt: now,
        updatedBy: user.uid,
      } satisfies RoleAssignment,
      { merge: true },
    ).finally(() => {
      setIsEnsuringRoleAssignment(false);
    });
  }, [
    isCompanyUser,
    isEnsuringRoleAssignment,
    isProfileLoading,
    isRoleAssignmentLoading,
    profileDocument,
    profileError,
    roleAssignmentDocument,
    roleAssignmentError,
    roleAssignmentRef,
    user,
  ]);

  const resolvedRole = roleAssignmentDocument?.role || profileDocument?.role || null;
  const profile = profileDocument
    ? {
        ...profileDocument,
        uid: profileDocument.uid || user?.uid || "",
        role: resolvedRole || profileDocument.role,
      }
    : null;
  const role = resolvedRole;
  const hasCompanyAccess = Boolean(user && isCompanyUser && profile);

  const value = useMemo<AppUserContextValue>(() => {
    return {
      authUser: user,
      profile,
      role,
      isLoading:
        isUserLoading ||
        isProfileLoading ||
        isRoleAssignmentLoading ||
        isEnsuringProfile ||
        isEnsuringRoleAssignment,
      hasCompanyAccess,
      canReview: canReviewBlips(role),
      isAdmin: isAdminRole(role),
    };
  }, [
    hasCompanyAccess,
    isEnsuringProfile,
    isEnsuringRoleAssignment,
    isProfileLoading,
    isRoleAssignmentLoading,
    isUserLoading,
    profile,
    role,
    user,
  ]);

  return (
    <AppUserContext.Provider value={value}>{children}</AppUserContext.Provider>
  );
}

export function useAppUser(): AppUserContextValue {
  const context = useContext(AppUserContext);

  if (!context) {
    throw new Error("useAppUser must be used within AppUserProvider.");
  }

  return context;
}
