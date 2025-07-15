import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react'
import { supabase } from '../lib/supabase'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()


      if (session && mounted) {
        const supaUser = session.user
        setUser({
          id: supaUser.id,
          email: supaUser.email!,
          name: supaUser.user_metadata.name || '',
          role: supaUser.role || ''
        })
      }

      setIsLoading(false)
    }

    checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            const supaUser = session.user
         setUser({
           id: supaUser.id,
           email: supaUser.email!,
           name: supaUser.user_metadata.name || '',
           role: supaUser.role || ''
         })
       }
        }

        if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('[Login error]', error)
      return false
    }

    return true
  }

  const signUp = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      console.error('[SignUp error]', error)
      return false
    }

    return true
  }

  const logout = () => {
    supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, signUp, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
