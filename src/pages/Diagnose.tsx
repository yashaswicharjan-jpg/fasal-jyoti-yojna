import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image, Upload, Scan, Shield, Leaf, FlaskConical } from 'lucide-react';
import TopBar from '@/components/TopBar';
import GlassCard from '@/components/GlassCard';
import SeedLoader from '@/components/SeedLoader';

type Mode = 'disease' | 'soil';
type Tab = 'chemical' | 'organic' | 'prevention';

const Diagnose = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('disease');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('chemical');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imagePreview) return;
    setAnalyzing(true);
    // Simulate AI analysis for now (Gemini integration placeholder)
    await new Promise((r) => setTimeout(r, 2500));

    if (mode === 'disease') {
      setResult({
        DiseaseName: 'Late Blight',
        DiseaseNameHindi: 'पछेती अंगमारी',
        Severity: 'Medium',
        Confidence: '85%',
        ChemicalCure: 'Mancozeb 75% WP',
        ChemicalDosage: '2.5 g/L water',
        OrganicAlternative: 'Neem oil spray',
        OrganicMethod: 'Mix 5ml neem oil per liter of water, spray on affected leaves early morning',
        Prevention: ['Ensure proper spacing between plants', 'Avoid overhead irrigation', 'Remove and destroy infected plant parts'],
        AffectedCrops: ['Tomato', 'Potato'],
        ImmediateAction: 'Remove and destroy affected leaves immediately',
      });
    } else {
      setResult({
        SoilType: 'Black Cotton Soil',
        pH: '7.2 - 7.8',
        Fertility: 'Medium',
        RecommendedCrops: ['Cotton', 'Soybean', 'Sorghum'],
        Deficiencies: ['Zinc', 'Iron'],
        Amendments: 'Add Zinc Sulphate (25 kg/ha) and FeSO4 (50 kg/ha). Add organic manure for better structure.',
      });
    }
    setAnalyzing(false);
  };

  const severityColor = (s: string) => {
    if (s === 'Low') return 'bg-secondary text-secondary-foreground';
    if (s === 'Medium') return 'bg-accent text-accent-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={t('diagnose.title')} />
      <main className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Mode Toggle */}
        <div className="flex rounded-full bg-muted p-1">
          {(['disease', 'soil'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setResult(null); }}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px] ${
                mode === m ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {m === 'disease' ? t('diagnose.leaf_disease') : t('diagnose.soil_analysis')}
            </button>
          ))}
        </div>

        {/* Image Input */}
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

          <div className="flex gap-3 w-full">
            <button
              onClick={() => {
                fileRef.current?.setAttribute('capture', 'environment');
                fileRef.current?.click();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium min-h-[48px] animate-pulse-scale"
            >
              <Camera size={20} />
              <span className="text-sm">{t('diagnose.take_photo')}</span>
            </button>
            <button
              onClick={() => {
                fileRef.current?.removeAttribute('capture');
                fileRef.current?.click();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-muted text-foreground font-medium min-h-[48px]"
            >
              <Image size={20} />
              <span className="text-sm">{t('diagnose.gallery')}</span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

          {imagePreview && !analyzing && !result && (
            <button
              onClick={handleAnalyze}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold min-h-[48px] transition-all hover:opacity-90"
            >
              {t('diagnose.analyze')}
            </button>
          )}
        </GlassCard>

        {/* Loading */}
        {analyzing && <SeedLoader text={t('diagnose.analyzing')} />}

        {/* Results */}
        <AnimatePresence>
          {result && !analyzing && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              {mode === 'disease' ? (
                <>
                  <GlassCard>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-foreground">{result.DiseaseName}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${severityColor(result.Severity)}`}>
                        {result.Severity}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-1">{result.DiseaseNameHindi}</p>
                    <p className="text-sm text-foreground">{t('diagnose.confidence')}: {result.Confidence}</p>
                    <p className="text-sm text-accent font-medium mt-2">⚡ {result.ImmediateAction}</p>
                  </GlassCard>

                  {/* Tabs */}
                  <div className="flex rounded-xl bg-muted p-1 gap-1">
                    {([
                      { key: 'chemical' as Tab, icon: FlaskConical, label: t('diagnose.chemical') },
                      { key: 'organic' as Tab, icon: Leaf, label: t('diagnose.organic') },
                      { key: 'prevention' as Tab, icon: Shield, label: t('diagnose.prevention') },
                    ]).map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all min-h-[44px] ${
                          activeTab === tab.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        <tab.icon size={14} />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <GlassCard>
                    {activeTab === 'chemical' && (
                      <div className="space-y-2">
                        <p className="font-semibold text-foreground">🧪 {result.ChemicalCure}</p>
                        <p className="text-sm text-muted-foreground">{t('diagnose.chemical')}: {result.ChemicalDosage}</p>
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
                        {result.Prevention.map((p: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <Shield size={14} className="mt-0.5 text-primary flex-shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    )}
                  </GlassCard>
                </>
              ) : (
                <GlassCard className="space-y-3">
                  <h3 className="text-lg font-bold text-foreground">{result.SoilType}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">pH:</span> <span className="font-medium text-foreground">{result.pH}</span></div>
                    <div><span className="text-muted-foreground">Fertility:</span> <span className="font-medium text-foreground">{result.Fertility}</span></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Recommended Crops:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.RecommendedCrops.map((c: string) => (
                        <span key={c} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Deficiencies:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.Deficiencies.map((d: string) => (
                        <span key={d} className="px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">{d}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{result.Amendments}</p>
                </GlassCard>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Diagnose;
