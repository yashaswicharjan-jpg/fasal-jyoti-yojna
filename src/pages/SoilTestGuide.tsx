import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Beaker, Eye, Droplets, CheckCircle2 } from 'lucide-react';
import TopBar from '@/components/TopBar';
import GlassCard from '@/components/GlassCard';
import FloatingSection from '@/components/FloatingSection';

const steps = [
  {
    title: 'Collect Soil Sample',
    emoji: '🪴',
    icon: Beaker,
    instruction: 'Dig 6-8 inches deep. Take soil from 5 different spots in your field and mix them together.',
    tip: 'Avoid sampling near trees, compost pits, or field boundaries.',
    color: 'text-earth',
  },
  {
    title: 'Prepare pH Strip',
    emoji: '🧪',
    icon: Beaker,
    instruction: 'Add 2 tablespoons of soil to a clean cup. Add distilled water, stir for 30 seconds, and let it settle for 1 minute.',
    tip: 'Use distilled water only — tap water can affect results.',
    color: 'text-primary',
  },
  {
    title: 'Dip pH Strip',
    emoji: '📏',
    icon: Droplets,
    instruction: 'Dip the pH strip into the water for 3 seconds. Remove and wait 30 seconds for the color to develop.',
    tip: 'Do not shake off excess water — let it develop naturally.',
    color: 'text-secondary',
  },
  {
    title: 'Match Color',
    emoji: '🎨',
    icon: Eye,
    instruction: 'Compare the strip color to the chart below:',
    tip: 'Take a photo for your records. Use the Diagnose tab for AI-powered analysis.',
    color: 'text-accent',
    colorChart: true,
  },
  {
    title: 'Record Results',
    emoji: '📝',
    icon: CheckCircle2,
    instruction: 'Note your pH value. Ideal range for most crops is 6.0 - 7.5.',
    tip: 'Save this result in your Farm Portfolio for AI-powered crop recommendations.',
    color: 'text-primary',
    results: true,
  },
];

const phColors = [
  { ph: '4.0', color: '#FF4444', label: 'Very Acidic' },
  { ph: '5.0', color: '#FF8844', label: 'Acidic' },
  { ph: '6.0', color: '#FFCC00', label: 'Slightly Acidic' },
  { ph: '6.5', color: '#88CC44', label: 'Neutral (Ideal)' },
  { ph: '7.0', color: '#44AA44', label: 'Neutral' },
  { ph: '7.5', color: '#44AAAA', label: 'Slightly Alkaline' },
  { ph: '8.0', color: '#4488CC', label: 'Alkaline' },
  { ph: '9.0', color: '#6644AA', label: 'Very Alkaline' },
];

const SoilTestGuide = () => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];

  return (
    <div className="ether-bg pb-20">
      <TopBar />
      <main className="px-4 py-4 max-w-lg mx-auto space-y-5">
        <FloatingSection index={0} float="none">
          <h2 className="text-2xl font-bold text-foreground">🧪 Soil Test Guide</h2>
          <p className="text-sm text-muted-foreground">Step-by-step manual pH testing</p>
        </FloatingSection>

        {/* Progress */}
        <FloatingSection index={1} float="none">
          <div className="flex items-center gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Step {currentStep + 1} of {steps.length}
          </p>
        </FloatingSection>

        {/* Step Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <FloatingSection index={2} float="slow">
              <GlassCard className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{step.emoji}</span>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{step.title}</h3>
                    <step.icon size={16} className={step.color} />
                  </div>
                </div>

                <p className="text-foreground leading-relaxed">{step.instruction}</p>

                {/* Color Chart */}
                {step.colorChart && (
                  <div className="grid grid-cols-4 gap-2">
                    {phColors.map(ph => (
                      <div key={ph.ph} className="flex flex-col items-center gap-1">
                        <div
                          className="w-10 h-10 rounded-lg border border-border/40"
                          style={{ backgroundColor: ph.color }}
                        />
                        <span className="text-xs font-mono font-semibold text-foreground">{ph.ph}</span>
                        <span className="text-[9px] text-muted-foreground text-center leading-tight">{ph.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Results interpretation */}
                {step.results && (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                      <p className="text-sm font-medium text-primary">pH 6.0 - 7.5 → ✅ Good for most crops</p>
                    </div>
                    <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                      <p className="text-sm font-medium text-accent">pH &lt; 6.0 → Add lime to increase pH</p>
                    </div>
                    <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20">
                      <p className="text-sm font-medium text-secondary">pH &gt; 7.5 → Add sulphur or gypsum</p>
                    </div>
                  </div>
                )}

                {/* Tip */}
                <div className="p-3 rounded-xl bg-muted/50 border border-border/30">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Tip:</strong> {step.tip}
                  </p>
                </div>
              </GlassCard>
            </FloatingSection>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <FloatingSection index={3} float="none">
          <div className="flex gap-3">
            <motion.button
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex-1 py-3 rounded-xl bg-muted text-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-30"
            >
              <ChevronLeft size={18} /> Previous
            </motion.button>
            <motion.button
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-30"
            >
              Next <ChevronRight size={18} />
            </motion.button>
          </div>
        </FloatingSection>
      </main>
    </div>
  );
};

export default SoilTestGuide;
