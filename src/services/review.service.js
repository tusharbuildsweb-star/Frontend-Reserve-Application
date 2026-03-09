import api from './api';

export const reviewService = {
    getUserReviews: async () => {
        const { data } = await api.get('users/reviews');
        return data;
    },
    getRestaurantReviews: async (restaurantId) => {
        const { data } = await api.get(`reviews/${restaurantId}`);
        return data;
    },
    addReview: async (reviewData) => {
        const { data } = await api.post('reviews', reviewData);
        return data;
    },
    deleteReview: async (reviewId) => {
        const { data } = await api.delete(`reviews/${reviewId}`);
        return data;
    },
    updateReview: async (id, reviewData) => {
        const { data } = await api.put(`reviews/${id}`, reviewData);
        return data;
    },
    ownerReply: async (reviewId, replyText) => {
        const { data } = await api.put(`reviews/${reviewId}/reply`, { replyText });
        return data;
    }
};

