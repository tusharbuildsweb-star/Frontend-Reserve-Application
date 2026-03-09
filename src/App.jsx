import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import OnboardingModal from './components/common/OnboardingModal';

import { AlertProvider } from './context/AlertContext';
import SiteAlertModal from './components/common/SiteAlertModal';

function App() {
  return (
    <AlertProvider>
      <BrowserRouter>
        <OnboardingModal />
        <AppRoutes />
        <SiteAlertModal />
      </BrowserRouter>
    </AlertProvider>
  );
}

export default App;
