import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';

const TopBar = ({ title }: { title?: string }) => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <h1 className="text-lg font-bold text-foreground">
          {title || t('app_name')}
        </h1>
        <LanguageToggle />
      </div>
    </header>
  );
};

export default TopBar;
