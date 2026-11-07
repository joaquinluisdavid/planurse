import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/NativeSelect'
import { Button } from '@/components/ui/button'
import type { TaskFilters } from './selectors'

export function TaskFilterBar({
  filters,
  labels,
  onChange,
}: {
  filters: TaskFilters
  labels: string[]
  onChange: (filters: TaskFilters) => void
}) {
  return (
    <div className="mb-5 rounded-xl border bg-white p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="filter-room">Room</Label>
          <NativeSelect
            id="filter-room"
            value={filters.patient}
            onChange={(event) =>
              onChange({ ...filters, patient: event.target.value })
            }
          >
            <option value="all">All rooms</option>
            <option value="">Shift-wide</option>
            {labels.map((label) => (
              <option key={label}>{label}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-priority">Priority filter</Label>
          <NativeSelect
            id="filter-priority"
            value={filters.priority}
            onChange={(event) =>
              onChange({ ...filters, priority: event.target.value })
            }
          >
            <option value="all">All priorities</option>
            <option value="routine">Routine</option>
            <option value="important">Important</option>
            <option value="urgent">Urgent</option>
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-completion">Completion</Label>
          <NativeSelect
            id="filter-completion"
            value={filters.completion}
            onChange={(event) =>
              onChange({ ...filters, completion: event.target.value })
            }
          >
            <option value="all">All tasks</option>
            <option value="active">Active tasks</option>
            <option value="completed">Completed tasks</option>
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-due">Due time</Label>
          <NativeSelect
            id="filter-due"
            value={filters.due}
            onChange={(event) =>
              onChange({ ...filters, due: event.target.value })
            }
          >
            <option value="all">Any time</option>
            <option value="overdue">Overdue</option>
            <option value="next-hour">Next hour</option>
            <option value="none">No due time</option>
          </NativeSelect>
        </div>
      </div>
      <Button
        variant="ghost"
        className="mt-2 h-11 px-1 text-xs"
        onClick={() =>
          onChange({
            patient: 'all',
            priority: 'all',
            completion: 'all',
            due: 'all',
          })
        }
      >
        Clear filters
      </Button>
    </div>
  )
}
