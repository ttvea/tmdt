import type { ReactNode } from 'react'

type AccountPageHeaderProps = {
  title: string
  action?: ReactNode
}

export function AccountPageHeader({ title, action }: AccountPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <p className="text-2xl font-bold text-blue-900">{title}</p>
      {action}
    </div>
  )
}
