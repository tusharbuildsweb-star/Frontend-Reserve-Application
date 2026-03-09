import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchUserReservations = createAsyncThunk(
    'reservations/fetchUser',
    async (_, thunkAPI) => {
        try {
            const response = await api.get('reservations/user');
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch reservations');
        }
    }
);

export const createReservation = createAsyncThunk(
    'reservations/create',
    async (reservationData, thunkAPI) => {
        try {
            const response = await api.post('reservations', reservationData);
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create reservation');
        }
    }
);

export const fetchOwnerReservations = createAsyncThunk(
    'reservations/fetchOwner',
    async (_, thunkAPI) => {
        try {
            const response = await api.get('reservations/owner');
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch owner reservations');
        }
    }
);

export const updateReservationStatus = createAsyncThunk(
    'reservations/updateStatus',
    async ({ id, status }, thunkAPI) => {
        try {
            const response = await api.put(`reservations/${id}/status`, { status });
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update status');
        }
    }
);

export const approveReservation = createAsyncThunk(
    'reservations/approve',
    async (id, thunkAPI) => {
        try {
            const response = await api.put(`reservations/${id}/approve`);
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to approve reservation');
        }
    }
);

export const rejectReservation = createAsyncThunk(
    'reservations/reject',
    async (id, thunkAPI) => {
        try {
            const response = await api.put(`reservations/${id}/reject`);
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to reject reservation');
        }
    }
);

export const cancelReservation = createAsyncThunk(
    'reservations/cancel',
    async (id, thunkAPI) => {
        try {
            const response = await api.put(`reservations/${id}/cancel`);
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to cancel reservation');
        }
    }
);

const reservationSlice = createSlice({
    name: 'reservations',
    initialState: {
        list: [],          // owner reservations
        upcoming: [],      // user upcoming confirmed bookings
        history: [],       // user past/cancelled bookings
        currentReservation: null,
        loading: false,
        error: null,
        successMessage: null
    },
    reducers: {
        clearReservationMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch User Reservations
            .addCase(fetchUserReservations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserReservations.fulfilled, (state, action) => {
                state.loading = false;
                // Backend returns { upcoming: [], history: [] }
                if (action.payload?.upcoming !== undefined) {
                    state.upcoming = action.payload.upcoming || [];
                    state.history = action.payload.history || [];
                } else {
                    // Fallback: flat array (old format)
                    state.upcoming = action.payload || [];
                    state.history = [];
                }
            })
            .addCase(fetchUserReservations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Create Reservation
            .addCase(createReservation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createReservation.fulfilled, (state, action) => {
                state.loading = false;
                state.currentReservation = action.payload; // backend returns directly, no .data wrapper
                state.successMessage = 'Reservation confirmed successfully!';
            })
            .addCase(createReservation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch Owner Reservations
            .addCase(fetchOwnerReservations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOwnerReservations.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(fetchOwnerReservations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Update Reservation Status
            .addCase(updateReservationStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateReservationStatus.fulfilled, (state, action) => {
                state.loading = false;
                const updatedIndex = state.list.findIndex(r => r._id === action.payload._id);
                if (updatedIndex !== -1) {
                    state.list[updatedIndex] = action.payload;
                }
            })
            .addCase(updateReservationStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Approve Reservation
            .addCase(approveReservation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(approveReservation.fulfilled, (state, action) => {
                state.loading = false;
                const updatedIndex = state.list.findIndex(r => r._id === action.payload._id);
                if (updatedIndex !== -1) {
                    state.list[updatedIndex] = action.payload;
                }
                state.successMessage = 'Reservation approved successfully';
            })
            .addCase(approveReservation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Reject Reservation
            .addCase(rejectReservation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(rejectReservation.fulfilled, (state, action) => {
                state.loading = false;
                const updatedIndex = state.list.findIndex(r => r._id === action.payload._id);
                if (updatedIndex !== -1) {
                    state.list[updatedIndex] = action.payload;
                }
                state.successMessage = 'Reservation rejected successfully';
            })
            .addCase(rejectReservation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Cancel Reservation
            .addCase(cancelReservation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(cancelReservation.fulfilled, (state, action) => {
                state.loading = false;
                // Move from upcoming to history or update status in upcoming
                state.upcoming = state.upcoming.filter(r => r._id !== action.payload._id);
                state.history = [action.payload, ...state.history];
                state.successMessage = 'Reservation cancelled successfully';
            })
            .addCase(cancelReservation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearReservationMessages } = reservationSlice.actions;
export default reservationSlice.reducer;
