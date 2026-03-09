import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchOwnerPromotions = createAsyncThunk(
    'promotions/fetchOwner',
    async (_, thunkAPI) => {
        try {
            const response = await api.get('promotions/owner');
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch owner promotions');
        }
    }
);

export const fetchAdminPromotions = createAsyncThunk(
    'promotions/fetchAdmin',
    async (_, thunkAPI) => {
        try {
            const response = await api.get('promotions/admin');
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch admin promotions');
        }
    }
);

export const createPromotion = createAsyncThunk(
    'promotions/create',
    async (promotionData, thunkAPI) => {
        try {
            const response = await api.post('promotions/create', promotionData);
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create promotion');
        }
    }
);

export const approvePromotion = createAsyncThunk(
    'promotions/approve',
    async (id, thunkAPI) => {
        try {
            const response = await api.put(`promotions/${id}/approve`);
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to approve promotion');
        }
    }
);

export const rejectPromotion = createAsyncThunk(
    'promotions/reject',
    async ({ id, adminMessage }, thunkAPI) => {
        try {
            const response = await api.put(`promotions/${id}/reject`, { adminMessage });
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to reject promotion');
        }
    }
);

const promotionSlice = createSlice({
    name: 'promotions',
    initialState: {
        ownerList: [],
        adminList: [],
        loading: false,
        error: null,
        successMessage: null
    },
    reducers: {
        clearPromotionMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Owner Promotions
            .addCase(fetchOwnerPromotions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOwnerPromotions.fulfilled, (state, action) => {
                state.loading = false;
                state.ownerList = action.payload;
            })
            .addCase(fetchOwnerPromotions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch Admin Promotions
            .addCase(fetchAdminPromotions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAdminPromotions.fulfilled, (state, action) => {
                state.loading = false;
                state.adminList = action.payload;
            })
            .addCase(fetchAdminPromotions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Create Promotion
            .addCase(createPromotion.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createPromotion.fulfilled, (state, action) => {
                state.loading = false;
                state.ownerList = [action.payload, ...state.ownerList];
                state.successMessage = 'Promotion requested successfully!';
            })
            .addCase(createPromotion.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Approve Promotion
            .addCase(approvePromotion.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(approvePromotion.fulfilled, (state, action) => {
                state.loading = false;
                const updatedIndex = state.adminList.findIndex(p => p._id === action.payload._id);
                if (updatedIndex !== -1) {
                    state.adminList[updatedIndex] = action.payload;
                }
                state.successMessage = 'Promotion approved!';
            })
            .addCase(approvePromotion.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Reject Promotion
            .addCase(rejectPromotion.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(rejectPromotion.fulfilled, (state, action) => {
                state.loading = false;
                const updatedIndex = state.adminList.findIndex(p => p._id === action.payload._id);
                if (updatedIndex !== -1) {
                    state.adminList[updatedIndex] = action.payload;
                }
                state.successMessage = 'Promotion rejected.';
            })
            .addCase(rejectPromotion.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearPromotionMessages } = promotionSlice.actions;
export default promotionSlice.reducer;
