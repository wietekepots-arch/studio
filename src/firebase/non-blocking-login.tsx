'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from 'firebase/auth';
import { COMPANY_EMAIL_DOMAIN } from "@/lib/company-auth";

/** Initiate anonymous sign-in (returns promise for error handling). */
export function initiateAnonymousSignIn(authInstance: Auth): Promise<UserCredential> {
  return signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (returns promise for error handling). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (returns promise for error handling). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(authInstance, email, password);
}

/** Initiate Google sign-in (returns promise for error handling). */
export function initiateGoogleSignIn(authInstance: Auth): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  // We specify the prompt as 'select_account' to ensure users can choose their greenberry account
  provider.setCustomParameters({
    prompt: 'select_account',
    hd: COMPANY_EMAIL_DOMAIN.replace("@", ""),
  });
  return signInWithPopup(authInstance, provider);
}
