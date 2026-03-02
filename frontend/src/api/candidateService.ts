import axios from 'axios'

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/candidates',
})

export interface Candidate {
  _id: string
  name: string
  email?: string
  role?: string
  status?: 'Applied' | 'Interviewing' | 'Hired' | 'Rejected'
  matchScore?: number
  aiSummary?: string
  resumeUrl?: string
}

export const fetchCandidates = async () => {
  const response = await api.get<{ success: boolean; data: Candidate[] }>('/')
  const body = response.data
  return Array.isArray(body?.data) ? body.data : []
}

export type CreateCandidateInput = {
  name: string
  email: string
  role?: string
}

export const createCandidate = async (input: CreateCandidateInput) => {
  const response = await api.post<{ success: boolean; data: Candidate }>('/', input)
  return response.data?.data
}

export const analyzeCandidate = async (id: string) => {
  const response = await api.put<{ success: boolean; data: Candidate }>(`/${id}/analyze`)
  return response.data?.data
}

export const uploadResume = async (id: string, file: File) => {
  const formData = new FormData()
  formData.append('resume', file)
  const response = await api.post<{ success: boolean; data: Candidate }>(`/${id}/resume`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data?.data
}

export const deleteCandidate = async (id: string) => {
  console.log('Making delete request for id:', id);
  try {
    const response = await api.delete<{ success: boolean; message: string }>(`/${id}`);
    console.log('Delete response:', response);
    return response.data?.success;
  } catch (error) {
    console.error('Delete request failed:', error);
    throw error;
  }
}

export const updateCandidateStatus = async (id: string, status: Candidate['status']) => {
  const response = await api.patch<{ success: boolean; data: Candidate }>(`/${id}/status`, { status })
  return response.data?.data
}

export default api
