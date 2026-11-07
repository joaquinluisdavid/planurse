import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '@/App'
import { DemoSessionProvider } from '@/demo/DemoSessionProvider'
import { demoSession } from '@/demo/session'
import { WorkspaceProvider } from '@/data/WorkspaceProvider'
import type { WorkspaceRepository } from '@/data/demoRepository'
import { createDemoWorkspace } from '@/demo/fixtures'
import type { Workspace } from '@/data/models'

function repository(initial = createDemoWorkspace()): WorkspaceRepository {
  let data = structuredClone(initial)
  return {
    load: vi.fn(async () => data),
    update: vi.fn(async (change: (workspace: Workspace) => Workspace) => {
      data = change(data)
      return data
    }),
    reset: vi.fn(async () => {
      data = createDemoWorkspace()
      return data
    }),
  }
}
function mount(
  path = '/shifts/shift-current',
  source = repository(),
  entered = true,
) {
  if (entered) demoSession.enter('new-rn')
  render(
    <MemoryRouter initialEntries={[path]}>
      <DemoSessionProvider>
        <WorkspaceProvider repository={source}>
          <AppRoutes />
        </WorkspaceProvider>
      </DemoSessionProvider>
    </MemoryRouter>,
  )
  return { user: userEvent.setup(), source }
}

describe('demo access boundary', () => {
  it('redirects protected demo pages to the entry screen', async () => {
    mount('/dashboard', repository(), false)
    expect(
      await screen.findByRole('heading', {
        name: 'A clearer start to every shift.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Demo entry is not authentication/),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Your day, at a glance.' }),
    ).not.toBeInTheDocument()
  })
  it('opens the selected demo perspective and restores the requested route', async () => {
    const { user } = mount('/shifts/shift-current', repository(), false)
    await user.click(screen.getByRole('link', { name: /Explore the demo/ }))
    await user.click(screen.getByRole('radio', { name: /Nursing student/ }))
    await user.click(
      screen.getByRole('button', { name: /Open fictional demo/ }),
    )
    expect(
      await screen.findByRole('heading', { name: /shift$/, level: 1 }),
    ).toBeInTheDocument()
    expect(demoSession.read()).toBe('student')
  })
  it('exits the demo and removes the entry session', async () => {
    const { user } = mount('/dashboard')
    await screen.findByRole('heading', { name: 'Your day, at a glance.' })
    await user.click(screen.getAllByRole('button', { name: 'Exit demo' })[0])
    expect(
      await screen.findByRole('heading', {
        name: 'A clearer start to every shift.',
      }),
    ).toBeInTheDocument()
    expect(demoSession.read()).toBeNull()
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
      within(dialog).getByLabelText('Fictional room'),
      'Demo room C',
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
    await user.selectOptions(screen.getByLabelText('Room'), 'Demo room A')
    await user.selectOptions(screen.getByLabelText('Priority filter'), 'urgent')
    expect(screen.getByText('No tasks match these filters')).toBeInTheDocument()
    await user.click(
      screen.getAllByRole('button', { name: 'Clear filters' })[0],
    )
    expect(
      screen.getByText('Prepare a fictional handoff outline'),
    ).toBeInTheDocument()
  })
  it('validates fictional room codes and makes the new room available to task forms', async () => {
    const { user } = mount()
    await screen.findByRole('heading', { name: 'Your tasks' })
    await user.click(screen.getByRole('button', { name: 'Add room' }))
    expect(
      await screen.findByText(
        'Use 1–12 letters, numbers, or hyphens for a fictional room code.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Add fictional room code')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    await user.type(screen.getByLabelText('Add fictional room code'), 'd')
    await user.click(screen.getByRole('button', { name: 'Add room' }))
    await waitFor(() =>
      expect(screen.getByLabelText('Add fictional room code')).toHaveValue(''),
    )
    await user.click(screen.getByRole('button', { name: 'Add a task' }))
    expect(
      within(screen.getByLabelText('Fictional room')).getByRole('option', {
        name: 'Demo room D',
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
      screen.queryByText('Prepare a fictional handoff outline'),
    ).not.toBeInTheDocument()
  })
  it('edits and deletes a task after confirmation', async () => {
    const { user } = mount()
    const title = 'Prepare a fictional handoff outline'
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
    const initial = createDemoWorkspace()
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
    const initial = createDemoWorkspace()
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
      .mockResolvedValue(createDemoWorkspace())
    const { user } = mount('/dashboard', source)
    expect(
      await screen.findByText('Cannot load demo workspace: Offline'),
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
      }),
    )
    expect(await screen.findByText('Between shifts')).toBeInTheDocument()
    expect(screen.getByText('No handoff drafts')).toBeInTheDocument()
    expect(screen.getByText('No reflections yet')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Shift history' }))
    expect(await screen.findByText('No shifts yet')).toBeInTheDocument()
  })
})
