import api from './api';

export const authService = {
    login: async (credentials) => {
        const { data } = await api.post('auth/login', credentials);
        return data;
    },
    register: async (userData) => {
        const { data } = await api.post('auth/register', userData);
        return data;
    },
    getMe: async () => {
        const { data } = await api.get('auth/me');
        return data;
    },
    updateProfile: async (formData) => {
        const { data } = await api.put('users/profile', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    },
    logout: async () => {
        const { data } = await api.post('auth/logout');
        return data;
    },
    getRecommendations: async () => {
        const { data } = await api.get('users/recommendations');
        return data;
    }
};
