import { useTranslation } from 'react-i18next';
import { useConnectivity } from '@/utils/connectivity';
import { WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OfflineBanner = () => {
  const { isOnline, isSlowConnection, effectiveType } = useConnectivity();
  const { t, i18n } = useTranslation();

  const showBanner = !isOnline || isSlowConnection;
  if (!showBanner) return null;

  const isOffline = !isOnline;
  const message = isOffline
    ? i18n.language === 'en'
      ? '📶 You are offline. Showing cached data.'
      : i18n.language === 'mr'
      ? '📶 तुम्ही ऑफलाइन आहात. जुनी माहिती दिसत आहे.'
      : '📶 आप ऑफलाइन हैं। पुरानी जानकारी दिख रही है।'
    : i18n.language === 'en'
    ? '🐢 Slow internet: Light mode is on'
    : i18n.language === 'mr'
    ? '🐢 हळू इंटरनेट: हलका मोड चालू आहे'
    : '🐢 धीमा इंटरनेट: हल्का मोड चालू है';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`px-4 py-2.5 flex items-center justify-between gap-2 text-sm font-medium ${
          isOffline
            ? 'bg-destructive/10 text-destructive'
            : 'bg-accent/20 text-accent-foreground'
        }`}
      >
        <div className="flex items-center gap-2">
          <WifiOff size={16} />
          <span>{message}</span>
        </div>
        {isOffline && (
          <button
            onClick={() => window.location.reload()}
            className="p-1.5 rounded-full hover:bg-foreground/10 min-h-[32px] min-w-[32px] flex items-center justify-center"
          >
            <RefreshCw size={14} />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default OfflineBanner;
