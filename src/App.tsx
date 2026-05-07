import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Dashboard } from './pages/Dashboard';
import { Vault } from './pages/Vault';
import { Settings } from './pages/Settings';
import { Scan } from './pages/Scan';
import { AssetDetail } from './pages/AssetDetail';
import { Success } from './pages/Success';
import { Auth } from './pages/Auth';
import { Landing } from './pages/Landing';
import { BottomNav } from './components/layout/BottomNav';
import { AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/auth" />;
  
  return <>{children}</>;
}

function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const noNavPaths = ['/auth', '/landing', '/scan', '/success'];
  const showNav = !noNavPaths.includes(location.pathname);

  return (
    <>
      <div className="atmosphere" />
      {children}
      {showNav && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" expand={false} richColors theme="dark" />
      <Router>
        <NavigationWrapper>
          <Routes>
            <Route path="/landing" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            
            <Route path="/" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            
            <Route path="/vault" element={
              <PrivateRoute>
                <Vault />
              </PrivateRoute>
            } />
            
            <Route path="/settings" element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            } />
            
            <Route path="/scan" element={
              <PrivateRoute>
                <Scan />
              </PrivateRoute>
            } />
            
            <Route path="/asset/:id" element={
              <PrivateRoute>
                <AssetDetail />
              </PrivateRoute>
            } />

            <Route path="/success" element={
              <PrivateRoute>
                <Success />
              </PrivateRoute>
            } />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </NavigationWrapper>
      </Router>
    </AuthProvider>
  );
}
