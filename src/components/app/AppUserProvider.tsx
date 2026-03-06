"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { doc, runTransaction } from "firebase/firestore";
import { signOut, User } from "firebase/auth";
import { useAuth, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Role, UserProfile } from "@/app/lib/radar-types";
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
  const isSigningOutRef = useRef(false);
  const isCompanyUser = isCompanyEmail(user?.email);

  const profileRef = useMemoFirebase(() => {
    if (!db || !user || !isCompanyUser) {
      return null;
    }

    return doc(db, "userProfiles", user.uid);
  }, [db, user, isCompanyUser]);

  const {
    data: profileDocument,
    isLoading: isProfileLoading,
    error: profileError,
  } = useDoc<UserProfile>(profileRef);

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
      profileError ||
      profileDocument ||
      isEnsuringProfile ||
      !profileRef
    ) {
      return;
    }

    setIsEnsuringProfile(true);
    void runTransaction(db, async (transaction) => {
      const currentProfile = await transaction.get(profileRef);

      if (currentProfile.exists()) {
        return;
      }

      transaction.set(profileRef, {
        uid: user.uid,
        displayName: user.displayName || user.email?.split("@")[0] || "Member",
        email: user.email || "",
        role: "Member",
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
    profileError,
    profileDocument,
    profileRef,
    user,
  ]);

  const profile = profileDocument
    ? {
        ...profileDocument,
        uid: profileDocument.uid || user?.uid || "",
      }
    : null;
  const role = profile?.role || null;
  const hasCompanyAccess = Boolean(user && isCompanyUser && profile);

  const value = useMemo<AppUserContextValue>(() => {
    return {
      authUser: user,
      profile,
      role,
      isLoading: isUserLoading || isProfileLoading || isEnsuringProfile,
      hasCompanyAccess,
      canReview: canReviewBlips(role),
      isAdmin: isAdminRole(role),
    };
  }, [
    hasCompanyAccess,
    isEnsuringProfile,
    isProfileLoading,
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
