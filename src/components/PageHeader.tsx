import { useEffect, type ReactNode } from 'react'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps) {
  useEffect(() => {
    document.title = `${title} | Planurse`
  }, [title])
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-primary mb-2 text-xs font-semibold tracking-[0.16em] uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-relaxed">
          {description}
        </p>
      </div>
      {action}
    </header>
  )
}
