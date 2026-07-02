import type { ReactNode } from 'react'

type AccountPageContainerProps = {
  children: ReactNode
  className?: string
}

export function AccountPageContainer({ children, className = '' }: AccountPageContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-6 py-8 ${className}`}>
      {children}
    </div>
  )
}
