import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import KisanDostChatbot from "@/components/KisanDostChatbot";
import Dashboard from "@/pages/Dashboard";
import Diagnose from "@/pages/Diagnose";
import CropAdvisor from "@/pages/CropAdvisor";
import Community from "@/pages/Community";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/diagnose" element={<Diagnose />} />
          <Route path="/crops" element={<CropAdvisor />} />
          <Route path="/community" element={<Community />} />
          <Route path="/profile" element={<Profile />} />
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <ThemeInitializer>
        <BrowserRouter>
          <AnimatedRoutes />
          <BottomNav />
          <KisanDostChatbot />
        </BrowserRouter>
      </ThemeInitializer>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
