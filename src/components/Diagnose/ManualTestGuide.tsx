import { motion } from 'framer-motion';
import { CheckSquare, Beaker, Droplets, Hand } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlassCard from '@/components/GlassCard';

interface ManualTestGuideProps {
  deficiencies: string[];
  mode: 'disease' | 'soil';
}

interface TestStep {
  icon: typeof CheckSquare;
  title: string;
  description: string;
}

const getTestSteps = (deficiency: string): TestStep[] => {
  const lower = deficiency.toLowerCase();
  
  if (lower.includes('zinc') || lower.includes('iron')) {
    return [
      { icon: Beaker, title: 'pH Strip Test', description: 'Collect soil from 6-inch depth. Mix 1 part soil with 2 parts distilled water. Dip pH strip and wait 30 seconds. Compare color to chart.' },
      { icon: Droplets, title: 'Water Clarity Test', description: 'Add soil to a jar of clean water, shake well, let settle for 1 hour. Yellow/orange tint indicates iron deficiency.' },
      { icon: Hand, title: 'Feel Test', description: 'Moisten soil and rub between fingers. Gritty = sandy (low zinc). Sticky/smooth = clay (may retain zinc better).' },
      { icon: CheckSquare, title: 'Visual Leaf Check', description: 'Zinc deficiency: Interveinal chlorosis on young leaves, stunted growth. Iron deficiency: Yellow leaves with green veins.' },
    ];
  }
  
  if (lower.includes('nitrogen')) {
    return [
      { icon: Beaker, title: 'Leaf Color Chart', description: 'Compare leaf color against a Leaf Color Chart (LCC). Lighter green than shade 4 indicates nitrogen deficiency.' },
      { icon: Droplets, title: 'Growth Rate Check', description: 'Measure plant height weekly. Stunted growth with pale yellow-green older leaves suggests N deficiency.' },
      { icon: Hand, title: 'Soil Smell Test', description: 'Healthy nitrogen-rich soil has an earthy smell. Sour or no smell may indicate low organic matter and nitrogen.' },
      { icon: CheckSquare, title: 'Compost Indicator', description: 'If adding organic compost doesn\'t green up plants in 2 weeks, severe N deficiency likely. Consider urea application.' },
    ];
  }
  
  if (lower.includes('phosphorus') || lower.includes('potassium')) {
    return [
      { icon: Beaker, title: 'pH Test First', description: 'Test soil pH with strip. Phosphorus is most available at pH 6.0-7.0. Outside this range, P is locked up.' },
      { icon: Droplets, title: 'Root Examination', description: 'Dig up a sample plant. Poor root development and purple/reddish stems indicate phosphorus deficiency.' },
      { icon: Hand, title: 'Leaf Edge Check', description: 'Potassium deficiency: Brown, scorched leaf edges on older leaves. Leaves may curl downward.' },
      { icon: CheckSquare, title: 'Fruit Quality Test', description: 'Small, misshapen fruits or delayed flowering often indicate P/K deficiency. Compare with healthy reference.' },
    ];
  }
  
  // Generic soil test
  return [
    { icon: Beaker, title: 'pH Strip Test', description: 'Collect soil from 6-inch depth. Mix with distilled water (1:2 ratio). Dip pH strip and compare to color chart.' },
    { icon: Hand, title: 'Texture Feel Test', description: 'Wet the soil and roll between fingers. Sandy (gritty), Clay (sticky ribbon), Loam (smooth, crumbly).' },
    { icon: Droplets, title: 'Percolation Test', description: 'Dig a 12-inch hole, fill with water, let drain. Refill and time drainage. >4 hours = poor drainage (clay).' },
    { icon: CheckSquare, title: 'Organic Matter Check', description: 'Dark soil = high organic matter. Light/grey soil = low organic matter. Add compost if needed.' },
  ];
};

const ManualTestGuide = ({ deficiencies, mode }: ManualTestGuideProps) => {
  const { t } = useTranslation();
  const primaryDeficiency = deficiencies[0] || (mode === 'soil' ? 'general' : 'nitrogen');
  const steps = getTestSteps(primaryDeficiency);

  return (
    <div className="mt-3 space-y-3">
      <GlassCard className="!p-3">
        <p className="text-xs text-muted-foreground mb-3">
          {t('diagnose.test_guide_desc')}
        </p>
        
        <div className="space-y-3">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: i * 0.1 }}
              className="flex gap-3"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <step.icon size={14} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs font-mono text-muted-foreground">{i + 1}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default ManualTestGuide;
