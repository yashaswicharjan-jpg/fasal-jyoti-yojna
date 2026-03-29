import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';

const langs = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हि' },
  { code: 'mr', label: 'म' },
];

const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useAppStore();

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    setLanguage(code);
  };

  return (
    <div className="flex items-center rounded-full bg-muted p-1 gap-0.5">
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => handleChange(l.code)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all min-h-[36px] ${
            language === l.code
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageToggle;
