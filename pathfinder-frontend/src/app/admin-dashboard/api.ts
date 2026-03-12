import fastAxiosInstance from '@/axiosConfig/axiosfig';

export const adminAnalyticsApi = {
    get: () => fastAxiosInstance.get('/api/admin/analytics'),
};
