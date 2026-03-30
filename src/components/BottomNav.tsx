import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Leaf, Wheat, Users, User } from 'lucide-react';

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 py-2 px-3 min-h-[56px] min-w-[56px] transition-all ${
                active
                  ? 'text-primary scale-105'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{t(tab.key)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
