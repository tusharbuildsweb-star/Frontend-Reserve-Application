import api from './api';

export const reservationService = {
    create: async (reservationData) => {
        const { data } = await api.post('reservations', reservationData);
        return data;
    },
    getUserReservations: async () => {
        const { data } = await api.get('reservations/user');
        return data;
    },
    getOwnerReservations: async () => {
        const { data } = await api.get('reservations/owner');
        return data;
    },
    cancel: async (id) => {
        const { data } = await api.put(`reservations/${id}/cancel`);
        return data;
    },
    updateStatus: async (id, statusData) => {
        const { data } = await api.put(`reservations/${id}/status`, statusData);
        return data;
    },
    reschedule: async (id, rescheduleData) => {
        const { data } = await api.put(`reservations/${id}/reschedule`, rescheduleData);
        return data;
    }
};
