"use client";

import { firebaseConfig } from "@/firebase/config";
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

function hasFirebaseHostingDefaults(): boolean {
  return typeof (globalThis as { __FIREBASE_DEFAULTS__?: unknown }).__FIREBASE_DEFAULTS__ !== "undefined";
}

function initializeFirebaseApp(): FirebaseApp {
  if (!hasFirebaseHostingDefaults()) {
    return initializeApp(firebaseConfig);
  }

  try {
    // Firebase App Hosting injects runtime defaults for zero-argument initialization.
    return initializeApp();
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "Automatic initialization failed. Falling back to firebase config object.",
        error
      );
    }

    return initializeApp(firebaseConfig);
  }
}

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    const firebaseApp = initializeFirebaseApp();

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}

export * from "./provider";
export * from "./client-provider";
export * from "./firestore/use-collection";
export * from "./firestore/use-doc";
export * from "./non-blocking-updates";
export * from "./non-blocking-login";
export * from "./errors";
export * from "./error-emitter";
