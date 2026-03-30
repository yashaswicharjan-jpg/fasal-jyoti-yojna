import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import KisanDostChatbot from "@/components/KisanDostChatbot";
import OfflineBanner from "@/components/OfflineBanner";
import InstallPrompt from "@/components/InstallPrompt";
import Dashboard from "@/pages/Dashboard";
import Diagnose from "@/pages/Diagnose";
import CropAdvisor from "@/pages/CropAdvisor";
import Community from "@/pages/Community";
import Profile from "@/pages/Profile";
import FarmHistory from "@/pages/FarmHistory";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useConnectivity } from "@/utils/connectivity";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><span className="text-4xl animate-pulse">🌾</span></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const { isSlowConnection } = useConnectivity();
  const { user } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={isSlowConnection ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={isSlowConnection ? undefined : { opacity: 0, y: -10 }}
        transition={{ duration: isSlowConnection ? 0 : 0.25 }}
      >
        <Routes location={location}>
          <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/diagnose" element={<ProtectedRoute><Diagnose /></ProtectedRoute>} />
          <Route path="/crops" element={<ProtectedRoute><CropAdvisor /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><FarmHistory /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const ThemeInitializer = ({ children }: { children: React.ReactNode }) => {
  const { isDark } = useAppStore();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);
  return <>{children}</>;
};

const registerSW = () => {
  if (!('serviceWorker' in navigator)) return;
  const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
  const isPreviewHost = window.location.hostname.includes('id-preview--') || window.location.hostname.includes('lovableproject.com');
  if (isPreviewHost || isInIframe) {
    navigator.serviceWorker?.getRegistrations().then((regs) => { regs.forEach((r) => r.unregister()); });
    return;
  }
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
};

registerSW();

const AppContent = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';

  return (
    <>
      <OfflineBanner />
      <AnimatedRoutes />
      {user && !isAuthPage && <BottomNav />}
      {user && !isAuthPage && <KisanDostChatbot />}
      <InstallPrompt />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <ThemeInitializer>
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </ThemeInitializer>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
