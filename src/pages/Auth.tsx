import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import GlassCard from '@/components/GlassCard';

const Auth = () => {
  const { t } = useTranslation();
  const { signUp, signIn } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) toast.error(error.message);
    } else {
      if (!fullName.trim()) {
        toast.error('कृपया अपना नाम दर्ज करें');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('खाता बनाया गया! कृपया अपना ईमेल सत्यापित करें।');
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <span className="text-6xl">🌾</span>
          <h1 className="text-2xl font-bold text-foreground mt-3">Krishi Sahayak</h1>
          <p className="text-muted-foreground text-sm mt-1">AI-powered farming assistant</p>
        </div>

        <GlassCard className="p-6">
          <div className="flex rounded-full bg-muted p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px] ${
                isLogin ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              लॉगिन
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px] ${
                !isLogin ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              साइन अप
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="आपका नाम"
                className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border border-border min-h-[48px]"
                required
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ईमेल"
              className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border border-border min-h-[48px]"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="पासवर्ड"
              className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border border-border min-h-[48px]"
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold min-h-[48px] disabled:opacity-50"
            >
              {loading ? '...' : isLogin ? 'लॉगिन करें' : 'खाता बनाएं'}
            </button>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default Auth;
