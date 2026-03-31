import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import GlassCard from '@/components/GlassCard';

const STATUS_META: Record<string, { color: string; label: string }> = {
  draft: { color: 'bg-muted text-muted-foreground', label: 'Draft' },
  submitted: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Submitted' },
  under_review: { color: 'bg-accent/15 text-accent', label: 'Under Review' },
  approved: { color: 'bg-secondary/15 text-secondary', label: 'Approved' },
  rejected: { color: 'bg-destructive/15 text-destructive', label: 'Rejected' },
  disbursed: { color: 'bg-primary/15 text-primary', label: '₹ Disbursed' },
  expired: { color: 'bg-muted text-muted-foreground', label: 'Expired' },
};

const MyApplications = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchApplications = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('scheme_applications')
      .select('*, govt_schemes(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setApplications(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const updateStatus = async (appId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'submitted') updates.submitted_at = new Date().toISOString();
    if (newStatus === 'approved') updates.approved_at = new Date().toISOString();
    if (newStatus === 'disbursed') updates.disbursed_at = new Date().toISOString();

    const { error } = await supabase.from('scheme_applications').update(updates).eq('id', appId);
    if (error) toast.error(t('common.error'));
    else {
      toast.success(t('sidebar.status_updated'));
      fetchApplications();
    }
  };

  const filtered = statusFilter === 'all'
    ? applications
    : applications.filter(a => a.status === statusFilter);

  const stats = {
    total: applications.length,
    approved: applications.filter(a => a.status === 'approved' || a.status === 'disbursed').length,
    pending: applications.filter(a => a.status === 'submitted' || a.status === 'under_review').length,
  };

  return (
    <div className="p-4 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: t('sidebar.total'), value: stats.total, emoji: '📋' },
          { label: t('sidebar.approved'), value: stats.approved, emoji: '✅' },
          { label: t('sidebar.pending'), value: stats.pending, emoji: '⏳' },
        ].map((s) => (
          <GlassCard key={s.label} className="flex flex-col items-center py-3">
            <span className="text-lg">{s.emoji}</span>
            <span className="text-xl font-bold text-foreground">{s.value}</span>
            <span className="text-[10px] text-muted-foreground">{s.label}</span>
          </GlassCard>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {['all', 'draft', 'submitted', 'under_review', 'approved', 'disbursed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {s === 'all' ? t('community.all') : STATUS_META[s]?.label || s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="text-3xl animate-pulse">📋</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <span className="text-4xl mb-3 block">📝</span>
          <p className="text-sm text-muted-foreground">{t('sidebar.no_applications')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((app) => {
            const scheme = app.govt_schemes;
            const statusMeta = STATUS_META[app.status] || STATUS_META.draft;
            const isExpanded = expandedId === app.id;

            return (
              <GlassCard key={app.id} className="space-y-2">
                <div className="flex items-start gap-2.5" onClick={() => setExpandedId(isExpanded ? null : app.id)}>
                  <span className="text-2xl flex-shrink-0">{scheme?.icon_emoji || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{scheme?.scheme_name || 'Unknown'}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {t('sidebar.applied_on')}: {new Date(app.application_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusMeta.color}`}>
                      {statusMeta.label}
                    </span>
                    {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                  </div>
                </div>

                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-border pt-3 space-y-3">
                    {/* Timeline */}
                    <div className="space-y-2 pl-3 border-l-2 border-primary/20">
                      {[
                        { label: 'Applied', date: app.application_date, done: true },
                        { label: 'Submitted', date: app.submitted_at, done: !!app.submitted_at },
                        { label: 'Under Review', date: null, done: app.status === 'under_review' || app.status === 'approved' || app.status === 'disbursed' },
                        { label: 'Approved', date: app.approved_at, done: !!app.approved_at },
                        { label: 'Disbursed', date: app.disbursed_at, done: !!app.disbursed_at },
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full -ml-[18px] ${step.done ? 'bg-primary' : 'bg-muted'}`} />
                          <span className={`text-xs ${step.done ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                            {step.label}
                          </span>
                          {step.date && (
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {new Date(step.date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Status update */}
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-muted text-foreground text-xs border border-border"
                    >
                      {Object.entries(STATUS_META).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </motion.div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyApplications;
