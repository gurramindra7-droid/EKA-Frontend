import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  onAuthChange,
  signInWithGoogle,
  signOutUser,
  type AuthUser,
} from '../services/firebase'

interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

/**
 * Auth hook backed by the Firebase service abstraction.
 *
 * The hook never imports Firebase SDK internals directly — it only knows
 * the AuthUser shape, keeping the UI decoupled from the provider.
 */
export function useAuthState(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthChange((next) => {
      setUser(next)
      setLoading(false)
    })
    // If no provider reports state (demo mode), resolve loading promptly.
    const timeout = setTimeout(() => setLoading(false), 400)
    return () => {
      unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const signIn = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    await signOutUser()
    setUser(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return useMemo(
    () => ({ user, loading, error, signIn, signOut, clearError }),
    [user, loading, error, signIn, signOut, clearError],
  )
}

/* ------------------------------------------------------------------ */
/* Context so nested components share one session                      */
/* ------------------------------------------------------------------ */

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const state = useAuthState()
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
