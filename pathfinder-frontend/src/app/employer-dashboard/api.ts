import fastAxiosInstance from '@/axiosConfig/axiosfig';

// Centralized API service layer storing every backend call that frontend needs

export const jobDescriptionApi = {
    list: (params: { status?: string; include_deleted?: boolean; include_expired?: boolean; page?: number; page_size?: number }) =>
        fastAxiosInstance.get('/api/job-descriptions', { params }),

    get: (id: string) => fastAxiosInstance.get(`/api/job-descriptions/${id}`),

    create: (data: Record<string, unknown>) => fastAxiosInstance.post('/api/job-descriptions', data),

    update: (id: string, data: Record<string, unknown>) => fastAxiosInstance.put(`/api/job-descriptions/${id}`, data),

    publish: (id: string) => fastAxiosInstance.post(`/api/job-descriptions/${id}/publish`),

    unpublish: (id: string) => fastAxiosInstance.post(`/api/job-descriptions/${id}/unpublish`),

    duplicate: (id: string) => fastAxiosInstance.post(`/api/job-descriptions/${id}/duplicate`),

    delete: (id: string) => fastAxiosInstance.delete(`/api/job-descriptions/${id}`)
};


export const templateApi = {
    list: (params?: {industry?: string; job_title?: string; seniority_level?: string}) =>
        fastAxiosInstance.get('/api/templates', { params }),

    get: (id: string) => fastAxiosInstance.get(`/api/templates/${id}`),

};

export const skillApi = {
    search: (q: string) => fastAxiosInstance.get('/api/skills', { params: { q } })
};