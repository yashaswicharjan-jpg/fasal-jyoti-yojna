import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import { startVoiceRecognition, matchVoiceCommand } from '@/utils/voice';
import { useAppStore } from '@/store/useAppStore';

const VoiceCommandButton = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const navigate = useNavigate();
  const { language } = useAppStore();

  const handleVoice = useCallback(() => {
    if (isListening) return;

    setIsListening(true);
    setShowTooltip(false);
    setTranscript('');

    const stop = startVoiceRecognition(
      language,
      (text) => {
        setTranscript(text);
        setShowTooltip(true);

        const matched = matchVoiceCommand(text, [
          { patterns: ['बीमारी', 'disease', 'रोग', 'तपासणी'], action: () => navigate('/diagnose') },
          { patterns: ['मौसम', 'weather', 'हवामान'], action: () => navigate('/') },
          { patterns: ['फसल', 'crop', 'पीक', 'पिके'], action: () => navigate('/crops') },
          { patterns: ['किसान दोस्त', 'kisan dost', 'chatbot', 'मित्र'], action: () => {} },
          { patterns: ['घर', 'home', 'होम', 'dashboard'], action: () => navigate('/') },
          { patterns: ['समुदाय', 'community', 'किसान'], action: () => navigate('/community') },
          { patterns: ['प्रोफ़ाइल', 'profile', 'प्रोफाइल'], action: () => navigate('/profile') },
        ]);

        setTimeout(() => {
          setShowTooltip(false);
          setTranscript('');
        }, 2000);
      },
      () => setIsListening(false)
    );

    if (!stop) {
      setIsListening(false);
    }
  }, [isListening, language, navigate]);

  return (
    <div className="relative">
      <button
        onClick={handleVoice}
        className={`p-2 rounded-full min-h-[40px] min-w-[40px] flex items-center justify-center transition-all ${
          isListening
            ? 'bg-destructive text-destructive-foreground animate-pulse'
            : 'bg-muted text-muted-foreground hover:text-foreground'
        }`}
      >
        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
      </button>

      {/* Listening indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-destructive"
          >
            <div className="w-full h-full rounded-full bg-destructive animate-ping" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript tooltip */}
      <AnimatePresence>
        {showTooltip && transcript && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full right-0 mt-2 px-3 py-2 bg-foreground text-background rounded-lg text-xs font-medium max-w-[200px] whitespace-nowrap z-50 shadow-lg"
          >
            🎤 {transcript}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceCommandButton;
