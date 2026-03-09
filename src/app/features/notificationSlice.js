import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService } from '../../services/notification.service';

export const fetchNotifications = createAsyncThunk(
    'notifications/fetchNotifications',
    async (_, thunkAPI) => {
        try {
            return await notificationService.getUserNotifications();
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
        }
    }
);

export const markNotificationAsRead = createAsyncThunk(
    'notifications/markAsRead',
    async (id, thunkAPI) => {
        try {
            return await notificationService.markAsRead(id);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
        }
    }
);

export const markAllNotificationsAsRead = createAsyncThunk(
    'notifications/markAllAsRead',
    async (_, thunkAPI) => {
        try {
            return await notificationService.markAllAsRead();
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to mark all as read');
        }
    }
);

export const deleteNotification = createAsyncThunk(
    'notifications/delete',
    async (id, thunkAPI) => {
        try {
            await notificationService.deleteNotification(id);
            return id;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete notification');
        }
    }
);

const notificationSlice = createSlice({
    name: 'notifications',
    initialState: {
        list: [],
        unreadCount: 0,
        loading: false,
        error: null,
    },
    reducers: {
        // Called when a socket 'notification' event arrives
        receiveNotification: (state, action) => {
            const n = action.payload;
            // Avoid duplicates
            const exists = state.list.find(x => x._id === n._id);
            if (!exists) {
                state.list.unshift(n);
            }
            if (!n.read) {
                state.unreadCount += 1;
            }
        },
        clearNotifications: (state) => {
            state.list = [];
            state.unreadCount = 0;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload || [];
                // Backend uses `read` field (not `isRead`)
                state.unreadCount = state.list.filter(n => !n.read).length;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(markNotificationAsRead.fulfilled, (state, action) => {
                if (!action.payload) return;
                const index = state.list.findIndex(n => n._id === action.payload._id);
                if (index !== -1 && !state.list[index].read) {
                    state.list[index].read = true;
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            })
            .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
                state.list.forEach(n => { n.read = true; });
                state.unreadCount = 0;
            })
            .addCase(deleteNotification.fulfilled, (state, action) => {
                const wasUnread = state.list.find(n => n._id === action.payload && !n.read);
                state.list = state.list.filter(n => n._id !== action.payload);
                if (wasUnread) state.unreadCount = Math.max(0, state.unreadCount - 1);
            });
    }
});

export const { receiveNotification, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
