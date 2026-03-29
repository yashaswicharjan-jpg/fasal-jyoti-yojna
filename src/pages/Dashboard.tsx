import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sprout,
  Wheat,
  Bug,
  Users,
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import GlassCard from '@/components/GlassCard';
import SeedLoader from '@/components/SeedLoader';
import WeeklyForecast from '@/components/WeeklyForecast';
import { useConnectivity } from '@/utils/connectivity';

interface WeatherData {
  temperature: number;
  humidity: number;
  rainProbability: number;
  windSpeed: number;
}

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [dailyData, setDailyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isSlowConnection } = useConnectivity();

  const fetchWeather = async () => {
    try {
      setRefreshing(true);
      let lat = 20.5937;
      let lon = 78.9629;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      } catch { /* use default */ }

      const resp = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max,precipitation_sum&timezone=Asia/Kolkata`
      );
      const data = await resp.json();
      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m,
        rainProbability: data.daily?.precipitation_probability_max?.[0] || 0,
        windSpeed: Math.round(data.current.wind_speed_10m),
      });
      setDailyData(data.daily);
      localStorage.setItem('lastWeather', JSON.stringify(data));
    } catch {
      const cached = localStorage.getItem('lastWeather');
      if (cached) {
        const data = JSON.parse(cached);
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          humidity: data.current.relative_humidity_2m,
          rainProbability: data.daily?.precipitation_probability_max?.[0] || 0,
          windSpeed: Math.round(data.current.wind_speed_10m),
        });
        setDailyData(data.daily);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const quickActions = [
    { icon: Sprout, label: t('dashboard.soil_analysis'), path: '/diagnose', color: 'text-earth' },
    { icon: Wheat, label: t('dashboard.my_crops'), path: '/crops', color: 'text-secondary' },
    { icon: Bug, label: t('dashboard.disease_check'), path: '/diagnose', color: 'text-destructive', pulse: true },
    { icon: Users, label: t('dashboard.community'), path: '/community', color: 'text-accent' },
  ];

  const weatherStats = weather
    ? [
        { icon: Thermometer, value: `${weather.temperature}°C`, label: t('dashboard.temperature') },
        { icon: Droplets, value: `${weather.humidity}%`, label: t('dashboard.humidity') },
        { icon: CloudRain, value: `${weather.rainProbability}%`, label: t('dashboard.rain_chance') },
        { icon: Wind, value: `${weather.windSpeed} km/h`, label: t('dashboard.wind') },
      ]
    : [];

  // Frost/heat alerts
  const frostAlert = dailyData?.temperature_2m_min?.[0] < 4;
  const heatAlert = dailyData?.temperature_2m_max?.slice(0, 3).every((t: number) => t > 40);

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <main className="px-4 py-4 max-w-lg mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h2 className="text-2xl font-bold text-foreground">{t('dashboard.welcome')}</h2>
          <p className="text-muted-foreground text-sm">🌾 {t('app_name')}</p>
        </motion.div>

        {/* Weather Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
          <GlassCard className="relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">{t('dashboard.weather')}</h3>
              <button
                onClick={fetchWeather}
                className="p-2 rounded-full hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <RefreshCw size={18} className={`text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <SeedLoader text={t('common.loading')} />
            ) : weather ? (
              <>
                {weather.rainProbability > 60 && (
                  <div className="flex items-center gap-2 p-3 mb-3 rounded-xl bg-accent/20 border border-accent/30">
                    <AlertTriangle size={18} className="text-accent flex-shrink-0" />
                    <p className="text-sm font-medium text-foreground">{t('dashboard.skip_irrigation')}</p>
                  </div>
                )}

                {frostAlert && (
                  <div className="flex items-center gap-2 p-3 mb-3 rounded-xl bg-destructive/15 border border-destructive/30">
                    <AlertTriangle size={18} className="text-destructive flex-shrink-0" />
                    <p className="text-sm font-medium text-foreground">{t('dashboard.frost_warning')}</p>
                  </div>
                )}

                {heatAlert && (
                  <div className="flex items-center gap-2 p-3 mb-3 rounded-xl bg-accent/20 border border-accent/30">
                    <AlertTriangle size={18} className="text-accent flex-shrink-0" />
                    <p className="text-sm font-medium text-foreground">{t('dashboard.heat_warning')}</p>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2">
                  {weatherStats.map((s) => (
                    <div key={s.label} className="flex flex-col items-center gap-1 text-center">
                      <s.icon size={20} className="text-primary" />
                      <span className="text-lg font-bold text-foreground">{s.value}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">{s.label}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">{t('common.error')}</p>
            )}
          </GlassCard>
        </motion.div>

        {/* 7-Day Forecast */}
        {!isSlowConnection && dailyData && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
            <WeeklyForecast dailyData={dailyData} />
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
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
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
          <h3 className="font-semibold text-foreground mb-3">{t('dashboard.recent_activity')}</h3>
          <GlassCard className="flex items-center justify-center py-8">
            <p className="text-muted-foreground text-sm">{t('dashboard.no_activity')}</p>
          </GlassCard>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
