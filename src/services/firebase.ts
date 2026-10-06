import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  browserSessionPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut as fbSignOut,
  type Auth,
  type User,
} from 'firebase/auth'

/**
 * Firebase authentication service.
 *
 * Configuration arrives exclusively via environment variables so no
 * credentials are ever hardcoded:
 *
 *   VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN,
 *   VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID
 *   (optionally VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID)
 *
 * When the required variables are absent the module falls back to a
 * deterministic demo identity so the UI can be developed and demoed
 * without a live Firebase project.
 */

export interface AuthUser {
  uid: string
  displayName: string
  email: string
  photoURL?: string
  provider: 'google' | 'demo'
}

const env = import.meta.env as Record<string, string | undefined>

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId,
)

const DEMO_USER: AuthUser = {
  uid: 'demo-user',
  displayName: 'Demo Analyst',
  email: 'demo.analyst@eka.internal',
  provider: 'demo',
}

let app: FirebaseApp | null = null
let auth: Auth | null = null

function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured) return null
  if (!auth) {
    app = initializeApp(firebaseConfig as Required<Pick<typeof firebaseConfig, 'apiKey' | 'authDomain' | 'projectId' | 'appId'>>)
    auth = getAuth(app)
    // Enterprise sessions die with the tab by default.
    void setPersistence(auth, browserSessionPersistence).catch(() => {
      /* some environments forbid persistence; popup flow still works */
    })
  }
  return auth
}

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    displayName: user.displayName ?? 'Enterprise User',
    email: user.email ?? '',
    photoURL: user.photoURL ?? undefined,
    provider: 'google',
  }
}

const DEMO_SIGNED_OUT_KEY = 'eka.demo.signedOut'

function isDemoSignedOut(): boolean {
  try {
    return sessionStorage.getItem(DEMO_SIGNED_OUT_KEY) === '1'
  } catch {
    return false
  }
}

function setDemoSignedOut(value: boolean): void {
  try {
    if (value) sessionStorage.setItem(DEMO_SIGNED_OUT_KEY, '1')
    else sessionStorage.removeItem(DEMO_SIGNED_OUT_KEY)
  } catch {
    /* ignore */
  }
}

const listeners = new Set<(user: AuthUser | null) => void>()

function emit(user: AuthUser | null) {
  listeners.forEach((listener) => listener(user))
}

export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  listeners.add(callback)
  const fbAuth = getFirebaseAuth()
  let unsubscribe: (() => void) | undefined
  if (fbAuth) {
    unsubscribe = onAuthStateChanged(fbAuth, (user) => callback(user ? toAuthUser(user) : null))
  } else {
    // Demo mode (no Firebase env): a demo session is active unless the
    // user explicitly logged out in this tab.
    queueMicrotask(() => callback(isDemoSignedOut() ? null : DEMO_USER))
  }
  return () => {
    listeners.delete(callback)
    unsubscribe?.()
  }
}

export async function signInWithGoogle(): Promise<AuthUser> {
  const fbAuth = getFirebaseAuth()
  if (!fbAuth) {
    // Demo fallback keeps the product explorable without credentials.
    setDemoSignedOut(false)
    emit(DEMO_USER)
    return DEMO_USER
  }
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const credential = await signInWithPopup(fbAuth, provider)
  const user = toAuthUser(credential.user)
  emit(user)
  return user
}

export async function signOutUser(): Promise<void> {
  const fbAuth = getFirebaseAuth()
  if (fbAuth) {
    await fbSignOut(fbAuth)
  } else {
    setDemoSignedOut(true)
  }
  emit(null)
}

/** Allows tests / demos to force a specific session state. */
export function setDemoSession(user: AuthUser | null): void {
  if (auth) return // real Firebase owns state once configured
  emit(user)
}
