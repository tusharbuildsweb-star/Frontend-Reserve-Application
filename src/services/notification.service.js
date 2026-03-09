import api from './api';

export const notificationService = {
    getUserNotifications: async () => {
        const { data } = await api.get('notifications');
        return data;
    },
    markAsRead: async (id) => {
        const { data } = await api.put(`notifications/${id}/read`);
        return data;
    },
    markAllAsRead: async () => {
        const { data } = await api.put('notifications/mark-all-read');
        return data;
    },
    deleteNotification: async (id) => {
        const { data } = await api.delete(`notifications/${id}`);
        return data;
    },
    getUnreadCount: async () => {
        const { data } = await api.get('notifications/unread-count');
        return data.count;
    }
};
