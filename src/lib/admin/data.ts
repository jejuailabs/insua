import 'server-only'

import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'
import type { Role } from '@/types/user'

export type AdminUserRow = {
  uid: string
  email: string
  displayName: string
  role: Role | null
  isAdmin: boolean
  createdAt: string | null
}

export type AuditLogRow = {
  id: string
  action: string
  actorEmail: string | null
  targetUid: string
  before: string | null
  after: string | null
  at: string | null
}

function iso(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null
}

export async function listUsers(limit = 100): Promise<AdminUserRow[]> {
  const snap = await getAdminDb().collection('users').limit(limit).get()
  return snap.docs.map((doc) => {
    const d = doc.data()
    return {
      uid: doc.id,
      email: (d.email as string) ?? '',
      displayName: (d.displayName as string) ?? '',
      role: (d.role as Role | null) ?? null,
      isAdmin: d.isAdmin === true,
      createdAt: iso(d.createdAt),
    }
  })
}

export async function listAuditLogs(limit = 50): Promise<AuditLogRow[]> {
  const snap = await getAdminDb().collection('auditLogs').orderBy('at', 'desc').limit(limit).get()
  return snap.docs.map((doc) => {
    const d = doc.data()
    return {
      id: doc.id,
      action: (d.action as string) ?? '',
      actorEmail: (d.actorEmail as string | null) ?? null,
      targetUid: (d.targetUid as string) ?? '',
      before: (d.before as string | null) ?? null,
      after: (d.after as string | null) ?? null,
      at: iso(d.at),
    }
  })
}
