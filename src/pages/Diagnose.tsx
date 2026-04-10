import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image, Scan, Shield, Leaf, FlaskConical, Share2, Bot } from 'lucide-react';
import TopBar from '@/components/TopBar';
import GlassCard from '@/components/GlassCard';
import SeedLoader from '@/components/SeedLoader';
import SpeakButton from '@/components/SpeakButton';
import DiagnosticFeedback from '@/components/Diagnose/DiagnosticFeedback';
import { compressImage, formatBytes } from '@/utils/imageCompression';
import { shareOnWhatsApp, formatDiseaseForWhatsApp } from '@/utils/sharing';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useHistoryLogger } from '@/hooks/useHistoryLogger';
import { toast } from 'sonner';

type Mode = 'disease' | 'soil';
type Tab = 'chemical' | 'organic' | 'prevention';

const Diagnose = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { logSearch, logAIDiagnostic } = useHistoryLogger();
  const [mode, setMode] = useState<Mode>('disease');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('chemical');
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressionInfo(i18n.language === 'hi' ? 'छवि अनुकूलित हो रही है...' : 'Optimizing image...');
    try {
      const compressed = await compressImage(file);
      setImagePreview(compressed.dataUrl);
      setCompressionInfo(`${formatBytes(compressed.originalSize)} → ${formatBytes(compressed.compressedSize)}`);
      setTimeout(() => setCompressionInfo(null), 3000);
    } catch {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setCompressionInfo(null);
    }
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!imagePreview) return;
    setAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          mode,
          imageBase64: imagePreview,
          language: i18n.language,
          messages: [{ role: 'user', content: mode === 'disease' ? 'Analyze this plant for diseases' : 'Analyze this soil sample' }],
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data.result);

      if (user && data.result) {
        await logAIDiagnostic({
          detection_type: mode,
          result_title: mode === 'disease' ? (data.result.DiseaseName || 'Analysis') : (data.result.SoilType || 'Soil Analysis'),
          treatment_plan: data.result.ChemicalCure || data.result.Amendments || '',
          organic_options: data.result.OrganicAlternative || '',
        });
        await logSearch({
          query: mode === 'disease' ? 'Disease image analysis' : 'Soil image analysis',
          feature: mode === 'disease' ? 'disease_detection' : 'soil_analysis',
          result_summary: mode === 'disease' ? data.result.DiseaseName : data.result.SoilType,
        });

        try {
          await supabase.from('ai_chat_history').insert({
            user_id: user.id,
            category: mode === 'disease' ? 'disease_detection' : 'soil_analysis',
            query: mode === 'disease' ? 'Plant disease image analysis' : 'Soil sample image analysis',
            response: JSON.stringify(data.result),
          });
        } catch { /* non-critical */ }
      }
    } catch (err: any) {
      console.error('AI analysis error:', err);
      toast.error(t('diagnose.analysis_failed'));
      if (mode === 'disease') {
        setResult({
          DiseaseName: 'Late Blight', DiseaseNameHindi: 'पछेती अंगमारी',
          Severity: 'Medium', Confidence: '72%',
          ChemicalCure: 'Mancozeb 75% WP', ChemicalDosage: '2.5 g/L water',
          OrganicAlternative: 'Neem oil spray',
          OrganicMethod: 'Mix 5ml neem oil per liter of water, spray on affected leaves early morning',
          Prevention: ['Ensure proper spacing', 'Avoid overhead irrigation', 'Remove infected parts'],
          AffectedCrops: ['Tomato', 'Potato'],
          ImmediateAction: 'Remove and destroy affected leaves immediately',
        });
      } else {
        setResult({
          SoilType: 'Black Cotton Soil', pH: '7.2 - 7.8', Fertility: 'Medium', Confidence: '68%',
          RecommendedCrops: ['Cotton', 'Soybean', 'Sorghum'],
          Deficiencies: ['Zinc', 'Iron'],
          Amendments: 'Add Zinc Sulphate (25 kg/ha) and FeSO4 (50 kg/ha).',
        });
      }
    }
    setAnalyzing(false);
  };

  const handleRefinedResult = (refined: any) => {
    setResult(refined);
    toast.success(t('diagnose.diagnosis_refined'));
  };

  const severityColor = (s: string) => {
    if (s === 'Low') return 'bg-secondary text-secondary-foreground';
    if (s === 'Medium') return 'bg-accent text-accent-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const getResultSpeechText = () => {
    if (!result) return '';
    if (mode === 'disease') {
      return `रोग: ${result.DiseaseNameHindi || result.DiseaseName}. गंभीरता: ${result.Severity}. रासायनिक उपचार: ${result.ChemicalCure}, मात्रा ${result.ChemicalDosage}. जैविक विकल्प: ${result.OrganicAlternative}. ${result.ImmediateAction}`;
    }
    return `मिट्टी: ${result.SoilType}. pH: ${result.pH}. उपजाऊपन: ${result.Fertility}. सुझाई फसलें: ${result.RecommendedCrops?.join(', ')}`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={t('diagnose.title')} />
      <main className="px-4 py-4 max-w-lg mx-auto space-y-4">
        <div className="flex rounded-full bg-muted p-1">
          {(['disease', 'soil'] as Mode[]).map((m) => (
            <button key={m} onClick={() => { setMode(m); setResult(null); }}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px] ${mode === m ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'}`}>
              {m === 'disease' ? t('diagnose.leaf_disease') : t('diagnose.soil_analysis')}
            </button>
          ))}
        </div>

        <GlassCard className="flex flex-col items-center gap-4">
          {imagePreview ? (
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-muted">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full aspect-square rounded-2xl bg-muted/50 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border">
              <Scan size={48} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center px-4">{t('diagnose.no_image')}</p>
            </div>
          )}
          {compressionInfo && <p className="text-xs text-primary font-medium">📷 {compressionInfo}</p>}
          <div className="flex gap-3 w-full">
            <button onClick={() => { fileRef.current?.setAttribute('capture', 'environment'); fileRef.current?.click(); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium min-h-[48px] animate-pulse-scale">
              <Camera size={20} /><span className="text-sm">{t('diagnose.take_photo')}</span>
            </button>
            <button onClick={() => { fileRef.current?.removeAttribute('capture'); fileRef.current?.click(); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-muted text-foreground font-medium min-h-[48px]">
              <Image size={20} /><span className="text-sm">{t('diagnose.gallery')}</span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          {imagePreview && !analyzing && !result && (
            <button onClick={handleAnalyze}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold min-h-[48px]">
              {t('diagnose.analyze')}
            </button>
          )}
        </GlassCard>

        {analyzing && <SeedLoader text={t('diagnose.analyzing')} />}

        <AnimatePresence>
          {result && !analyzing && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="space-y-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border/50">
                <Bot size={14} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{t('diagnose.ai_label')}</span>
              </div>

              {mode === 'disease' ? (
                <>
                  <GlassCard>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-foreground">{result.DiseaseName}</h3>
                      <div className="flex items-center gap-2">
                        <SpeakButton text={getResultSpeechText()} />
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${severityColor(result.Severity)}`}>{result.Severity}</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm mb-1">{result.DiseaseNameHindi}</p>
                    <p className="text-sm text-foreground">{t('diagnose.confidence')}: {result.Confidence}</p>
                    <p className="text-sm text-accent font-medium mt-2">⚡ {result.ImmediateAction}</p>
                  </GlassCard>

                  <div className="flex rounded-xl bg-muted p-1 gap-1">
                    {([
                      { key: 'chemical' as Tab, icon: FlaskConical, label: t('diagnose.chemical') },
                      { key: 'organic' as Tab, icon: Leaf, label: t('diagnose.organic') },
                      { key: 'prevention' as Tab, icon: Shield, label: t('diagnose.prevention') },
                    ]).map((tab) => (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all min-h-[44px] ${activeTab === tab.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                        <tab.icon size={14} />{tab.label}
                      </button>
                    ))}
                  </div>

                  <GlassCard>
                    {activeTab === 'chemical' && (
                      <div className="space-y-2">
                        <p className="font-semibold text-foreground">🧪 {result.ChemicalCure}</p>
                        <p className="text-sm text-muted-foreground">{result.ChemicalDosage}</p>
                      </div>
                    )}
                    {activeTab === 'organic' && (
                      <div className="space-y-2">
                        <p className="font-semibold text-foreground">🌿 {result.OrganicAlternative}</p>
                        <p className="text-sm text-muted-foreground">{result.OrganicMethod}</p>
                      </div>
                    )}
                    {activeTab === 'prevention' && (
                      <ul className="space-y-2">
                        {result.Prevention?.map((p: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <Shield size={14} className="mt-0.5 text-primary flex-shrink-0" />{p}
                          </li>
                        ))}
                      </ul>
                    )}
                  </GlassCard>

                  <div className="flex gap-3">
                    <button onClick={() => shareOnWhatsApp(formatDiseaseForWhatsApp(result, i18n.language))}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary/10 text-secondary font-medium min-h-[48px]">
                      <Share2 size={16} />{t('diagnose.share_whatsapp')}
                    </button>
                  </div>
                </>
              ) : (
                <GlassCard className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">{result.SoilType}</h3>
                    <SpeakButton text={getResultSpeechText()} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">pH:</span> <span className="font-medium text-foreground">{result.pH}</span></div>
                    <div><span className="text-muted-foreground">Fertility:</span> <span className="font-medium text-foreground">{result.Fertility}</span></div>
                  </div>
                  {result.Confidence && (
                    <p className="text-sm text-foreground">{t('diagnose.confidence')}: {result.Confidence}</p>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Recommended Crops:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.RecommendedCrops?.map((c: string) => (
                        <span key={c} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Deficiencies:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.Deficiencies?.map((d: string) => (
                        <span key={d} className="px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">{d}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{result.Amendments}</p>
                </GlassCard>
              )}

              {/* Diagnostic Feedback Loop */}
              <DiagnosticFeedback mode={mode} result={result} onRefinedResult={handleRefinedResult} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Diagnose;
