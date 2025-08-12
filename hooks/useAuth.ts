"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import type { User } from "../types"
import { authApi } from "../lib/api"
import toast from "react-hot-toast"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: Partial<User>) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  hasRole: (roles: string | string[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token")
      const savedUser = localStorage.getItem("user")

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser))
          // Verify token is still valid
          const response = await authApi.getCurrentUser()
          if (response.data.success) {
            setUser(response.data.data!)
          }
        } catch (error) {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          setUser(null)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login(email, password)

      if (response.data.success && response.data.data) {
        const { token, user: userData } = response.data.data
        localStorage.setItem("token", token)
        localStorage.setItem("user", JSON.stringify(userData))
        setUser(userData)
        toast.success("Login successful!")
        return true
      }

      toast.error("Login failed")
      return false
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed"
      toast.error(message)
      return false
    }
  }

  const register = async (userData: Partial<User>): Promise<boolean> => {
    try {
      const response = await authApi.register(userData)

      if (response.data.success && response.data.data) {
        const { token, user: newUser } = response.data.data
        localStorage.setItem("token", token)
        localStorage.setItem("user", JSON.stringify(newUser))
        setUser(newUser)
        toast.success("Registration successful!")
        return true
      }

      toast.error("Registration failed")
      return false
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed"
      toast.error(message)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    toast.success("Logged out successfully")
  }

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    hasRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
