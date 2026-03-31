import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mic, MicOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useHistoryLogger } from '@/hooks/useHistoryLogger';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startVoiceRecognition } from '@/utils/voice';
import { useAppStore } from '@/store/useAppStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

const KisanDostChatbot = () => {
  const { t, i18n } = useTranslation();
  const { logSearch } = useHistoryLogger();
  const { user } = useAuth();
  const { language } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'नमस्ते! 🙏 मैं **किसान दोस्त** हूँ — आपका AI किसान सहायक। खेती से जुड़ा कोई भी सवाल पूछिए!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const stopRecognitionRef = useRef<(() => void) | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleVoiceInput = useCallback(() => {
    if (isListening) {
      stopRecognitionRef.current?.();
      setIsListening(false);
      return;
    }

    setIsListening(true);

    const stop = startVoiceRecognition(
      language || i18n.language,
      (text) => {
        setInput(text);
        setIsListening(false);
        // Auto-send after voice input
        setTimeout(() => {
          const fakeEvent = { key: 'Enter' } as React.KeyboardEvent;
          // We'll trigger send directly
        }, 100);
      },
      () => setIsListening(false)
    );

    if (!stop) {
      setIsListening(false);
      return;
    }
    stopRecognitionRef.current = stop;

    // Auto-stop after 10 seconds
    setTimeout(() => {
      if (stopRecognitionRef.current) {
        stopRecognitionRef.current();
        setIsListening(false);
      }
    }, 10000);
  }, [isListening, language, i18n.language]);

  // Auto-send when input is set via voice
  const prevInputRef = useRef('');
  useEffect(() => {
    if (input && input !== prevInputRef.current && !isListening && prevInputRef.current === '') {
      // Voice input just completed, auto-send
      setTimeout(() => handleSend(), 200);
    }
    prevInputRef.current = input;
  }, [input, isListening]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMessage = input.trim();
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userMessage, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    logSearch({
      query: userMessage.substring(0, 200),
      feature: 'kisan_dost_chat',
    });

    let assistantContent = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode: 'chat',
          language: i18n.language,
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok || !resp.body) throw new Error('Stream failed');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const upsertAssistant = (text: string) => {
        assistantContent = text;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && last.id.startsWith('stream-')) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: text } : m);
          }
          return [...prev, { id: 'stream-' + Date.now(), role: 'assistant', content: text, timestamp: new Date() }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(assistantContent + content);
          } catch { /* partial json */ }
        }
      }

      if (user && assistantContent) {
        try {
          await supabase.from('ai_chat_history').insert({
            user_id: user.id,
            category: 'chat',
            query: userMessage.substring(0, 500),
            response: assistantContent.substring(0, 5000),
          });
        } catch { /* non-critical */ }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: t('chatbot.error'), timestamp: new Date() },
      ]);
    }
    setIsTyping(false);
  };

  return (
    <>
      {!isOpen && (
        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center animate-bounce-gentle">
          <span className="text-2xl">🌾</span>
        </motion.button>
      )}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 h-[85vh] bg-card rounded-t-3xl shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><span className="text-xl">🌾</span></div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">{t('chatbot.title')}</h3>
                  <p className="text-xs text-muted-foreground">{t('chatbot.subtitle')}</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <X size={18} className="text-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'glass-card-solid rounded-bl-md'}`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none text-foreground [&_strong]:text-foreground [&_p]:text-foreground [&_li]:text-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                  </div>
                </motion.div>
              ))}
              {isTyping && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex justify-start">
                  <div className="glass-card-solid px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-muted-foreground" style={{ animation: `dot-pulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-border safe-area-bottom">
              <div className="flex items-center gap-2">
                {/* Voice button */}
                <button
                  onClick={handleVoiceInput}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? 'bg-destructive text-destructive-foreground animate-pulse'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <input value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isListening ? (t('chatbot.listening') || '🎤 Listening...') : t('chatbot.placeholder')}
                  className="flex-1 px-4 py-2.5 rounded-full bg-muted text-foreground text-sm border border-border min-h-[44px]" />
                <button onClick={handleSend} disabled={!input.trim() || isTyping}
                  className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40">
                  <Send size={18} />
                </button>
              </div>
              {isListening && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-xs text-center text-destructive mt-2 font-medium">
                  🎤 {t('chatbot.listening') || 'Listening... Speak now'}
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default KisanDostChatbot;
