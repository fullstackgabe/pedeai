import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

type AuthContextValue = {
  session: any
  ready: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  ready: false,
  signIn: async () => null,
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data?.session || null)
        setReady(true)
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => {
      mounted = false
      sub?.subscription?.unsubscribe?.()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    return error ? 'Não foi possível entrar. Confira e-mail e senha.' : null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, ready, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
