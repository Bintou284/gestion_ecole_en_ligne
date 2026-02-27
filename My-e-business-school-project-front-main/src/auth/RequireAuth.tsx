// src/auth/RequireAuth.tsx
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

type Role = 'student' | 'teacher' | 'admin'

function getRole(): Role | null {
  return (localStorage.getItem('role') as Role) || null
}

export default function RequireAuth({
  allow,
  children,
}: {
  allow: Role[]
  children: React.ReactNode
}) {
  const location = useLocation()
  const role = getRole()

  if (!role || !allow.includes(role)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
