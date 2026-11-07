import { useId } from 'react'
import { Pencil, Trash2, Clock3 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PriorityBadge } from './PriorityBadge'
import { isOverdue } from './selectors'
import type { Task } from '@/data/models'
import { formatDue } from '@/lib/dates'
import { cn } from '@/lib/utils'

type TaskRowProps = {
  task: Task
  now: number
  readOnly: boolean
  busy: boolean
  onComplete: (complete: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

export function TaskRow({
  task,
  now,
  readOnly,
  busy,
  onComplete,
  onEdit,
  onDelete,
}: TaskRowProps) {
  const checkboxId = useId()
  const overdue = isOverdue(task, now)
  return (
    <li
      className={cn(
        'rounded-xl border bg-white p-4',
        overdue && !readOnly && 'border-red-200 bg-red-50/40',
      )}
    >
      <div className="flex items-start gap-3">
        <label
          htmlFor={checkboxId}
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center"
        >
          <Checkbox
            id={checkboxId}
            aria-label={`${task.completedAt ? 'Reopen' : 'Complete'} task: ${task.title}`}
            checked={!!task.completedAt}
            disabled={readOnly || busy}
            onCheckedChange={(checked) => onComplete(checked === true)}
            className="size-5"
          />
        </label>
        <div className="min-w-0 flex-1 pt-1">
          <p
            className={cn(
              'text-sm font-semibold break-words',
              task.completedAt && 'text-muted-foreground line-through',
            )}
          >
            {task.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={task.priority} />
            <span className="text-muted-foreground text-xs">
              {task.patientLabel || 'Shift-wide'}
            </span>
            {task.completedAt && <Badge variant="secondary">Complete</Badge>}
          </div>
          {task.dueAt && (
            <p
              className={cn(
                'mt-2 flex items-center gap-1 text-xs',
                overdue && !readOnly
                  ? 'font-medium text-red-800'
                  : 'text-muted-foreground',
              )}
            >
              <Clock3 aria-hidden="true" className="size-3.5" />
              {overdue
                ? readOnly
                  ? 'Unfinished · Was due'
                  : 'Overdue · Due'
                : 'Due'}{' '}
              {formatDue(task.dueAt)}
            </p>
          )}
        </div>
        {!readOnly && (
          <div className="flex flex-col sm:flex-row">
            <Button
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label={`Edit task: ${task.title}`}
              title="Edit task"
              disabled={busy}
              onClick={onEdit}
            >
              <Pencil aria-hidden="true" className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive size-11"
              aria-label={`Delete task: ${task.title}`}
              title="Delete task"
              disabled={busy}
              onClick={onDelete}
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </li>
  )
}
