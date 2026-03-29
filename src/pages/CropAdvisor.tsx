import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, Share2, Bot } from 'lucide-react';
import TopBar from '@/components/TopBar';
import GlassCard from '@/components/GlassCard';
import SeedLoader from '@/components/SeedLoader';
import SpeakButton from '@/components/SpeakButton';
import { shareOnWhatsApp, formatCropForWhatsApp } from '@/utils/sharing';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const soilTypes = [
  { key: 'clay', emoji: '🏔️' },
  { key: 'sandy', emoji: '🏜️' },
  { key: 'loam', emoji: '🌱' },
  { key: 'black', emoji: '🖤' },
  { key: 'red', emoji: '🔴' },
];

const waterSources = [
  { key: 'canal', emoji: '🌊' },
  { key: 'borewell', emoji: '🔧' },
  { key: 'rainfed', emoji: '🌧️' },
  { key: 'drip', emoji: '💧' },
];

const indianStates = [
  'Maharashtra', 'Punjab', 'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan',
  'Andhra Pradesh', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Bihar',
  'West Bengal', 'Haryana', 'Telangana', 'Odisha', 'Chhattisgarh',
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CropAdvisor = () => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ soilType: '', state: '', month: '', landSize: '', waterSource: '' });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const totalSteps = 5;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          mode: 'crop_advisor',
          language: i18n.language,
          messages: [{
            role: 'user',
            content: `Recommend crops for: Soil=${form.soilType}, State=${form.state}, Month=${form.month}, Land=${form.landSize} acres, Water=${form.waterSource}`,
          }],
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const r = Array.isArray(data.result) ? data.result : [data.result];
      setResults(r);
    } catch (err) {
      console.error('Crop advisor error:', err);
      toast.error(t('crops.ai_failed'));
      setResults([
        { CropName: 'Soybean', CropNameHindi: 'सोयाबीन', Emoji: '🫘', YieldPerAcre: '8-10 quintals', GrowingPeriod: '90-120 days', MarketPrice: '₹4,500/quintal', EstimatedProfit: '₹25,000-35,000', WaterRequirement: 'Medium', BestSowingTime: 'June 15 - July 15', KeyTips: ['Use Rhizobium culture', 'Row spacing 30-45cm', 'Apply phosphorus at sowing'], GovernmentScheme: 'PM-KISAN', Confidence: '92%' },
        { CropName: 'Cotton', CropNameHindi: 'कपास', Emoji: '🏵️', YieldPerAcre: '6-8 quintals', GrowingPeriod: '150-180 days', MarketPrice: '₹6,500/quintal', EstimatedProfit: '₹30,000-42,000', WaterRequirement: 'Medium', BestSowingTime: 'May 15 - June 30', KeyTips: ['Use BT cotton', 'Apply Neem cake', 'Regular pest monitoring'], GovernmentScheme: 'Fasal Bima Yojana', Confidence: '87%' },
      ]);
    }
    setLoading(false);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!form.soilType;
      case 2: return !!form.state;
      case 3: return !!form.month;
      case 4: return !!form.landSize;
      case 5: return !!form.waterSource;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={t('crops.title')} />
      <main className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {!results ? (
          <>
            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < step ? 'bg-primary' : 'bg-muted'}`} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.25 }}>
                {step === 1 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-foreground">{t('crops.soil_type')}</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {soilTypes.map((s) => (
                        <GlassCard key={s.key} onClick={() => setForm({ ...form, soilType: s.key })}
                          className={`flex flex-col items-center gap-2 py-5 ${form.soilType === s.key ? 'ring-2 ring-primary' : ''}`}>
                          <span className="text-3xl">{s.emoji}</span>
                          <span className="text-sm font-medium text-foreground">{t(`crops.${s.key}`)}</span>
                        </GlassCard>
                      ))}
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-foreground">{t('crops.region')}</h3>
                    <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                      {indianStates.map((state) => (
                        <button key={state} onClick={() => setForm({ ...form, state })}
                          className={`w-full text-left px-4 py-3 rounded-xl min-h-[48px] transition-all ${form.state === state ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'}`}>
                          {state}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-foreground">{t('crops.month')}</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {months.map((m) => (
                        <button key={m} onClick={() => setForm({ ...form, month: m })}
                          className={`py-3 rounded-xl text-sm font-medium min-h-[48px] transition-all ${form.month === m ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {step === 4 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-foreground">{t('crops.land_size')}</h3>
                    <input type="number" value={form.landSize} onChange={(e) => setForm({ ...form, landSize: e.target.value })}
                      placeholder="e.g. 5" className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border border-border min-h-[48px] text-lg" />
                  </div>
                )}
                {step === 5 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-foreground">{t('crops.water')}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {waterSources.map((w) => (
                        <GlassCard key={w.key} onClick={() => setForm({ ...form, waterSource: w.key })}
                          className={`flex flex-col items-center gap-2 py-5 ${form.waterSource === w.key ? 'ring-2 ring-primary' : ''}`}>
                          <span className="text-3xl">{w.emoji}</span>
                          <span className="text-sm font-medium text-foreground">{t(`crops.${w.key}`)}</span>
                        </GlassCard>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {loading && <SeedLoader text={t('diagnose.analyzing')} />}

            {!loading && (
              <div className="flex gap-3">
                {step > 1 && (
                  <button onClick={() => setStep(step - 1)} className="flex items-center justify-center gap-1 px-6 py-3 rounded-xl bg-muted text-foreground font-medium min-h-[48px]">
                    <ChevronLeft size={18} /> {t('crops.back')}
                  </button>
                )}
                <button onClick={() => (step === totalSteps ? handleSubmit() : setStep(step + 1))} disabled={!canProceed()}
                  className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold min-h-[48px] disabled:opacity-40 transition-all">
                  {step === totalSteps ? (<><Sparkles size={18} /> {t('crops.get_recommendations')}</>) : (<>{t('crops.next')} <ChevronRight size={18} /></>)}
                </button>
              </div>
            )}
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border/50">
              <Bot size={14} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{t('diagnose.ai_label')}</span>
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">{t('crops.recommendations')}</h3>
              <button onClick={() => { setResults(null); setStep(1); }} className="text-sm text-primary font-medium min-h-[44px] px-3">{t('crops.new_search')}</button>
            </div>
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide">
              {results.map((crop, i) => (
                <GlassCard key={i} onClick={() => setExpandedCard(expandedCard === i ? null : i)}
                  className="min-w-[85vw] max-w-[340px] snap-center flex-shrink-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{crop.Emoji}</span>
                      <div>
                        <h4 className="font-bold text-foreground text-lg">{crop.CropName}</h4>
                        <p className="text-sm text-muted-foreground">{crop.CropNameHindi}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">{crop.Confidence}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[
                      { label: t('crops.yield'), val: crop.YieldPerAcre },
                      { label: t('crops.profit'), val: crop.EstimatedProfit },
                      { label: t('crops.growing_period'), val: crop.GrowingPeriod },
                      { label: t('crops.market_price'), val: crop.MarketPrice },
                    ].map((item) => (
                      <div key={item.label} className="bg-muted/50 rounded-lg p-2">
                        <p className="text-muted-foreground text-[10px]">{item.label}</p>
                        <p className="font-semibold text-foreground">{item.val}</p>
                      </div>
                    ))}
                  </div>
                  {expandedCard === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-2 border-t border-border pt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">{t('crops.sowing_time')}</p>
                        <p className="text-sm font-medium text-foreground">{crop.BestSowingTime}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('crops.tips')}</p>
                        <ul className="space-y-1 mt-1">
                          {crop.KeyTips?.map((tip: string, j: number) => (
                            <li key={j} className="text-sm text-foreground flex items-start gap-1.5">
                              <span className="text-primary">•</span> {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {crop.GovernmentScheme && (
                        <div className="bg-accent/10 rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">{t('crops.govt_scheme')}</p>
                          <p className="text-sm font-medium text-accent">{crop.GovernmentScheme}</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <SpeakButton text={`${crop.CropNameHindi}. उपज ${crop.YieldPerAcre}. लाभ ${crop.EstimatedProfit}. बुवाई ${crop.BestSowingTime}`} />
                        <button onClick={(e) => { e.stopPropagation(); shareOnWhatsApp(formatCropForWhatsApp(crop)); }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary/10 text-secondary text-xs font-medium min-h-[40px]">
                          <Share2 size={14} /> WhatsApp
                        </button>
                      </div>
                    </motion.div>
                  )}
                </GlassCard>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default CropAdvisor;
