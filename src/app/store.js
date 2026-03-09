import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import restaurantReducer from './features/restaurantSlice';
import packageReducer from './features/packageSlice';
import reservationReducer from './features/reservationSlice';
import supportReducer from './features/supportSlice';
import reviewReducer from './features/reviewSlice';
import timeSlotReducer from './features/timeSlotSlice';
import notificationReducer from './features/notificationSlice';
import promotionReducer from './features/promotionSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        restaurants: restaurantReducer,
        packages: packageReducer,
        reservations: reservationReducer,
        support: supportReducer,
        reviews: reviewReducer,
        timeSlots: timeSlotReducer,
        notifications: notificationReducer,
        promotions: promotionReducer,
    }
});
