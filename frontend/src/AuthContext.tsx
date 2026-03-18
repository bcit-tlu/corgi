import { useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User, Role } from './types'
import { AuthContext } from './authContextValue'
import {
  fetchUsers as apiFetchUsers,
  loginUser as apiLoginUser,
  createUser as apiCreateUser,
  deleteUser as apiDeleteUser,
} from './api'
import type { ApiUser } from './api'

function toUser(u: ApiUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as Role,
    program: u.program,
    lastAccess: u.last_access,
  }
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUsers = useCallback(async () => {
    try {
      const data = await apiFetchUsers()
      setUsers(data.map(toUser))
    } catch (err) {
      console.error('Failed to load users', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const login = useCallback(
    async (userId: number) => {
      try {
        const data = await apiLoginUser(userId)
        setCurrentUser(toUser(data))
      } catch (err) {
        console.error('Login failed', err)
      }
    },
    [],
  )

  const logout = useCallback(() => {
    setCurrentUser(null)
  }, [])

  const addUser = useCallback(
    async (name: string, email: string, role: Role, program?: string) => {
      try {
        const data = await apiCreateUser({ name, email, role, program })
        const newUser = toUser(data)
        setUsers((prev) => [...prev, newUser])
      } catch (err) {
        console.error('Failed to add user', err)
      }
    },
    [],
  )

  const deleteUser = useCallback(
    async (userId: number) => {
      try {
        await apiDeleteUser(userId)
        setUsers((prev) => prev.filter((u) => u.id !== userId))
        if (currentUser?.id === userId) {
          setCurrentUser(null)
        }
      } catch (err) {
        console.error('Failed to delete user', err)
      }
    },
    [currentUser],
  )

  const canManageUsers = currentUser?.role === 'admin'
  const canEditContent =
    currentUser?.role === 'admin' || currentUser?.role === 'instructor'

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        loading,
        login,
        logout,
        addUser,
        deleteUser,
        refreshUsers: loadUsers,
        canManageUsers,
        canEditContent,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
