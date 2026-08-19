import AdminPanel from '@/components/AdminPanel'

export const dynamic = 'force-dynamic'

/**
 * Gated by ADMIN_PIN and deliberately exempt from the kiosk cookie — the
 * organiser needs to fix a wrong-team spin from their own phone without walking
 * to the screen.
 */
export default function AdminPage() {
  return <AdminPanel />
}
