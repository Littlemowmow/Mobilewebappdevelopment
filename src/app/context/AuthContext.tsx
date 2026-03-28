import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { supabase } from "../../lib/supabase"
import { identifyUser, resetUser, trackEvent } from "../../lib/analytics"
import { initPurchases } from "../../lib/purchases"
import type { User } from "@supabase/supabase-js"

interface Profile {
  id: string
  email: string | null
  name: string | null
  username: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  xp: number | null
  rank: string | null
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (userId: string, userEmail?: string | null) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
    if (data) {
      setProfile(data)
    } else if (error) {
      if (import.meta.env.DEV) console.warn("Failed to load profile:", error.message)
      // Set a fallback profile so the app remains functional
      setProfile({
        id: userId,
        email: userEmail ?? null,
        name: userEmail?.split("@")[0] ?? null,
        username: null,
        display_name: userEmail?.split("@")[0] ?? null,
        avatar_url: null,
        bio: null,
        xp: null,
        rank: null,
      })
    }
  }

  useEffect(() => {
    let didTimeout = false
    const timeout = setTimeout(() => {
      didTimeout = true
      setLoading(false)
    }, 5000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout)
      if (!didTimeout) {
        setUser(session?.user ?? null)
        if (session?.user) loadProfile(session.user.id, session.user.email)
        setLoading(false)
      } else {
        // Timeout already fired, but session came through — still update user
        setUser(session?.user ?? null)
        if (session?.user) loadProfile(session.user.id, session.user.email)
      }
    }).catch(() => {
      clearTimeout(timeout)
      if (!didTimeout) setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id, session.user.email)
        // Identify user in PostHog + init RevenueCat
        identifyUser(session.user.id, {
          email: session.user.email ?? null,
          name: session.user.user_metadata?.name ?? null,
        })
        initPurchases(session.user.id)
        trackEvent("session_started")
      } else {
        setProfile(null)
        resetUser()
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const safetyTimeout = setTimeout(() => setLoading(false), 8000)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    clearTimeout(safetyTimeout)
    setLoading(false)
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true)
    const safetyTimeout = setTimeout(() => setLoading(false), 8000)
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (!error && data.user) {
      await supabase.from("profiles").update({ name, display_name: name }).eq("id", data.user.id)
    }
    clearTimeout(safetyTimeout)
    // Always stop loading — if no session (email confirmation), UI must not hang
    setLoading(false)
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    trackEvent("user_signed_out")
    resetUser()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
