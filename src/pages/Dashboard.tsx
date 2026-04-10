import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Sprout, Wheat, Bug, Clock,
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import GlassCard from '@/components/GlassCard';
import FloatingSection from '@/components/FloatingSection';
import MandiTicker from '@/components/MandiTicker';
import HeroSlider from '@/components/HeroSlider';
import GPSWeatherCard from '@/components/Dashboard/GPSWeatherCard';
import { useConnectivity } from '@/utils/connectivity';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isSlowConnection } = useConnectivity();

  const quickActions = [
    { icon: Sprout, label: t('dashboard.soil_analysis'), path: '/diagnose', color: 'text-earth' },
    { icon: Wheat, label: t('dashboard.my_crops'), path: '/crops', color: 'text-secondary' },
    { icon: Bug, label: t('dashboard.disease_check'), path: '/diagnose', color: 'text-destructive', pulse: true },
    { icon: Clock, label: t('history.title'), path: '/history', color: 'text-primary' },
    { icon: Sprout, label: '🌾 Farm Portfolio', path: '/farm-portfolio', color: 'text-primary' },
    { icon: Wheat, label: '🛒 Krishi Market', path: '/marketplace', color: 'text-accent' },
  ];

  return (
    <div className="ether-bg pb-20 bg-green-50">
      <TopBar />
      <main className="px-4 py-4 max-w-lg mx-auto space-y-5">
        {/* Welcome */}
        <FloatingSection index={0} float="none">
          <h2 className="text-2xl font-bold text-foreground">{t('dashboard.welcome')}</h2>
          <p className="text-muted-foreground text-sm">🌾 {t('app_name')}</p>
        </FloatingSection>

        {/* Hero Slider */}
        <FloatingSection index={1} float="none">
          <HeroSlider />
        </FloatingSection>

        {/* Mandi Ticker */}
        <FloatingSection index={2} float="none">
          <MandiTicker />
        </FloatingSection>

        {/* GPS Weather with Location Sync */}
        <FloatingSection index={2} float="slow">
          <GPSWeatherCard />
        </FloatingSection>

        {/* Quick Actions */}
        <FloatingSection index={4} float="slow">
          <h3 className="font-semibold text-foreground mb-3">{t('dashboard.quick_actions')}</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <GlassCard key={action.label} onClick={() => navigate(action.path)} className="flex flex-col items-center gap-3 py-6">
                <div className={action.pulse && !isSlowConnection ? 'animate-pulse-scale' : ''}>
                  <action.icon size={32} className={action.color} />
                </div>
                <span className="text-sm font-medium text-foreground text-center">{action.label}</span>
              </GlassCard>
            ))}
          </div>
        </FloatingSection>

        {/* Recent Activity */}
        <FloatingSection index={5} float="medium">
          <h3 className="font-semibold text-foreground mb-3">{t('dashboard.recent_activity')}</h3>
          <GlassCard className="flex items-center justify-center py-8">
            <p className="text-muted-foreground text-sm">{t('dashboard.no_activity')}</p>
          </GlassCard>
        </FloatingSection>
      </main>
    </div>
  );
};

export default Dashboard;
