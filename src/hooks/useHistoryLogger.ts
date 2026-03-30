import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type FeatureType =
  | 'disease_detection'
  | 'soil_analysis'
  | 'crop_advisor'
  | 'irrigation'
  | 'fertilizer'
  | 'mandi_price'
  | 'weather'
  | 'govt_scheme'
  | 'kisan_dost_chat'
  | 'yield_prediction';

interface SearchHistoryEntry {
  query: string;
  feature: FeatureType;
  result_summary?: string | null;
}

interface AIDiagnosticEntry {
  image_url?: string;
  detection_type: string;
  result_title: string;
  treatment_plan: string;
  organic_options: string;
}

export const useHistoryLogger = () => {
  const { user } = useAuth();

  const logSearch = async (entry: SearchHistoryEntry) => {
    if (!user?.id) return;
    try {
      await supabase.from('search_history').insert({
        user_id: user.id,
        query: entry.query,
        feature: entry.feature,
        result_summary: entry.result_summary ?? null,
      });
    } catch (err) {
      console.warn('History log failed (non-critical):', err);
    }
  };

  const logAIDiagnostic = async (entry: AIDiagnosticEntry) => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('ai_diagnostics')
        .insert({
          user_id: user.id,
          image_url: entry.image_url ?? null,
          detection_type: entry.detection_type,
          result_title: entry.result_title,
          treatment_plan: entry.treatment_plan,
          organic_options: entry.organic_options,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('AI diagnostic log failed (non-critical):', err);
    }
  };

  return { logSearch, logAIDiagnostic };
};
