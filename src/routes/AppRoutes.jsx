import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import AuthLayout from '../layouts/AuthLayout';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from '../app/features/authSlice';
import AdminRoute from './AdminRoute';
import PublicGuard from './PublicGuard';
import OwnerGuard from './OwnerGuard';

// Public Pages
import HomePage from '../pages/public/HomePage';
import ListingPage from '../pages/public/ListingPage';
import DetailsPage from '../pages/public/DetailsPage';
import CheckoutPage from '../pages/booking/CheckoutPage'; // Will be renamed to ReservationPage or PaymentPage
import BecomePartnerPage from '../pages/public/BecomePartnerPage';
import FavoritesPage from '../pages/user/FavoritesPage';
import AboutPage from '../pages/public/AboutPage';
import ContactPage from '../pages/public/ContactPage';
import CommunityPage from '../pages/public/CommunityPage';
import TestimonialsPage from '../pages/public/TestimonialsPage';
import PrivacyPage from '../pages/public/PrivacyPage';
import TermsPage from '../pages/public/TermsPage';
import FAQPage from '../pages/public/FAQPage';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

import ProtectedRoute from './ProtectedRoute';

// Dashboard Pages
import UserDashboard from '../pages/dashboard/user/UserDashboard';
import UserReviewsPage from '../pages/dashboard/user/UserReviewsPage';
import OwnerDashboard from '../pages/dashboard/owner/OwnerDashboard';
import AdminDashboard from '../pages/dashboard/admin/AdminDashboard';
import ActivateSubscriptionPage from '../pages/dashboard/owner/ActivateSubscriptionPage';
import NotificationsPage from '../pages/dashboard/user/NotificationsPage';

const AppRoutes = () => {
    const dispatch = useDispatch();
    const { isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(loadUser());
        }
    }, [dispatch, isAuthenticated]);

    return (
        <Routes>
            {/* Public Routes - Wrapped in PublicGuard and MainLayout */}
            <Route element={<PublicGuard />}>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/restaurants" element={<ListingPage />} />
                    <Route path="/restaurants/:id" element={<DetailsPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                </Route>
            </Route>

            {/* Unrestricted MainLayout Routes (Like the Partner App) */}
            <Route element={<MainLayout />}>
                <Route path="/become-partner" element={<BecomePartnerPage />} />
                <Route path="/favorites" element={
                    <ProtectedRoute roles={['user']}>
                        <FavoritesPage />
                    </ProtectedRoute>
                } />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/testimonials" element={<TestimonialsPage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/notifications" element={
                    <ProtectedRoute roles={['user', 'owner', 'admin']}>
                        <NotificationsPage />
                    </ProtectedRoute>
                } />
            </Route>

            {/* Auth Routes - Wrapped in AuthLayout */}
            <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:resetToken" element={<ResetPasswordPage />} />
            </Route>

            {/* Dashboard Routes - Wrapped in DashboardLayout and Protected */}
            <Route element={<DashboardLayout />}>
                {/* User Routes */}
                <Route path="/dashboard/user" element={
                    <ProtectedRoute roles={['user']}>
                        <UserDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/dashboard/user/reviews" element={
                    <ProtectedRoute roles={['user']}>
                        <UserReviewsPage />
                    </ProtectedRoute>
                } />

                {/* Subscription Firewall Route */}
                <Route path="/activate-subscription" element={
                    <ProtectedRoute roles={['owner']}>
                        <ActivateSubscriptionPage />
                    </ProtectedRoute>
                } />

                {/* Owner Route Protected by OwnerGuard (Subscription check) */}
                <Route path="/dashboard/owner" element={
                    <ProtectedRoute roles={['owner']}>
                        <OwnerGuard>
                            <OwnerDashboard />
                        </OwnerGuard>
                    </ProtectedRoute>
                } />

                {/* Strictly Admin Locked */}
                <Route path="/dashboard/admin" element={
                    <ProtectedRoute roles={['admin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />

                {/* Unified Access Fallbacks */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <UserDashboard />
                    </ProtectedRoute>
                } />
            </Route>

            {/* Redirects & 404s */}
            <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
            <Route path="/owner" element={<Navigate to="/dashboard/owner" replace />} />
        </Routes>
    );
};

export default AppRoutes;
