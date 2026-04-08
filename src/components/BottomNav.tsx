import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Leaf, Wheat, Users, User } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { path: '/', icon: Home, key: 'nav.home' },
  { path: '/diagnose', icon: Leaf, key: 'nav.diagnose' },
  { path: '/crops', icon: Wheat, key: 'nav.crops' },
  { path: '/community', icon: Users, key: 'nav.community' },
  { path: '/profile', icon: User, key: 'nav.profile' },
];

const BottomNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 liquid-glass-nav border-t border-border/30 safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              whileTap={{ scale: 0.9 }}
              className={`relative flex flex-col items-center gap-1 py-2 px-3 min-h-[56px] min-w-[56px] transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <motion.div
                animate={active ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              </motion.div>
              <span className="text-[10px] font-medium">{t(tab.key)}</span>
              {/* Liquid drop indicator */}
              {active && (
                <motion.div
                  layoutId="nav-drop"
                  className="absolute -bottom-0.5 w-5 h-1 rounded-full bg-primary animate-drop-form"
                  style={{
                    boxShadow: '0 2px 8px hsl(var(--glow-primary) / 0.4)',
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
