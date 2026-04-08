import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import LanguageToggle from './LanguageToggle';
import VoiceCommandButton from './VoiceCommandButton';
import Sidebar from './Sidebar/Sidebar';

const TopBar = ({ title }: { title?: string }) => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 liquid-glass-nav border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 rounded-full bg-card/60 backdrop-blur-xl flex items-center justify-center border border-border/30 hover:border-primary/30 transition-colors"
            >
              <Menu size={18} className="text-foreground" />
            </motion.button>
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              {title || t('app_name')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <VoiceCommandButton />
            <LanguageToggle />
          </div>
        </div>
      </header>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
};

export default TopBar;
