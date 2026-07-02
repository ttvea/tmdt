import { AccountPageHeader } from './AccountPageHeader'
import type { ReactNode } from 'react'

type TutorPageHeaderProps = {
  title: string
  action?: ReactNode
}

export function TutorPageHeader({ title, action }: TutorPageHeaderProps) {
  return <AccountPageHeader title={title} action={action} />
}
