import api from './api';

export const restaurantService = {
    getAll: async (params) => {
        const { data } = await api.get('restaurants', { params });
        return data;
    },
    search: async (query) => {
        const { data } = await api.get('restaurants/search', { params: query });
        return data;
    },
    getById: async (id) => {
        const { data } = await api.get(`restaurants/${id}`);
        return data;
    },
    create: async (restaurantData) => {
        const { data } = await api.post('restaurants', restaurantData);
        return data;
    },
    update: async (id, restaurantData) => {
        const { data } = await api.put(`restaurants/${id}`, restaurantData);
        return data;
    },
    updateCrowdLevel: async (id, levelData) => {
        const { data } = await api.put(`restaurants/${id}/crowd`, levelData);
        return data;
    },
    getRecommendations: async (id) => {
        const { data } = await api.get(`restaurants/${id}/recommendations`);
        return data;
    }
};
