import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';

const InstallPrompt = () => {
  const { i18n } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Show after 3rd visit
      const visits = parseInt(localStorage.getItem('visitCount') || '0') + 1;
      localStorage.setItem('visitCount', String(visits));
      const dismissed = localStorage.getItem('installDismissed');

      if (visits >= 3 && !dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('installDismissed', 'true');
  };

  const text =
    i18n.language === 'en'
      ? { title: 'Install Krishi Sahayak', subtitle: 'Add to home screen for quick access', button: 'Install App' }
      : i18n.language === 'mr'
      ? { title: 'कृषी सहाय्यक इंस्टॉल करा', subtitle: 'त्वरित ऍक्सेससाठी होम स्क्रीनवर जोडा', button: 'App इंस्टॉल करा' }
      : { title: 'कृषि सहायक इंस्टॉल करें', subtitle: 'होम स्क्रीन पर जोड़ें', button: 'App इंस्टॉल करें' };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto"
        >
          <div className="bg-primary text-primary-foreground rounded-2xl p-4 shadow-2xl flex items-center gap-3">
            <img src="/icons/icon-192.png" alt="Krishi" className="w-12 h-12 rounded-xl" width={48} height={48} />
            <div className="flex-1">
              <p className="font-bold text-sm">{text.title}</p>
              <p className="text-xs opacity-80">{text.subtitle}</p>
            </div>
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-foreground text-primary font-semibold text-sm min-h-[44px] whitespace-nowrap"
            >
              <Download size={16} />
              {text.button}
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-full hover:bg-primary-foreground/20 min-h-[32px] min-w-[32px] flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
