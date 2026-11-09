import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { AppRoutes } from '@/App'
import { AuthContext, type AuthValue } from '@/auth/useAuth'
import { WorkspaceProvider } from '@/data/WorkspaceProvider'
import type { WorkspaceRepository } from '@/data/repository'
import { createWorkspaceFixture } from './workspaceFixture'
import type { Workspace } from '@/data/models'

function repository(initial = createWorkspaceFixture()): WorkspaceRepository {
  let data = structuredClone(initial)
  return {
    load: vi.fn(async () => data),
    update: vi.fn(async (change: (workspace: Workspace) => Workspace) => {
      data = change(data)
      return data
    }),
  }
}
function emptyRecordWorkspace() {
  const workspace = createWorkspaceFixture()
  workspace.handoffs = []
  workspace.reflections = []
  workspace.learningNotes = []
  return workspace
}
function mount(
  path = '/shifts/shift-current',
  source = repository(),
  authOverrides: Partial<AuthValue> = {},
) {
  const authValue: AuthValue = {
    user: { id: '00000000-0000-4000-8000-000000000001', email: 'learner@example.test' } as User,
    profile: { userId: '00000000-0000-4000-8000-000000000001', role: 'new-rn' },
    loading: false,
    error: null,
    configured: true,
    refreshProfile: vi.fn(async () => {}),
    saveProfile: vi.fn(async () => {}),
    signOut: vi.fn(async () => {}),
    ...authOverrides,
  }
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthContext.Provider value={authValue}>
        <WorkspaceProvider repository={source}>
          <AppRoutes />
        </WorkspaceProvider>
      </AuthContext.Provider>
    </MemoryRouter>,
  )
  return { user: userEvent.setup(), source }
}

describe('authenticated account boundary', () => {
  it('redirects anonymous visitors to actual sign-in', async () => {
    mount('/dashboard', repository(), { user: null, profile: null, configured: false })
    expect(await screen.findByRole('heading', { name: 'Welcome back.' })).toBeInTheDocument()
    expect(screen.getByText('Cloud service setup required.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Your day, at a glance.' })).not.toBeInTheDocument()
  })
  it('requires account onboarding before opening private workspace routes', async () => {
    mount('/dashboard', repository(), { profile: null })
    expect(await screen.findByRole('heading', { name: 'Make room for learning.' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeInTheDocument()
  })
  it('shows account creation and password recovery links on welcome and sign in', async () => {
    const { user } = mount('/', repository(), { user: null, profile: null, configured: false })
    expect(screen.getAllByRole('link', { name: 'Create account' })[0]).toHaveAttribute('href', '/signup')
    await user.click(screen.getAllByRole('link', { name: 'Sign in' })[0])
    await user.click(await screen.findByRole('link', { name: 'Forgot password?' }))
    expect(await screen.findByRole('heading', { name: 'Reset your password.' })).toBeInTheDocument()
  })
  it('toggles password visibility on the account form', async () => {
    const { user } = mount('/signup', repository(), {
      user: null,
      profile: null,
      configured: true,
    })
    const password = await screen.findByLabelText('Password')
    await user.type(password, 'correct-horse-battery')
    expect(password).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(password).toHaveAttribute('type', 'password')
  })
})

describe('planner interactions with mocked data access', () => {
  it('returns keyboard focus to the task editor opener after Escape', async () => {
    const { user } = mount()
    const opener = await screen.findByRole('button', { name: 'Add a task' })
    await user.click(opener)
    expect(screen.getByLabelText('Task title')).toHaveFocus()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(opener).toHaveFocus())
  })
  it('validates and creates a task using accessible form controls', async () => {
    const { user, source } = mount()
    await screen.findByRole('heading', { name: 'Your tasks' })
    await user.click(screen.getByRole('button', { name: 'Add a task' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Add task' }))
    expect(
      await within(dialog).findByText('Use at least 3 characters.'),
    ).toBeInTheDocument()
    await user.type(
      within(dialog).getByLabelText('Task title'),
      'Review tomorrow’s learning goals',
    )
    await user.selectOptions(
      within(dialog).getByLabelText('Priority'),
      'important',
    )
    await user.selectOptions(
      within(dialog).getByLabelText('Room shorthand'),
      'Room C',
    )
    await user.click(within(dialog).getByRole('button', { name: 'Add task' }))
    expect(
      await screen.findByText('Review tomorrow’s learning goals'),
    ).toBeInTheDocument()
    expect(source.update).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('completes a task and shows it in the completed filter', async () => {
    const { user } = mount()
    const title = 'Confirm the orientation checklist with preceptor'
    await user.click(
      await screen.findByRole('checkbox', { name: `Complete task: ${title}` }),
    )
    await waitFor(() =>
      expect(screen.queryByText(title)).not.toBeInTheDocument(),
    )
    await user.selectOptions(screen.getByLabelText('Completion'), 'completed')
    expect(await screen.findByText(title)).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: `Reopen task: ${title}` }),
    ).toBeChecked()
  })
  it('combines filters and offers a recoverable empty state', async () => {
    const { user } = mount()
    await screen.findByRole('heading', { name: 'Your tasks' })
    await user.selectOptions(screen.getByLabelText('Room'), 'Room A')
    await user.selectOptions(screen.getByLabelText('Priority filter'), 'urgent')
    expect(screen.getByText('No tasks match these filters')).toBeInTheDocument()
    await user.click(
      screen.getAllByRole('button', { name: 'Clear filters' })[0],
    )
    expect(
      screen.getByText('Prepare a handoff outline'),
    ).toBeInTheDocument()
  })
  it('validates room shorthand and makes it available to task forms', async () => {
    const { user } = mount()
    await screen.findByRole('heading', { name: 'Your tasks' })
    await user.click(screen.getByRole('button', { name: 'Add room' }))
    expect(
      await screen.findByText(
        'Use 1–12 letters, numbers, or hyphens. Do not include patient identifiers.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Add room shorthand')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    await user.type(screen.getByLabelText('Add room shorthand'), 'd')
    await user.click(screen.getByRole('button', { name: 'Add room' }))
    await waitFor(() =>
      expect(screen.getByLabelText('Add room shorthand')).toHaveValue(''),
    )
    await user.click(screen.getByRole('button', { name: 'Add a task' }))
    expect(
      within(screen.getAllByLabelText('Room shorthand')[0]).getByRole('option', {
        name: 'Room D',
      }),
    ).toBeInTheDocument()
  })
  it('shows the dashboard overdue shortcut and filters the planner accordingly', async () => {
    const { user } = mount('/dashboard')
    await screen.findByRole('heading', { name: 'Your day, at a glance.' })
    await user.click(
      screen.getByRole('link', {
        name: /Confirm the orientation checklist with preceptor/,
      }),
    )
    expect(await screen.findByLabelText('Due time')).toHaveValue('overdue')
    expect(
      screen.getByText('Confirm the orientation checklist with preceptor'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Prepare a handoff outline'),
    ).not.toBeInTheDocument()
  })
  it('edits and deletes a task after confirmation', async () => {
    const { user } = mount()
    const title = 'Prepare a handoff outline'
    await user.click(
      await screen.findByRole('button', { name: `Edit task: ${title}` }),
    )
    await user.clear(screen.getByLabelText('Task title'))
    await user.type(
      screen.getByLabelText('Task title'),
      'Review practice outline',
    )
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await user.click(
      await screen.findByRole('button', {
        name: 'Delete task: Review practice outline',
      }),
    )
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Delete task',
      }),
    )
    await waitFor(() =>
      expect(
        screen.queryByText('Review practice outline'),
      ).not.toBeInTheDocument(),
    )
  })
  it('ends a shift only after acknowledging open tasks, leaving history read-only', async () => {
    const { user } = mount()
    await user.click(await screen.findByRole('button', { name: 'End shift' }))
    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByRole('button', { name: 'End shift' }),
    ).toBeDisabled()
    await user.click(within(dialog).getByRole('checkbox'))
    await user.click(within(dialog).getByRole('button', { name: 'End shift' }))
    expect(
      await screen.findByText('Shift ended · Read-only'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Add a task' }),
    ).not.toBeInTheDocument()
    expect(
      screen
        .getAllByRole('checkbox')
        .every((checkbox) => checkbox.hasAttribute('disabled')),
    ).toBe(true)
    expect(
      screen.getByText('Confirm the orientation checklist with preceptor'),
    ).toBeInTheDocument()
  })
  it('creates a shift with a controlled date and shift type', async () => {
    const initial = createWorkspaceFixture()
    initial.shifts[0].endedAt = new Date().toISOString()
    const { user, source } = mount('/shifts/new', repository(initial))
    await screen.findByLabelText('Shift type')
    await user.selectOptions(screen.getByLabelText('Shift type'), 'evening')
    await user.click(screen.getByRole('button', { name: 'Start shift' }))
    expect(
      await screen.findByRole('heading', { name: 'Evening shift' }),
    ).toBeInTheDocument()
    expect(screen.getByText('A clean slate')).toBeInTheDocument()
    expect(source.update).toHaveBeenCalledOnce()
  })
  it('shows completed and unfinished tasks when reopening an ended shift', async () => {
    const initial = createWorkspaceFixture()
    initial.shifts[0].endedAt = new Date().toISOString()
    mount('/shifts/shift-current', repository(initial))
    expect(
      await screen.findByText('Shift ended · Read-only'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Completion')).toHaveValue('all')
    expect(
      screen.getByText('Review the unit’s shift organization workflow'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Confirm the orientation checklist with preceptor'),
    ).toBeInTheDocument()
  })
  it('reports save failures without closing the form or adding a task', async () => {
    const source = repository()
    source.update = vi.fn(async () => {
      throw new Error('Storage unavailable')
    })
    const { user } = mount('/shifts/shift-current', source)
    await user.click(await screen.findByRole('button', { name: 'Add a task' }))
    await user.type(
      screen.getByLabelText('Task title'),
      'A task that will not save',
    )
    await user.click(screen.getByRole('button', { name: 'Add task' }))
    expect(
      await screen.findByText('Cannot save task: Storage unavailable'),
    ).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      screen.queryByRole('checkbox', { name: /A task that will not save/ }),
    ).not.toBeInTheDocument()
  })
  it('creates, edits, copies, prints, and deletes a fictional handoff draft', async () => {
    const { user } = mount('/handoffs', repository(emptyRecordWorkspace()))
    await user.click(await screen.findByRole('link', { name: /New draft/ }))
    await screen.findByRole('heading', { name: 'New handoff draft' })
    await user.selectOptions(screen.getByLabelText('Room shorthand'), 'Room B')
    await user.type(screen.getByLabelText('Situation'), 'A fictional practice outline')
    await user.type(screen.getByLabelText('Background'), 'General workflow orientation')
    await user.type(screen.getByLabelText('Assessment'), 'Organization practice only')
    await user.type(screen.getByLabelText('Recommendation'), 'Discuss the outline with a preceptor')
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    await screen.findByRole('heading', { name: 'Handoff drafts' })
    expect(await screen.findByText('A fictional practice outline')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Edit handoff draft for Room B' }))
    const situation = await screen.findByLabelText('Situation')
    await user.clear(situation)
    await user.type(situation, 'Updated fictional practice outline')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await screen.findByRole('heading', { name: 'Handoff drafts', level: 1 })
    expect(await screen.findByText('Updated fictional practice outline')).toBeInTheDocument()
    const clipboard = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: clipboard } })
    await user.click(screen.getByRole('button', { name: 'Copy' }))
    expect(clipboard).toHaveBeenCalledWith(expect.stringContaining('Situation: Updated fictional practice outline'))
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    await user.click(screen.getByRole('button', { name: 'Print' }))
    expect(print).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: 'Delete handoff draft for Room B' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete draft' }))
    expect(await screen.findByText('No handoff drafts yet')).toBeInTheDocument()
    print.mockRestore()
  })
  it('creates, edits, and deletes post-shift reflections', async () => {
    const { user } = mount('/reflections', repository(emptyRecordWorkspace()))
    await user.click(await screen.findByRole('link', { name: /New reflection/ }))
    await screen.findByRole('heading', { name: 'New reflection' })
    await user.type(screen.getByLabelText('What went well?'), 'I prepared a clear learning checklist')
    await user.type(screen.getByLabelText('What felt difficult?'), 'Prioritizing new tasks was difficult')
    await user.type(screen.getByLabelText('What would you like to review later?'), 'Ask about organizing a check-in')
    await user.click(screen.getByRole('button', { name: 'Save reflection' }))
    await screen.findByRole('heading', { name: 'Reflections', level: 1 })
    expect(await screen.findByText('I prepared a clear learning checklist')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Edit reflection' }))
    const wentWell = await screen.findByLabelText('What went well?')
    await user.clear(wentWell)
    await user.type(wentWell, 'I used a calmer review routine')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await screen.findByRole('heading', { name: 'Reflections', level: 1 })
    expect(await screen.findByText('I used a calmer review routine')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete reflection' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete reflection' }))
    expect(await screen.findByText('No reflections yet')).toBeInTheDocument()
  })
  it('creates, edits, and deletes general learning notes', async () => {
    const { user } = mount('/learning-notes', repository(emptyRecordWorkspace()))
    await user.click(await screen.findByRole('link', { name: /New note/ }))
    await screen.findByRole('heading', { name: 'New learning note' })
    await user.type(screen.getByLabelText('Topic'), 'Preparing for a learning check-in')
    await user.type(screen.getByLabelText('Question to explore (optional)'), 'What questions should I bring?')
    await user.type(screen.getByLabelText('Follow-up reminder (optional)'), 'Bring my notes next week')
    await user.click(screen.getByRole('button', { name: 'Save note' }))
    expect(await screen.findByRole('heading', { name: 'Preparing for a learning check-in' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Edit Preparing for a learning check-in' }))
    const topic = await screen.findByLabelText('Topic')
    await user.clear(topic)
    await user.type(topic, 'Preparing questions for supervision')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByRole('heading', { name: 'Preparing questions for supervision' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete Preparing questions for supervision' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete note' }))
    expect(await screen.findByText('No learning notes yet')).toBeInTheDocument()
  })
})

describe('loading, error and empty states', () => {
  it('announces loading while the repository is pending', () => {
    const source = repository()
    source.load = vi.fn(() => new Promise<Workspace>(() => {}))
    mount('/dashboard', source)
    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading your workspace...',
    )
  })
  it('shows load errors and retries', async () => {
    const source = repository()
    source.load = vi
      .fn()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValue(createWorkspaceFixture())
    const { user } = mount('/dashboard', source)
    expect(
      await screen.findByText('Cannot load your workspace: Offline'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(
      await screen.findByRole('heading', { name: 'Your day, at a glance.' }),
    ).toBeInTheDocument()
  })
  it('shows useful empty dashboard and history states', async () => {
    const { user } = mount(
      '/dashboard',
      repository({
        version: 1,
        shifts: [],
        tasks: [],
        handoffs: [],
        reflections: [],
        learningNotes: [],
      }),
    )
    expect(await screen.findByText('Between shifts')).toBeInTheDocument()
    expect(screen.getByText('No handoff drafts')).toBeInTheDocument()
    expect(screen.getByText('No reflections yet')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Shift history' }))
    expect(await screen.findByText('No shifts yet')).toBeInTheDocument()
  })
})
