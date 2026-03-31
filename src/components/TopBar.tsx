import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import VoiceCommandButton from './VoiceCommandButton';
import Sidebar from './Sidebar/Sidebar';

const TopBar = ({ title }: { title?: string }) => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <Menu size={18} className="text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">
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
