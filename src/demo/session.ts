import { z } from 'zod'

const roleSchema = z.enum(['student', 'new-rn'])
export type DemoRole = z.infer<typeof roleSchema>
const key = 'planurse.demo-role.v1'

export const demoSession = {
  read(): DemoRole | null {
    const stored = sessionStorage.getItem(key)
    if (stored === null) return null
    const result = roleSchema.safeParse(stored)
    if (!result.success)
      throw new Error(
        'Demo session is invalid. Clear this site’s session storage and reopen the demo.',
      )
    return result.data
  },
  enter(role: DemoRole) {
    sessionStorage.setItem(key, role)
  },
  leave() {
    sessionStorage.removeItem(key)
  },
}
