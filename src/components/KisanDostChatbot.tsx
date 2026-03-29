import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mic, Camera, Upload } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const KisanDostChatbot = () => {
  const { t } = useTranslation();
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulated response (replace with Gemini API)
    await new Promise((r) => setTimeout(r, 1500));

    const responses: Record<string, string> = {
      default: `अच्छा सवाल है! 🌾\n\nआपके सवाल का जवाब देने के लिए मुझे AI सेवा से जुड़ना होगा। अभी मैं डेमो मोड में हूँ।\n\n**सुझाव:**\n- फोटो भेजकर फसल रोग की पहचान करें\n- मिट्टी के बारे में पूछें\n- सरकारी योजनाओं की जानकारी लें\n- खाद और सिंचाई सलाह पाएं`,
    };

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responses.default,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMsg]);
    setIsTyping(false);
  };

  return (
    <>
      {/* FAB */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center animate-bounce-gentle"
        >
          <span className="text-2xl">🌾</span>
        </motion.button>
      )}

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 h-[85vh] bg-card rounded-t-3xl shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl">🌾</span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">{t('chatbot.title')}</h3>
                  <p className="text-xs text-muted-foreground">{t('chatbot.subtitle')}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
              >
                <X size={18} className="text-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'glass-card-solid rounded-bl-md'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none text-foreground [&_strong]:text-foreground [&_p]:text-foreground [&_li]:text-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="glass-card-solid px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-muted-foreground"
                          style={{
                            animation: `dot-pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border safe-area-bottom">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Mic size={18} />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Camera size={18} />
                  </button>
                </div>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t('chatbot.placeholder')}
                  className="flex-1 px-4 py-2.5 rounded-full bg-muted text-foreground text-sm border border-border min-h-[44px]"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default KisanDostChatbot;
