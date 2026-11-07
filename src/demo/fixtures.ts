import { DEMO_USER_ID, type Workspace } from '@/data/models'
import { localDate } from '@/lib/dates'

export function createDemoWorkspace(now = new Date()): Workspace {
  const iso = (offsetMinutes: number) =>
    new Date(now.getTime() + offsetMinutes * 60_000).toISOString()
  const yesterday = new Date(now.getTime() - 86_400_000)
  return {
    version: 1,
    shifts: [
      {
        id: 'shift-current',
        userId: DEMO_USER_ID,
        type: now.getHours() >= 19 || now.getHours() < 7 ? 'night' : 'day',
        date: localDate(now),
        startedAt: iso(-90),
        endedAt: null,
        patientLabels: ['Demo room A', 'Demo room B', 'Demo room C'],
      },
      {
        id: 'shift-previous',
        userId: DEMO_USER_ID,
        type: 'day',
        date: localDate(yesterday),
        startedAt: iso(-1800),
        endedAt: iso(-1440),
        patientLabels: ['Demo room A'],
      },
    ],
    tasks: [
      {
        id: 'task-1',
        userId: DEMO_USER_ID,
        shiftId: 'shift-current',
        title: 'Confirm the orientation checklist with preceptor',
        patientLabel: '',
        priority: 'important',
        dueAt: iso(-15),
        completedAt: null,
        createdAt: iso(-85),
      },
      {
        id: 'task-2',
        userId: DEMO_USER_ID,
        shiftId: 'shift-current',
        title: 'Prepare a fictional handoff outline',
        patientLabel: 'Demo room A',
        priority: 'routine',
        dueAt: iso(35),
        completedAt: null,
        createdAt: iso(-80),
      },
      {
        id: 'task-3',
        userId: DEMO_USER_ID,
        shiftId: 'shift-current',
        title: 'Check in about today’s learning goals',
        patientLabel: 'Demo room B',
        priority: 'urgent',
        dueAt: iso(80),
        completedAt: null,
        createdAt: iso(-75),
      },
      {
        id: 'task-4',
        userId: DEMO_USER_ID,
        shiftId: 'shift-current',
        title: 'Review the unit’s shift organization workflow',
        patientLabel: '',
        priority: 'routine',
        dueAt: null,
        completedAt: iso(-20),
        createdAt: iso(-70),
      },
      {
        id: 'task-5',
        userId: DEMO_USER_ID,
        shiftId: 'shift-current',
        title: 'Write down questions for the next check-in',
        patientLabel: 'Demo room C',
        priority: 'important',
        dueAt: null,
        completedAt: null,
        createdAt: iso(-60),
      },
      {
        id: 'task-previous',
        userId: DEMO_USER_ID,
        shiftId: 'shift-previous',
        title: 'Review the orientation schedule',
        patientLabel: '',
        priority: 'routine',
        dueAt: null,
        completedAt: iso(-1500),
        createdAt: iso(-1700),
      },
    ],
    handoffs: [
      {
        id: 'handoff-demo',
        userId: DEMO_USER_ID,
        shiftId: 'shift-current',
        patientLabel: 'Demo room A',
        situation: 'Fictional practice outline for an orientation handoff.',
        background: 'Learning the unit’s communication workflow.',
        assessment: 'Organization practice only. No clinical assessment.',
        recommendation:
          'Review the outline with a preceptor using approved unit guidance.',
        updatedAt: iso(-30),
      },
    ],
    reflections: [
      {
        id: 'reflection-demo',
        userId: DEMO_USER_ID,
        shiftId: 'shift-previous',
        wentWell:
          'A simple checklist helped me keep track of my learning goals.',
        difficult: 'Switching between tasks felt overwhelming at first.',
        reviewLater: 'Ask my preceptor how they organize their shift.',
        confidence: 3,
        createdAt: iso(-1430),
      },
    ],
  }
}
