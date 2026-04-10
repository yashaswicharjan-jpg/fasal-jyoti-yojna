import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Locate, CheckCircle, RefreshCw, Thermometer, Droplets, CloudRain, Wind, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import GlassCard from '@/components/GlassCard';
import SeedLoader from '@/components/SeedLoader';
import WeeklyForecast from '@/components/WeeklyForecast';
import { useConnectivity } from '@/utils/connectivity';
import 'leaflet/dist/leaflet.css';

interface GPSWeatherCardProps {
  onDailyData?: (data: any) => void;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  rainProbability: number;
  windSpeed: number;
}

interface LocationInfo {
  lat: number;
  lon: number;
  accuracy: number;
  timestamp: number;
}

// Component to recenter map when location changes
const RecenterMap = ({ lat, lon }: { lat: number; lon: number }) => {
  const map = useMap();
  useEffect(() => { map.setView([lat, lon], 14); }, [lat, lon, map]);
  return null;
};

const GPSWeatherCard = ({ onDailyData }: GPSWeatherCardProps) => {
  const { t } = useTranslation();
  const { isSlowConnection } = useConnectivity();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [dailyData, setDailyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    try {
      setRefreshing(true);
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
      onDailyData?.(data.daily);
      localStorage.setItem('lastWeather', JSON.stringify(data));
      localStorage.setItem('lastWeatherLocation', JSON.stringify({ lat, lon }));
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
        onDailyData?.(data.daily);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onDailyData]);

  const syncLocation = useCallback(async () => {
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000 })
      );
      const loc: LocationInfo = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: Date.now(),
      };
      setLocation(loc);
      setLocationVerified(true);
      setShowMap(true);
      await fetchWeather(loc.lat, loc.lon);
    } catch {
      // Fallback to default India center
      const defaultLoc = { lat: 20.5937, lon: 78.9629, accuracy: 0, timestamp: Date.now() };
      setLocation(defaultLoc);
      await fetchWeather(defaultLoc.lat, defaultLoc.lon);
    }
    setLocating(false);
  }, [fetchWeather]);

  useEffect(() => {
    // Try to load saved location first
    const saved = localStorage.getItem('lastWeatherLocation');
    if (saved) {
      const { lat, lon } = JSON.parse(saved);
      setLocation({ lat, lon, accuracy: 0, timestamp: 0 });
      setLocationVerified(true);
      fetchWeather(lat, lon);
    } else {
      syncLocation();
    }
  }, []);

  const weatherStats = weather
    ? [
        { icon: Thermometer, value: `${weather.temperature}°C`, label: t('dashboard.temperature') },
        { icon: Droplets, value: `${weather.humidity}%`, label: t('dashboard.humidity') },
        { icon: CloudRain, value: `${weather.rainProbability}%`, label: t('dashboard.rain_chance') },
        { icon: Wind, value: `${weather.windSpeed} km/h`, label: t('dashboard.wind') },
      ]
    : [];

  const frostAlert = dailyData?.temperature_2m_min?.[0] < 4;
  const heatAlert = dailyData?.temperature_2m_max?.slice(0, 3).every((t: number) => t > 40);

  return (
    <div className="space-y-4">
      {/* Sync Location Button */}
      <motion.button
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.97 }}
        onClick={syncLocation}
        disabled={locating}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl glass-card-solid min-h-[52px] group"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            locationVerified ? 'bg-primary/15' : 'bg-accent/15'
          }`}>
            {locating ? (
              <Locate size={18} className="text-primary animate-spin" />
            ) : (
              <MapPin size={18} className={locationVerified ? 'text-primary' : 'text-accent'} />
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">
              {locating ? t('dashboard.syncing_location') : t('dashboard.sync_field_location')}
            </p>
            {location && locationVerified && (
              <p className="text-[10px] text-muted-foreground font-mono">
                {location.lat.toFixed(4)}°N, {location.lon.toFixed(4)}°E
                {location.accuracy > 0 && ` ±${Math.round(location.accuracy)}m`}
              </p>
            )}
          </div>
        </div>
        {locationVerified && !locating && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20"
          >
            <CheckCircle size={12} className="text-primary" />
            <span className="text-[10px] font-medium text-primary">{t('dashboard.verified_location')}</span>
          </motion.div>
        )}
      </motion.button>

      {/* Mini Map */}
      <AnimatePresence>
        {showMap && location && !isSlowConnection && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 160, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="rounded-2xl overflow-hidden border border-border/30"
          >
            <MapContainer
              center={[location.lat, location.lon]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <RecenterMap lat={location.lat} lon={location.lon} />
              <CircleMarker
                center={[location.lat, location.lon]}
                radius={10}
                pathOptions={{
                  color: 'hsl(115, 37%, 40%)',
                  fillColor: 'hsl(115, 50%, 45%)',
                  fillOpacity: 0.6,
                  weight: 3,
                }}
              />
              {/* Pulsing outer ring */}
              <CircleMarker
                center={[location.lat, location.lon]}
                radius={20}
                pathOptions={{
                  color: 'hsl(115, 50%, 45%)',
                  fillColor: 'transparent',
                  fillOpacity: 0,
                  weight: 1,
                  opacity: 0.4,
                }}
              />
            </MapContainer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weather Card */}
      <GlassCard className="relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">{t('dashboard.weather')}</h3>
          <button
            onClick={() => location && fetchWeather(location.lat, location.lon)}
            className="p-2 rounded-full hover:bg-muted/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <RefreshCw size={18} className={`text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <SeedLoader text={t('common.loading')} />
        ) : weather ? (
          <>
            {weather.rainProbability > 60 && (
              <div className="flex items-center gap-2 p-3 mb-3 rounded-xl bg-accent/15 border border-accent/25 backdrop-blur">
                <AlertTriangle size={18} className="text-accent flex-shrink-0" />
                <p className="text-sm font-medium text-foreground">{t('dashboard.skip_irrigation')}</p>
              </div>
            )}
            {frostAlert && (
              <div className="flex items-center gap-2 p-3 mb-3 rounded-xl bg-destructive/10 border border-destructive/25 backdrop-blur">
                <AlertTriangle size={18} className="text-destructive flex-shrink-0" />
                <p className="text-sm font-medium text-foreground">{t('dashboard.frost_warning')}</p>
              </div>
            )}
            {heatAlert && (
              <div className="flex items-center gap-2 p-3 mb-3 rounded-xl bg-accent/15 border border-accent/25 backdrop-blur">
                <AlertTriangle size={18} className="text-accent flex-shrink-0" />
                <p className="text-sm font-medium text-foreground">{t('dashboard.heat_warning')}</p>
              </div>
            )}
            <div className="grid grid-cols-4 gap-2">
              {weatherStats.map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-1 text-center">
                  <s.icon size={20} className="text-primary" />
                  <span className="text-lg font-bold text-foreground font-mono">{s.value}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{s.label}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-4">{t('common.error')}</p>
        )}
      </GlassCard>

      {/* Weekly Forecast */}
      {!isSlowConnection && dailyData && <WeeklyForecast dailyData={dailyData} />}
    </div>
  );
};

export default GPSWeatherCard;
