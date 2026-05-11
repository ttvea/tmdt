import api from './axios'

export interface GradeLevel {
  id: number
  name: string
}

export interface Subject {
  id: number
  name: string
  description: string | null
  gradeLevels: GradeLevel[]
}

export interface SubjectCategory {
  id: number
  name: string
  description: string | null
  subjects: Subject[]
}

export async function getCategories(): Promise<SubjectCategory[]> {
  const res = await api.get('/api/category/all')
  return res.data
}