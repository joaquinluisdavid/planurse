import type { Workspace } from '@/data/models'
import { localDate } from '@/lib/dates'

export function createWorkspaceFixture(now = new Date()): Workspace {
  const ownerId = '00000000-0000-4000-8000-000000000001'
  const iso = (offsetMinutes: number) =>
    new Date(now.getTime() + offsetMinutes * 60_000).toISOString()
  const yesterday = new Date(now.getTime() - 86_400_000)
  return {
    version: 1,
    shifts: [
      {
        id: 'shift-current',
        userId: ownerId,
        type: now.getHours() >= 19 || now.getHours() < 7 ? 'night' : 'day',
        date: localDate(now),
        startedAt: iso(-90),
        endedAt: null,
        patientLabels: ['Room A', 'Room B', 'Room C'],
      },
      {
        id: 'shift-previous',
        userId: ownerId,
        type: 'day',
        date: localDate(yesterday),
        startedAt: iso(-1800),
        endedAt: iso(-1440),
        patientLabels: ['Room A'],
      },
    ],
    tasks: [
      {
        id: 'task-1',
        userId: ownerId,
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
        userId: ownerId,
        shiftId: 'shift-current',
        title: 'Prepare a handoff outline',
        patientLabel: 'Room A',
        priority: 'routine',
        dueAt: iso(35),
        completedAt: null,
        createdAt: iso(-80),
      },
      {
        id: 'task-3',
        userId: ownerId,
        shiftId: 'shift-current',
        title: 'Check in about today’s learning goals',
        patientLabel: 'Room B',
        priority: 'urgent',
        dueAt: iso(80),
        completedAt: null,
        createdAt: iso(-75),
      },
      {
        id: 'task-4',
        userId: ownerId,
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
        userId: ownerId,
        shiftId: 'shift-current',
        title: 'Write down questions for the next check-in',
        patientLabel: 'Room C',
        priority: 'important',
        dueAt: null,
        completedAt: null,
        createdAt: iso(-60),
      },
      {
        id: 'task-previous',
        userId: ownerId,
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
        id: 'handoff-test',
        userId: ownerId,
        shiftId: 'shift-current',
        patientLabel: 'Room A',
        situation: 'Personal preparation outline for a team handoff.',
        background: 'Review the team communication workflow.',
        assessment: 'Organization practice only. No clinical assessment.',
        recommendation: 'Discuss the outline with a preceptor.',
        updatedAt: iso(-30),
      },
    ],
    reflections: [
      {
        id: 'reflection-test',
        userId: ownerId,
        shiftId: 'shift-previous',
        wentWell: 'A checklist helped me keep track of learning goals.',
        difficult: 'Switching between tasks felt overwhelming at first.',
        reviewLater: 'Ask how the team organizes its shift.',
        confidence: 3,
        createdAt: iso(-1430),
      },
    ],
    learningNotes: [
      {
        id: 'learning-note-test',
        userId: ownerId,
        shiftId: 'shift-previous',
        topic: 'Organizing a shift handoff',
        question: 'What structure does the team use to organize a handoff?',
        followUp: 'Ask during the next scheduled learning check-in.',
        createdAt: iso(-1420),
        updatedAt: iso(-1420),
      },
    ],
  }
}
