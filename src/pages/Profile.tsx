import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Sun,
  Moon,
  MapPin,
  Calendar,
  Edit,
  Tractor,
  History,
  FileText,
  Settings,
  LogOut,
  Globe,
  Bell,
  Ruler,
  FlaskConical,
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import GlassCard from '@/components/GlassCard';
import { useAppStore } from '@/store/useAppStore';

type ProfileTab = 'farm' | 'history' | 'reports' | 'settings';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme, setLanguage } = useAppStore();
  const [activeTab, setActiveTab] = useState<ProfileTab>('farm');

  const tabs = [
    { key: 'farm' as ProfileTab, icon: Tractor, label: t('profile.farm_details') },
    { key: 'history' as ProfileTab, icon: History, label: t('profile.search_history') },
    { key: 'reports' as ProfileTab, icon: FileText, label: t('profile.ai_reports') },
    { key: 'settings' as ProfileTab, icon: Settings, label: t('profile.settings') },
  ];

  const handleLangChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={t('profile.title')} />
      <main className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="flex flex-col items-center gap-3 py-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/30">
                <span className="text-4xl">👨‍🌾</span>
              </div>
              <button
                onClick={toggleTheme}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shadow-sm"
              >
                {isDark ? <Sun size={14} className="text-accent" /> : <Moon size={14} className="text-foreground" />}
              </button>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground">किसान जी</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin size={12} /> गाँव, राज्य
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center mt-1">
                <Calendar size={12} /> {t('profile.member_since')} 2024
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium min-h-[40px]">
              <Edit size={14} /> {t('profile.edit')}
            </button>
          </GlassCard>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap min-h-[40px] transition-all ${
                activeTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'farm' && (
            <GlassCard className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">जमीन</p>
                  <p className="font-semibold text-foreground">5 {t('common.acres')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('crops.soil_type')}</p>
                  <p className="font-semibold text-foreground">{t('crops.black')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">मुख्य फसल</p>
                  <p className="font-semibold text-foreground">सोयाबीन</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('crops.water')}</p>
                  <p className="font-semibold text-foreground">{t('crops.borewell')}</p>
                </div>
              </div>
            </GlassCard>
          )}

          {activeTab === 'history' && (
            <GlassCard className="flex flex-col items-center justify-center py-8">
              <History size={32} className="text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{t('dashboard.no_activity')}</p>
            </GlassCard>
          )}

          {activeTab === 'reports' && (
            <GlassCard className="flex flex-col items-center justify-center py-8">
              <FileText size={32} className="text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{t('dashboard.no_activity')}</p>
            </GlassCard>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-3">
              <GlassCard className="space-y-4">
                {/* Language */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">{t('profile.language')}</span>
                  </div>
                  <div className="flex gap-1 bg-muted rounded-full p-0.5">
                    {[{ c: 'en', l: 'EN' }, { c: 'hi', l: 'हि' }, { c: 'mr', l: 'म' }].map((lang) => (
                      <button
                        key={lang.c}
                        onClick={() => handleLangChange(lang.c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium min-h-[32px] ${
                          i18n.language === lang.c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {lang.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dark Mode */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isDark ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-primary" />}
                    <span className="text-sm font-medium text-foreground">{t('profile.dark_mode')}</span>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`w-12 h-7 rounded-full transition-all relative ${isDark ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-card shadow-sm absolute top-1 transition-all ${isDark ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell size={18} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">{t('profile.notifications')}</span>
                  </div>
                  <div className="w-12 h-7 rounded-full bg-primary relative">
                    <div className="w-5 h-5 rounded-full bg-card shadow-sm absolute top-1 left-6" />
                  </div>
                </div>

                {/* Units */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Ruler size={18} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">{t('profile.units')}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{t('common.acres')}</span>
                </div>

                {/* Fertilizer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FlaskConical size={18} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">{t('profile.fertilizer_pref')}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{t('diagnose.organic')}</span>
                </div>
              </GlassCard>

              <button className="w-full py-3 rounded-xl bg-destructive/10 text-destructive font-semibold min-h-[48px] flex items-center justify-center gap-2">
                <LogOut size={18} />
                {t('profile.logout')}
              </button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
