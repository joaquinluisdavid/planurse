import { Badge } from '@/components/ui/badge'
import type { Task } from '@/data/models'

const styles = {
  routine: 'border-slate-200 bg-slate-50 text-slate-700',
  important: 'border-amber-200 bg-amber-50 text-amber-900',
  urgent: 'border-red-200 bg-red-50 text-red-800',
}
export function PriorityBadge({ priority }: { priority: Task['priority'] }) {
  return (
    <Badge variant="outline" className={styles[priority]}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  )
}
