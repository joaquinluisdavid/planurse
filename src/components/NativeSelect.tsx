import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function NativeSelect({
  className,
  ...props
}: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'border-input bg-card h-11 w-full rounded-md border px-3 text-sm disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
