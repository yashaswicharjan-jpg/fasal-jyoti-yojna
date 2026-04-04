import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Sun, Moon, MapPin, Calendar, Tractor, History, FileText, Settings, LogOut, Globe, Edit3 } from 'lucide-react';
import MyPostsTab from '@/components/Community/MyPostsTab';
import TopBar from '@/components/TopBar';
import GlassCard from '@/components/GlassCard';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type ProfileTab = 'farm' | 'history' | 'reports' | 'settings';

const FEATURE_META: Record<string, { label: string; icon: string }> = {
  disease_detection: { label: 'Disease Check', icon: '🦠' },
  soil_analysis: { label: 'Soil Analysis', icon: '🌱' },
  crop_advisor: { label: 'Crop Advisor', icon: '🌾' },
  irrigation: { label: 'Irrigation', icon: '💧' },
  fertilizer: { label: 'Fertilizer', icon: '🧪' },
  mandi_price: { label: 'Mandi Price', icon: '💹' },
  weather: { label: 'Weather', icon: '🌤️' },
  govt_scheme: { label: 'Govt Scheme', icon: '🏛️' },
  kisan_dost_chat: { label: 'Kisan Dost', icon: '🤖' },
  yield_prediction: { label: 'Yield Prediction', icon: '📊' },
};

const formatRelativeTime = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme, setLanguage } = useAppStore();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('farm');
  const [profile, setProfile] = useState<any>(null);
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [selectedDiag, setSelectedDiag] = useState<any>(null);
  const [historyFilter, setHistoryFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
    supabase.from('ai_diagnostics').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50).then(({ data }) => setDiagnostics(data || []));
    supabase.from('search_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100).then(({ data }) => setSearchHistory(data || []));
  }, [user]);

  const tabs = [
    { key: 'farm' as ProfileTab, icon: Tractor, label: t('profile.farm_details') },
    { key: 'history' as ProfileTab, icon: History, label: t('profile.search_history') },
    { key: 'reports' as ProfileTab, icon: FileText, label: t('profile.ai_reports') },
    { key: 'settings' as ProfileTab, icon: Settings, label: t('profile.settings') },
  ];

  const handleLangChange = (lang: string) => { i18n.changeLanguage(lang); setLanguage(lang); };

  const deleteHistoryEntry = async (id: string) => {
    await supabase.from('search_history').delete().eq('id', id);
    setSearchHistory(prev => prev.filter(h => h.id !== id));
  };

  const clearAllHistory = async () => {
    if (!user) return;
    await supabase.from('search_history').delete().eq('user_id', user.id);
    setSearchHistory([]);
  };

  const filteredHistory = historyFilter === 'all'
    ? searchHistory
    : searchHistory.filter(h => h.feature === historyFilter);

  const uniqueFeatures = [...new Set(searchHistory.map(h => h.feature).filter(Boolean))];

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={t('profile.title')} />
      <main className="px-4 py-4 max-w-lg mx-auto space-y-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="flex flex-col items-center gap-3 py-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/30">
                <span className="text-4xl">👨‍🌾</span>
              </div>
              <button onClick={toggleTheme} className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
                {isDark ? <Sun size={14} className="text-accent" /> : <Moon size={14} className="text-foreground" />}
              </button>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground">{profile?.full_name || t('community.farmer')}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 justify-center">
                <MapPin size={12} /> {profile?.location_village || t('profile.village')}, {profile?.state || t('profile.state')}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center mt-1">
                <Calendar size={12} /> {t('profile.member_since')} {profile?.created_at ? new Date(profile.created_at).getFullYear() : '2024'}
              </p>
            </div>
          </GlassCard>
        </motion.div>

        <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1 scrollbar-hide">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSelectedDiag(null); }}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap min-h-[40px] transition-all ${activeTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              <tab.icon size={14} />{tab.label}
            </button>
          ))}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === 'farm' && (
            <GlassCard className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">{t('profile.land')}</p><p className="font-semibold text-foreground">5 {t('common.acres')}</p></div>
                <div><p className="text-xs text-muted-foreground">{t('crops.soil_type')}</p><p className="font-semibold text-foreground">{t('crops.black')}</p></div>
                <div><p className="text-xs text-muted-foreground">{t('profile.main_crop')}</p><p className="font-semibold text-foreground">सोयाबीन</p></div>
                <div><p className="text-xs text-muted-foreground">{t('crops.water')}</p><p className="font-semibold text-foreground">{t('crops.borewell')}</p></div>
              </div>
            </GlassCard>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {searchHistory.length === 0 ? (
                <GlassCard className="flex flex-col items-center justify-center py-8">
                  <span className="text-4xl mb-2">🔍</span>
                  <p className="text-sm text-muted-foreground text-center">{t('dashboard.no_activity')}</p>
                </GlassCard>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{filteredHistory.length} entries</span>
                    <button onClick={clearAllHistory} className="text-xs text-destructive font-medium px-2 py-1">{t('profile.clear_all') || 'Clear all'}</button>
                  </div>

                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    {['all', ...uniqueFeatures].map(f => (
                      <button key={f} onClick={() => setHistoryFilter(f)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${historyFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {f === 'all' ? 'All' : `${FEATURE_META[f]?.icon || '🔍'} ${FEATURE_META[f]?.label || f}`}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {filteredHistory.map(entry => {
                      const meta = FEATURE_META[entry.feature] || { label: entry.feature, icon: '🔍' };
                      return (
                        <GlassCard key={entry.id} className="flex items-start gap-3 py-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-base flex-shrink-0">
                            {meta.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-primary">{meta.label}</p>
                            <p className="text-sm text-foreground truncate">{entry.query}</p>
                            {entry.result_summary && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">→ {entry.result_summary}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-[10px] text-muted-foreground">{entry.created_at && formatRelativeTime(entry.created_at)}</span>
                            <button onClick={() => deleteHistoryEntry(entry.id)} className="text-muted-foreground hover:text-destructive text-xs">✕</button>
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-3">
              {selectedDiag ? (
                <div className="space-y-3">
                  <button onClick={() => setSelectedDiag(null)} className="text-sm text-muted-foreground flex items-center gap-1">← Back</button>
                  {selectedDiag.image_url && (
                    <img src={selectedDiag.image_url} alt="Analyzed" className="w-full rounded-xl max-h-48 object-cover" />
                  )}
                  <GlassCard className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{selectedDiag.detection_type === 'disease' ? '🦠' : '🌱'}</span>
                      <div>
                        <p className="font-semibold text-foreground">{selectedDiag.result_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedDiag.detection_type === 'disease' ? 'Disease Detection' : 'Soil Analysis'} · {selectedDiag.created_at && formatRelativeTime(selectedDiag.created_at)}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                  {selectedDiag.treatment_plan && (
                    <GlassCard className="space-y-1 border-l-4 border-primary/40">
                      <p className="text-xs font-medium text-primary">🧪 Chemical Treatment</p>
                      <p className="text-sm text-foreground">{selectedDiag.treatment_plan}</p>
                    </GlassCard>
                  )}
                  {selectedDiag.organic_options && (
                    <GlassCard className="space-y-1 border-l-4 border-secondary/40">
                      <p className="text-xs font-medium text-secondary">🌿 Organic Alternative</p>
                      <p className="text-sm text-foreground">{selectedDiag.organic_options}</p>
                    </GlassCard>
                  )}
                </div>
              ) : diagnostics.length === 0 ? (
                <GlassCard className="flex flex-col items-center justify-center py-8">
                  <span className="text-4xl mb-2">🔬</span>
                  <p className="text-sm text-muted-foreground text-center">{t('community.no_reports')}</p>
                </GlassCard>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">{diagnostics.length} AI reports saved</p>
                  <div className="grid grid-cols-2 gap-3">
                    {diagnostics.map((d) => (
                      <GlassCard key={d.id} onClick={() => setSelectedDiag(d)} className="cursor-pointer space-y-2">
                        {d.image_url ? (
                          <img src={d.image_url} alt={d.result_title} className="w-full h-20 object-cover rounded-lg" />
                        ) : (
                          <div className="w-full h-20 rounded-lg bg-primary/5 flex items-center justify-center text-2xl">
                            {d.detection_type === 'disease' ? '🦠' : '🌱'}
                          </div>
                        )}
                        <p className="text-xs font-medium text-foreground truncate">{d.result_title ?? 'Unknown'}</p>
                        <p className="text-[10px] text-muted-foreground">{d.created_at && formatRelativeTime(d.created_at)}</p>
                      </GlassCard>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-3">
              <GlassCard className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><Globe size={18} className="text-primary" /><span className="text-sm font-medium text-foreground">{t('profile.language')}</span></div>
                  <div className="flex gap-1 bg-muted rounded-full p-0.5">
                    {[{ c: 'en', l: 'EN' }, { c: 'hi', l: 'हि' }, { c: 'mr', l: 'म' }].map((lang) => (
                      <button key={lang.c} onClick={() => handleLangChange(lang.c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium min-h-[32px] ${i18n.language === lang.c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                        {lang.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">{isDark ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-primary" />}<span className="text-sm font-medium text-foreground">{t('profile.dark_mode')}</span></div>
                  <button onClick={toggleTheme} className={`w-12 h-7 rounded-full transition-all relative ${isDark ? 'bg-primary' : 'bg-muted'}`}>
                    <div className={`w-5 h-5 rounded-full bg-card shadow-sm absolute top-1 transition-all ${isDark ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </GlassCard>
              <button onClick={signOut} className="w-full py-3 rounded-xl bg-destructive/10 text-destructive font-semibold min-h-[48px] flex items-center justify-center gap-2">
                <LogOut size={18} />{t('profile.logout')}
              </button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
