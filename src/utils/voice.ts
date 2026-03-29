/**
 * Text-to-Speech utility for reading AI results aloud
 */
export const speakText = (
  text: string,
  lang: string = 'hi-IN',
  rate: number = 1
): SpeechSynthesisUtterance | null => {
  if (!('speechSynthesis' in window)) return null;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  const langMap: Record<string, string> = {
    hi: 'hi-IN',
    mr: 'mr-IN',
    en: 'en-IN',
  };
  utterance.lang = langMap[lang] || 'hi-IN';
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
  return utterance;
};

export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Voice recognition using Web Speech API
 */
export const startVoiceRecognition = (
  lang: string = 'hi',
  onResult: (text: string) => void,
  onEnd?: () => void
): (() => void) | null => {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  const langMap: Record<string, string> = {
    hi: 'hi-IN',
    mr: 'mr-IN',
    en: 'en-IN',
  };
  recognition.lang = langMap[lang] || 'hi-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    const text = event.results[0][0].transcript;
    onResult(text);
  };

  recognition.onend = () => onEnd?.();
  recognition.onerror = () => onEnd?.();

  recognition.start();

  return () => recognition.stop();
};

/**
 * Voice command matching
 */
interface VoiceCommand {
  patterns: string[];
  action: () => void;
}

export const matchVoiceCommand = (
  transcript: string,
  commands: VoiceCommand[]
): boolean => {
  const lower = transcript.toLowerCase().trim();
  for (const cmd of commands) {
    for (const pattern of cmd.patterns) {
      if (lower.includes(pattern.toLowerCase())) {
        cmd.action();
        return true;
      }
    }
  }
  return false;
};
