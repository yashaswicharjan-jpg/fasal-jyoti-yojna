import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, CheckCircle, AlertTriangle, TestTube } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import GlassCard from '@/components/GlassCard';
import ManualTestGuide from './ManualTestGuide';
import { supabase } from '@/integrations/supabase/client';

interface FollowUpQuestion {
  id: string;
  question: string;
  options: string[];
}

interface DiagnosticFeedbackProps {
  mode: 'disease' | 'soil';
  result: any;
  onRefinedResult: (refined: any) => void;
}

const DISEASE_FOLLOWUPS: FollowUpQuestion[] = [
  { id: 'residue', question: 'Is there sticky residue under the leaves?', options: ['Yes', 'No', 'Not sure'] },
  { id: 'onset', question: 'When did symptoms first appear?', options: ['1-2 days ago', '3-7 days ago', '1-2 weeks ago', 'More than 2 weeks'] },
  { id: 'rain', question: 'Has it rained in the last 3 days?', options: ['Yes, heavy', 'Yes, light', 'No'] },
  { id: 'spread', question: 'Is the issue spreading to other plants?', options: ['Yes, rapidly', 'Yes, slowly', 'Only this plant'] },
  { id: 'previous', question: 'Have you applied any treatment already?', options: ['Chemical spray', 'Organic remedy', 'Nothing yet'] },
];

const SOIL_FOLLOWUPS: FollowUpQuestion[] = [
  { id: 'dryness', question: 'Has the soil been unusually dry for 3+ days?', options: ['Yes', 'No', 'Alternating wet/dry'] },
  { id: 'cracking', question: 'Is the soil cracking or forming hard lumps?', options: ['Yes, deep cracks', 'Surface cracks only', 'No cracking'] },
  { id: 'last_crop', question: 'What was the last crop grown in this field?', options: ['Rice/Paddy', 'Wheat', 'Pulses/Legumes', 'Vegetables', 'Fallow/None'] },
  { id: 'water_color', question: 'What color is the water when you pour it on this soil?', options: ['Clear', 'Yellowish', 'Brownish', 'Reddish'] },
  { id: 'worms', question: 'Do you see earthworms in this soil?', options: ['Many', 'A few', 'None'] },
];

const DiagnosticFeedback = ({ mode, result, onRefinedResult }: DiagnosticFeedbackProps) => {
  const { t, i18n } = useTranslation();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [refining, setRefining] = useState(false);
  const [refined, setRefined] = useState(false);
  const [showTestGuide, setShowTestGuide] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const confidenceNum = parseInt(result?.Confidence?.replace('%', '') || '90');
  const needsFollowUp = confidenceNum < 85;
  const questions = mode === 'disease' ? DISEASE_FOLLOWUPS : SOIL_FOLLOWUPS;
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  // Detect nutrient deficiencies for manual test guide
  const deficiencies = result?.Deficiencies || [];
  const hasNutrientDeficiency = deficiencies.length > 0 || 
    (result?.ChemicalCure && /zinc|nitrogen|phosphorus|potassium|iron/i.test(result.ChemicalCure));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentIndex, refined]);

  if (!needsFollowUp && !hasNutrientDeficiency) return null;

  const handleAnswer = (questionId: string, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    
    if (currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    }
  };

  const handleRefine = async () => {
    setRefining(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          mode: 'diagnostic_followup',
          language: i18n.language,
          messages: [{
            role: 'user',
            content: JSON.stringify({
              originalResult: result,
              diagnosticType: mode,
              followUpAnswers: answers,
            }),
          }],
        },
      });
      if (!error && data?.result) {
        onRefinedResult(data.result);
        setRefined(true);
      }
    } catch (err) {
      console.error('Refinement failed:', err);
    }
    setRefining(false);
  };

  const allAnswered = answeredCount >= questions.length;

  return (
    <div className="space-y-3 mt-4">
      {/* Low confidence banner */}
      {needsFollowUp && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-2xl bg-accent/10 border border-accent/20"
        >
          <AlertTriangle size={18} className="text-accent flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">{t('diagnose.low_confidence_title')}</p>
            <p className="text-xs text-muted-foreground">{t('diagnose.low_confidence_desc')}</p>
          </div>
        </motion.div>
      )}

      {/* Progress bar */}
      {needsFollowUp && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MessageCircle size={12} /> {t('diagnose.diagnostic_progress')}
            </span>
            <span className="text-xs font-mono text-primary">{answeredCount}/{questions.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </motion.div>
      )}

      {/* Chat-style follow-up questions */}
      {needsFollowUp && (
        <div className="space-y-3">
          <AnimatePresence>
            {questions.slice(0, currentIndex + 1).map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, delay: i * 0.08 }}
              >
                {/* AI question bubble */}
                <div className="flex justify-start mb-2">
                  <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md glass-card-solid">
                    <p className="text-sm text-foreground">{q.question}</p>
                  </div>
                </div>

                {/* Answer options */}
                <div className="flex flex-wrap gap-2 pl-2">
                  {q.options.map((opt) => (
                    <motion.button
                      key={opt}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAnswer(q.id, opt)}
                      className={`px-3 py-2 rounded-full text-xs font-medium transition-all min-h-[36px] border ${
                        answers[q.id] === opt
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card/60 text-foreground border-border/40 hover:border-primary/40'
                      }`}
                    >
                      {answers[q.id] === opt && <CheckCircle size={12} className="inline mr-1" />}
                      {opt}
                    </motion.button>
                  ))}
                </div>

                {/* User answer bubble */}
                {answers[q.id] && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-end mt-2"
                  >
                    <div className="px-4 py-2 rounded-2xl rounded-br-md bg-primary text-primary-foreground text-sm">
                      {answers[q.id]}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Refine button */}
          {allAnswered && !refined && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <button
                onClick={handleRefine}
                disabled={refining}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold min-h-[48px] disabled:opacity-50"
              >
                {refining ? t('diagnose.refining') : t('diagnose.refine_diagnosis')}
              </button>
            </motion.div>
          )}

          {refined && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 p-3 rounded-2xl bg-primary/10 border border-primary/20"
            >
              <CheckCircle size={18} className="text-primary" />
              <p className="text-sm font-medium text-foreground">{t('diagnose.diagnosis_refined')}</p>
            </motion.div>
          )}
        </div>
      )}

      {/* Manual Test Kit Guide */}
      {hasNutrientDeficiency && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <button
            onClick={() => setShowTestGuide(!showTestGuide)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl glass-card-solid min-h-[48px]"
          >
            <div className="flex items-center gap-2">
              <TestTube size={18} className="text-accent" />
              <span className="text-sm font-medium text-foreground">{t('diagnose.manual_test_title')}</span>
            </div>
            <span className="text-xs text-primary font-medium">{showTestGuide ? t('common.cancel') : t('diagnose.view_guide')}</span>
          </button>

          <AnimatePresence>
            {showTestGuide && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="overflow-hidden"
              >
                <ManualTestGuide deficiencies={deficiencies} mode={mode} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default DiagnosticFeedback;
