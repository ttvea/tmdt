import api from './axios'

export interface RatingResponse {
  id: number
  studentId: number
  nameStudent: string
  avatar: string | null
  tutorId: number
  stars: number
  comment: string | null
  createdAt: string
}

export interface CreateRatingRequest {
  tutorId: number
  stars: number
  comment?: string
}

export async function getTutorRatings(tutorId: number): Promise<RatingResponse[]> {
  const res = await api.get(`/api/ratings/tutor/${tutorId}`)
  return res.data
}

export async function getAverageRating(tutorId: number): Promise<number> {
  const res = await api.get(`/api/ratings/tutor/${tutorId}/average`)
  return res.data
}

export async function createRating(request: CreateRatingRequest) {
  const res = await api.post('/api/ratings', request)
  return res.data
}

export interface UpdateRatingRequest {
  stars?: number
  comment?: string
}

export async function updateRating(ratingId: number, request: UpdateRatingRequest) {
  const res = await api.put(`/api/ratings/${ratingId}`, request)
  return res.data
}

export async function deleteRating(ratingId: number) {
  const res = await api.delete(`/api/ratings/${ratingId}`)
  return res.data
}

export default {}
