import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX } from 'lucide-react';
import { speakText, stopSpeaking } from '@/utils/voice';
import { useAppStore } from '@/store/useAppStore';

interface SpeakButtonProps {
  text: string;
  className?: string;
}

const SpeakButton = ({ text, className = '' }: SpeakButtonProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rate, setRate] = useState(1);
  const { language } = useAppStore();

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const utterance = speakText(text, language, rate);
    if (utterance) {
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
    }
  };

  const cycleRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rates = [0.75, 1, 1.25];
    const idx = rates.indexOf(rate);
    setRate(rates[(idx + 1) % rates.length]);
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={handleSpeak}
        className={`p-2 rounded-full min-h-[40px] min-w-[40px] flex items-center justify-center transition-all ${
          isSpeaking
            ? 'bg-primary text-primary-foreground animate-pulse'
            : 'bg-muted text-muted-foreground hover:text-foreground'
        }`}
        title={isSpeaking ? 'Stop' : 'Listen'}
      >
        {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      <button
        onClick={cycleRate}
        className="text-[10px] text-muted-foreground font-medium px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 min-h-[24px]"
      >
        {rate}x
      </button>
    </div>
  );
};

export default SpeakButton;
