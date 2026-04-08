import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import GlassCard from '@/components/GlassCard';
import { useAppStore } from '@/store/useAppStore';
import { lovable } from '@/integrations/lovable/index';

const Auth = () => {
  const { t, i18n } = useTranslation();
  const { signUp, signIn } = useAuth();
  const { setLanguage } = useAppStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLangChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || t('common.error'));
      }
      if (result.redirected) return;
    } catch (err: any) {
      toast.error(err.message || t('common.error'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) toast.error(error.message);
    } else {
      if (!fullName.trim()) {
        toast.error(t('auth.name_required'));
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t('auth.signup_success'));
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-6xl">🌾</span>
          <h1 className="text-2xl font-bold text-foreground mt-3">{t('app_name')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('auth.tagline')}</p>
          <div className="flex justify-center gap-1 mt-4 bg-muted rounded-full p-0.5 mx-auto w-fit">
            {[{ c: 'en', l: 'EN' }, { c: 'hi', l: 'हि' }, { c: 'mr', l: 'म' }].map((lang) => (
              <button key={lang.c} onClick={() => handleLangChange(lang.c)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium min-h-[32px] transition-all ${i18n.language === lang.c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                {lang.l}
              </button>
            ))}
          </div>
        </div>

        <GlassCard className="p-6">
          <div className="flex rounded-full bg-muted p-1 mb-6">
            <button onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px] ${isLogin ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              {t('auth.login')}
            </button>
            <button onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px] ${!isLogin ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              {t('auth.signup')}
            </button>
          </div>

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3 rounded-xl border border-border bg-background text-foreground font-medium min-h-[48px] flex items-center justify-center gap-3 hover:bg-muted transition-colors disabled:opacity-50 mb-4"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? '...' : `${t('auth.login')} with Google`}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">{t('common.or', 'or')}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder={t('auth.your_name')}
                className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border border-border min-h-[48px]" required />
            )}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.email')}
              className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border border-border min-h-[48px]" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.password')}
              className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border border-border min-h-[48px]" required minLength={6} />
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold min-h-[48px] disabled:opacity-50">
              {loading ? '...' : isLogin ? t('auth.login_btn') : t('auth.signup_btn')}
            </button>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default Auth;
