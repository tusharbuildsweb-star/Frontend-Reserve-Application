# RESERVE - Luxury Restaurant Reservation Platform (Frontend)

A premium, production-ready web application designed for a high-end restaurant discovery and booking experience. RESERVE combines a cinematic "Dark Luxury" aesthetic with real-time functionality and personalized service suggestions.

## ✨ Design Philosophy

- **Luxury Aesthetic**: Deep obsidian backgrounds with brushed gold accents (#F5B942).
- **Cinematic Interactions**: Smooth transitions using Framer Motion and glassmorphism UI components.
- **Responsive Layout**: Fluid experience across mobile, tablet, and desktop.
- **Micro-Animations**: Purposeful animations for notifications, hover states, and data loading.

## 🚀 Technology Stack

- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS 4.0 (for logic) / Custom Vanilla CSS (for luxury polish)
- **State Management**: Redux Toolkit
- **Routing**: React Router DOM
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Real-time**: Socket.IO Client

## 🛠️ Key Features

Based on implemented core requirements:

### 1. Advanced Reservation Flow
- **Unified Booking Bar**: Integrated search for restaurant, location, date, and guests.
- **Dynamic Availability**: Instant visual feedback on slot availability.
- **User Dashboard**: Dedicated views for **Upcoming** and **History** reservations.
- **Request Management**: Ability for users to **Cancel** or **Modify** reservations directly from their dashboard.

### 2. Immersive Restaurant Profiles
- **Rich Media**: High-quality image galleries for cada restaurant.
- **Consolidated Information**: Seamless access to menus, experience packages, location maps, and operating hours.
- **Direct Interaction**: One-click booking flow from the profile page.

### 3. Review & Feedback System
- **Interactive Reviews**: Star ratings, detailed text feedback, and photo uploads.
- **Self-Service**: Tools for users to manage their own reviews (Edit/Delete).
- **Luxury UI**: Condensed, scannable review cards with a "View All" toggle for high-volume content.

### 4. Search & Smart Filters
- **Global Search**: Find establishments by cuisine type, name, or location.
- **Refined Filtering**: Advanced filters for ambiance, dietary needs, price points, and special features like outdoor seating.

### 5. Recommendation System
- **"Recommended for You"**: A personalized section in the user dashboard suggests new dining spots based on past bookings and review history.

### 6. Command Center (Admin & Owner Dashboards)
- **Real-Time Analytics**: Visual tracking of revenue, active users, and booking trends.
- **Moderation Tools**: Centralized control for editing restaurant listings and managing user reviews.
- **Pagination**: Performance-optimized navigation for large datasets (Users, Restaurants, Payments).

## 🏗️ Project Structure

```text
frontend/
├── src/
│   ├── app/           # Redux store & global slices
│   ├── components/    # Reusable UI components (Navbar, Modals, etc.)
│   ├── pages/         # Page-level components
│   │   ├── auth/      # Login/Register
│   │   ├── dashboard/ # Admin, Owner, and User dashboards
│   │   └── restaurant/# Profile and search views
│   ├── utils/         # API helpers and logic utilities
│   └── App.jsx        # Routing and global provider setup
├── public/            # Static assets
└── index.html         # Entry point
```

## 🚦 Getting Started

1.  **Environment Setup**:
    Create a `.env` file in the frontend root:
    ```env
    VITE_API_URL=http://localhost:5000
    VITE_SOCKET_URL=http://localhost:5000
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Launch Platform**:
    ```bash
    npm run dev
    ```
