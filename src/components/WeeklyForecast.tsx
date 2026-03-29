import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import GlassCard from '@/components/GlassCard';

interface DayForecast {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  rainProb: number;
  windMax: number;
  weatherCode: number;
  farmAdvice: { label: string; color: string; emoji: string };
}

const getFarmAdvice = (rain: number, wind: number): { label: string; color: string; emoji: string } => {
  if (rain > 40) return { label: 'Avoid pesticides', color: 'bg-destructive/15 text-destructive', emoji: '🔴' };
  if (rain < 10 && wind < 20) return { label: 'Good for harvesting', color: 'bg-accent/15 text-accent-foreground', emoji: '🟡' };
  if (wind < 10 && rain < 20) return { label: 'Ideal for spraying', color: 'bg-secondary/15 text-secondary', emoji: '🟢' };
  return { label: 'Normal day', color: 'bg-muted text-muted-foreground', emoji: '⚪' };
};

const getWeatherEmoji = (code: number): string => {
  if (code <= 1) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌧️';
  return '⛈️';
};

const dayNames: Record<string, string[]> = {
  hi: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
  mr: ['रवि', 'सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

interface WeeklyForecastProps {
  dailyData: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    windspeed_10m_max: number[];
    weathercode: number[];
  } | null;
}

const WeeklyForecast = ({ dailyData }: WeeklyForecastProps) => {
  const { i18n } = useTranslation();

  if (!dailyData) return null;

  const forecasts: DayForecast[] = dailyData.time.slice(0, 7).map((date, i) => {
    const d = new Date(date);
    const lang = i18n.language as keyof typeof dayNames;
    return {
      date,
      dayName: (dayNames[lang] || dayNames.en)[d.getDay()],
      tempMax: Math.round(dailyData.temperature_2m_max[i]),
      tempMin: Math.round(dailyData.temperature_2m_min[i]),
      rainProb: dailyData.precipitation_probability_max?.[i] || 0,
      windMax: Math.round(dailyData.windspeed_10m_max?.[i] || 0),
      weatherCode: dailyData.weathercode?.[i] || 0,
      farmAdvice: getFarmAdvice(
        dailyData.precipitation_probability_max?.[i] || 0,
        dailyData.windspeed_10m_max?.[i] || 0
      ),
    };
  });

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground">
        {i18n.language === 'hi' ? '7 दिन का पूर्वानुमान' : i18n.language === 'mr' ? '7 दिवसांचा अंदाज' : '7-Day Forecast'}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
        {forecasts.map((day, i) => (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="snap-center"
          >
            <GlassCard className="min-w-[130px] flex flex-col items-center gap-2 py-3 px-3">
              <span className="text-xs font-semibold text-foreground">{i === 0 ? (i18n.language === 'hi' ? 'आज' : 'Today') : day.dayName}</span>
              <span className="text-3xl">{getWeatherEmoji(day.weatherCode)}</span>
              <div className="text-center">
                <span className="text-sm font-bold text-foreground">{day.tempMax}°</span>
                <span className="text-xs text-muted-foreground"> / {day.tempMin}°</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span>🌧️ {day.rainProb}%</span>
                <span>💨 {day.windMax}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${day.farmAdvice.color}`}>
                {day.farmAdvice.emoji} {day.farmAdvice.label}
              </span>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyForecast;
