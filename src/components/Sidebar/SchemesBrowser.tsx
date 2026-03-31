import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Phone, ExternalLink, AlertTriangle, ArrowLeft, FileText, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import GlassCard from '@/components/GlassCard';

const SCHEME_TYPE_CHIPS = [
  { key: 'all', label: 'All', emoji: '📋' },
  { key: 'subsidy', label: 'Subsidy', emoji: '💰' },
  { key: 'insurance', label: 'Insurance', emoji: '🛡️' },
  { key: 'loan', label: 'Loan', emoji: '💳' },
  { key: 'market', label: 'Market', emoji: '🏪' },
  { key: 'input', label: 'Input', emoji: '🌱' },
  { key: 'pension', label: 'Pension', emoji: '👴' },
];

const SchemesBrowser = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedScheme, setSelectedScheme] = useState<any>(null);

  const fetchSchemes = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('govt_schemes').select('*').eq('is_active', true);

    if (typeFilter !== 'all') {
      query = query.eq('scheme_type', typeFilter);
    }
    if (search.trim()) {
      query = query.or(`scheme_name.ilike.%${search}%,scheme_name_hindi.ilike.%${search}%,benefit_description.ilike.%${search}%`);
    }

    const { data } = await query.order('created_at', { ascending: false });
    setSchemes(data || []);
    setLoading(false);
  }, [search, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchSchemes, 300);
    return () => clearTimeout(timer);
  }, [fetchSchemes]);

  const getSchemeName = (s: any) => {
    if (i18n.language === 'hi') return s.scheme_name_hindi;
    if (i18n.language === 'mr') return s.scheme_name_marathi;
    return s.scheme_name;
  };

  const getBenefitDesc = (s: any) => {
    if (i18n.language === 'hi') return s.benefit_description_hindi;
    if (i18n.language === 'mr') return s.benefit_description_marathi;
    return s.benefit_description;
  };

  const getDeadlineColor = (deadline: string | null) => {
    if (!deadline) return { cls: 'bg-muted text-muted-foreground', label: t('sidebar.ongoing') };
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
    if (days < 0) return { cls: 'bg-destructive/10 text-destructive', label: t('sidebar.expired') };
    if (days < 7) return { cls: 'bg-destructive/10 text-destructive', label: `${days}d left` };
    if (days < 30) return { cls: 'bg-accent/10 text-accent', label: `${days}d left` };
    return { cls: 'bg-secondary/10 text-secondary', label: `${days}d left` };
  };

  const formatAmount = (amt: number | null) => {
    if (!amt) return t('sidebar.variable');
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(0)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(0)} L`;
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  const handleStartTracking = async (scheme: any) => {
    if (!user) return;
    const { error } = await supabase.from('scheme_applications').insert({
      user_id: user.id,
      scheme_id: scheme.id,
      status: 'draft',
    });
    if (error) {
      if (error.code === '23505') toast.info(t('sidebar.already_tracking'));
      else toast.error(t('common.error'));
    } else {
      toast.success(t('sidebar.tracking_started'));
    }
  };

  const urgentSchemes = schemes.filter(s => {
    if (!s.application_deadline) return false;
    const days = Math.ceil((new Date(s.application_deadline).getTime() - Date.now()) / 86400000);
    return days > 0 && days <= 15;
  });

  // Detail view
  if (selectedScheme) {
    const s = selectedScheme;
    return (
      <div className="p-4 space-y-4">
        <button onClick={() => setSelectedScheme(null)} className="flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft size={16} /> {t('crops.back')}
        </button>

        <div className="flex items-center gap-3">
          <span className="text-4xl">{s.icon_emoji}</span>
          <div>
            <h3 className="font-bold text-foreground text-base">{getSchemeName(s)}</h3>
            <p className="text-xs text-muted-foreground">{s.ministry}</p>
          </div>
        </div>

        <GlassCard className="space-y-2">
          <p className="text-xs font-semibold text-primary uppercase">{t('sidebar.benefit')}</p>
          {s.max_benefit_amount && (
            <p className="text-lg font-bold text-foreground">{formatAmount(s.max_benefit_amount)}</p>
          )}
          <p className="text-sm text-foreground">{getBenefitDesc(s)}</p>
        </GlassCard>

        {s.required_documents && (
          <GlassCard className="space-y-2">
            <p className="text-xs font-semibold text-primary uppercase">{t('sidebar.documents')}</p>
            <ul className="space-y-1.5">
              {s.required_documents.map((doc: string) => (
                <li key={doc} className="flex items-center gap-2 text-sm text-foreground">
                  <FileText size={14} className="text-muted-foreground flex-shrink-0" /> {doc}
                </li>
              ))}
            </ul>
          </GlassCard>
        )}

        <GlassCard className="space-y-2">
          <p className="text-xs font-semibold text-primary uppercase">{t('sidebar.how_to_apply')}</p>
          <p className="text-sm text-foreground capitalize">{s.application_method}</p>
          {s.application_portal_url && (
            <a href={s.application_portal_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-primary font-medium">
              <ExternalLink size={14} /> {t('sidebar.apply_online')}
            </a>
          )}
        </GlassCard>

        {s.helpline_number && (
          <a href={`tel:${s.helpline_number}`} className="block">
            <GlassCard className="flex items-center gap-3">
              <Phone size={20} className="text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{t('sidebar.helpline')}</p>
                <p className="text-base font-bold text-foreground">{s.helpline_number}</p>
              </div>
            </GlassCard>
          </a>
        )}

        <div className="flex gap-2">
          <button onClick={() => handleStartTracking(s)}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm min-h-[48px]">
            {t('sidebar.start_tracking')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('sidebar.search_schemes')}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted text-foreground text-sm border border-border min-h-[44px]"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {SCHEME_TYPE_CHIPS.map((chip) => (
          <button
            key={chip.key}
            onClick={() => setTypeFilter(chip.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              typeFilter === chip.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {chip.emoji} {chip.label}
          </button>
        ))}
      </div>

      {/* Urgent deadline banner */}
      {urgentSchemes.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/15 border border-accent/30">
          <AlertTriangle size={16} className="text-accent flex-shrink-0" />
          <p className="text-xs font-medium text-foreground">
            ⏰ {urgentSchemes.length} {t('sidebar.deadline_soon')}
          </p>
        </div>
      )}

      {/* Scheme cards */}
      {loading ? (
        <div className="flex justify-center py-8">
          <span className="text-3xl animate-pulse">🏛️</span>
        </div>
      ) : schemes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">{t('sidebar.no_schemes')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schemes.map((s) => {
            const dl = getDeadlineColor(s.application_deadline);
            return (
              <GlassCard key={s.id} onClick={() => setSelectedScheme(s)} className="cursor-pointer space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-2xl flex-shrink-0">{s.icon_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm leading-tight">{getSchemeName(s)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.ministry}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold capitalize">
                    {s.scheme_type}
                  </span>
                  {s.max_benefit_amount && (
                    <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-semibold">
                      {formatAmount(s.max_benefit_amount)}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${dl.cls}`}>
                    {dl.label}
                  </span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SchemesBrowser;
