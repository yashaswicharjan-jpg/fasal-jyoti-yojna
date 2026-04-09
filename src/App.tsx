import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import KisanDostChatbot from "@/components/KisanDostChatbot";
import OfflineBanner from "@/components/OfflineBanner";
import InstallPrompt from "@/components/InstallPrompt";
import EtherBackground from "@/components/EtherBackground";
import Dashboard from "@/pages/Dashboard";
import Diagnose from "@/pages/Diagnose";
import CropAdvisor from "@/pages/CropAdvisor";
import Community from "@/pages/Community";
import Profile from "@/pages/Profile";
import FarmHistory from "@/pages/FarmHistory";
import FarmPortfolio from "@/pages/FarmPortfolio";
import Marketplace from "@/pages/Marketplace";
import SoilTestGuide from "@/pages/SoilTestGuide";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useConnectivity } from "@/utils/connectivity";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.span
        animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-5xl"
      >
        🌾
      </motion.span>
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

// Warp-speed page transition
const pageVariants = {
  initial: { opacity: 0, scale: 0.96, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 1.03, y: -10 },
};

const pageTransition = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 25,
  mass: 0.8,
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const { isSlowConnection } = useConnectivity();
  const { user } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={isSlowConnection ? undefined : pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={isSlowConnection ? { duration: 0 } : pageTransition}
      >
        <Routes location={location}>
          <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/diagnose" element={<ProtectedRoute><Diagnose /></ProtectedRoute>} />
          <Route path="/crops" element={<ProtectedRoute><CropAdvisor /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><FarmHistory /></ProtectedRoute>} />
          <Route path="/farm-portfolio" element={<ProtectedRoute><FarmPortfolio /></ProtectedRoute>} />
          <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
          <Route path="/soil-test" element={<ProtectedRoute><SoilTestGuide /></ProtectedRoute>} />
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
      <EtherBackground />
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
