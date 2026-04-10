import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Leaf, Droplets, Wheat, MessageCircle, FlaskConical, Bug, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/TopBar';
import GlassCard from '@/components/GlassCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

const CATEGORY_META: Record<string, { icon: typeof Leaf; label: string; color: string }> = {
  disease_detection: { icon: Bug, label: 'history.disease_detection', color: 'text-destructive' },
  soil_analysis: { icon: Leaf, label: 'history.soil_analysis', color: 'text-secondary' },
  crop_advisor: { icon: Wheat, label: 'history.crop_advisor', color: 'text-primary' },
  chat: { icon: MessageCircle, label: 'history.chat', color: 'text-accent' },
  irrigation: { icon: Droplets, label: 'history.irrigation', color: 'text-primary' },
  fertilizer: { icon: FlaskConical, label: 'history.fertilizer', color: 'text-secondary' },
};

const FarmHistory = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      setLoading(true);

      // Auto-delete records older than 28 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 28);
      await supabase
        .from('ai_chat_history')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', cutoffDate.toISOString());

      const { data } = await supabase
        .from('ai_chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      setHistory(data || []);
      setLoading(false);
    };
    fetchHistory();
  }, [user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from('ai_chat_history').delete().eq('id', id);
    if (error) {
      toast.error(t('history.delete_failed') || 'Failed to delete');
      return;
    }
    setHistory(prev => prev.filter(h => h.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
    toast.success(t('history.deleted') || 'Deleted');
  };

  const uniqueCategories = [...new Set(history.map(h => h.category).filter(Boolean))];
  const filteredHistory = filter === 'all' ? history : history.filter(h => h.category === filter);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  // Group by date
  const grouped = filteredHistory.reduce((acc: Record<string, any[]>, item) => {
    const dateKey = formatDate(item.created_at);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  if (selectedItem) {
    const meta = CATEGORY_META[selectedItem.category] || CATEGORY_META.chat;
    const Icon = meta.icon;
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar title={t('history.detail_title')} />
        <main className="px-4 py-4 max-w-lg mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setSelectedItem(null)} className="flex items-center gap-1 text-sm text-muted-foreground">
              <ArrowLeft size={16} /> {t('crops.back')}
            </button>
            <button onClick={(e) => handleDelete(selectedItem.id, e)} className="flex items-center gap-1 text-sm text-destructive hover:text-destructive/80 transition-colors">
              <Trash2 size={16} /> {t('history.delete') || 'Delete'}
            </button>
          </div>

          <GlassCard className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ${meta.color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{t(meta.label)}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedItem.created_at && `${formatDate(selectedItem.created_at)} · ${formatTime(selectedItem.created_at)}`}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('history.your_query')}</p>
            <p className="text-sm text-foreground">{selectedItem.query}</p>
          </GlassCard>

          <GlassCard className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('history.ai_response')}</p>
            <div className="prose prose-sm max-w-none text-foreground [&_strong]:text-foreground [&_p]:text-foreground [&_li]:text-foreground">
              <ReactMarkdown>{selectedItem.response}</ReactMarkdown>
            </div>
          </GlassCard>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={t('history.title')} />
      <main className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {['all', ...uniqueCategories].map(f => {
            const meta = CATEGORY_META[f];
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {f === 'all' ? t('community.all') : t(meta?.label || f)}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-4xl animate-pulse">🌱</span>
            <p className="text-sm text-muted-foreground mt-3">{t('common.loading')}</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <GlassCard className="flex flex-col items-center justify-center py-12">
            <span className="text-5xl mb-3">📜</span>
            <p className="text-sm text-muted-foreground text-center">{t('history.empty')}</p>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{date}</p>
                <div className="relative pl-6 border-l-2 border-primary/20 space-y-3">
                  {(items as any[]).map((item: any, idx: number) => {
                    const meta = CATEGORY_META[item.category] || CATEGORY_META.chat;
                    const Icon = meta.icon;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        {/* Timeline dot */}
                        <div className={`absolute -left-[9px] w-4 h-4 rounded-full bg-card border-2 border-primary/40 flex items-center justify-center`}>
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>

                        <GlassCard
                          onClick={() => setSelectedItem(item)}
                          className="cursor-pointer hover:ring-1 hover:ring-primary/20 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                              <Icon size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-primary">{t(meta.label)}</p>
                                <span className="text-[10px] text-muted-foreground">{formatTime(item.created_at)}</span>
                              </div>
                              <p className="text-sm text-foreground mt-0.5 line-clamp-2">{item.query}</p>
                              <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium">
                                <span>{t('history.view_details')}</span>
                                <ChevronRight size={12} />
                              </div>
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FarmHistory;
