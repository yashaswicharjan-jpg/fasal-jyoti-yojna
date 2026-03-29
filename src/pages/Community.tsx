import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import TopBar from '@/components/TopBar';
import GlassCard from '@/components/GlassCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Post {
  id: string;
  user_id: string;
  content: string;
  category: string | null;
  upvotes_count: number;
  created_at: string;
  media_url: string | null;
  profiles?: { full_name: string; state: string | null } | null;
  upvoted?: boolean;
}

const Community = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState('all');
  const [showCompose, setShowCompose] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [newCategory, setNewCategory] = useState<'question' | 'success_story'>('question');
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*, profiles(full_name, state)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Fetch posts error:', error);
      return;
    }
    setPosts((data || []).map((p: any) => ({ ...p, upvoted: false })));
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('community_posts_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredPosts = filter === 'all' ? posts : posts.filter((p) => p.category === filter);

  const handleUpvote = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const newCount = post.upvoted ? (post.upvotes_count || 0) - 1 : (post.upvotes_count || 0) + 1;

    setPosts(posts.map((p) =>
      p.id === postId ? { ...p, upvotes_count: newCount, upvoted: !p.upvoted } : p
    ));

    await supabase.from('community_posts').update({ upvotes_count: newCount }).eq('id', postId);
  };

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;

    const { error } = await supabase.from('community_posts').insert({
      user_id: user.id,
      content: newPost,
      category: newCategory,
    });

    if (error) {
      toast.error('पोस्ट नहीं हो सकी');
      console.error(error);
      return;
    }

    setNewPost('');
    setShowCompose(false);
    toast.success('पोस्ट सफल!');
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const filters = [
    { key: 'all', label: t('community.all') },
    { key: 'question', label: `❓ ${t('community.question')}` },
    { key: 'success_story', label: `🏆 ${t('community.success_story')}` },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={t('community.title')} />
      <main className="px-4 py-4 max-w-lg mx-auto space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap min-h-[40px] transition-all ${filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <GlassCard className="flex items-center justify-center py-8">
            <span className="text-2xl animate-pulse">🌾</span>
          </GlassCard>
        ) : filteredPosts.length === 0 ? (
          <GlassCard className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground text-sm">कोई पोस्ट नहीं मिली। पहले पोस्ट करें!</p>
          </GlassCard>
        ) : (
          filteredPosts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👨‍🌾</span>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{post.profiles?.full_name || 'किसान'}</p>
                    <p className="text-xs text-muted-foreground">{post.profiles?.state || ''} · {timeAgo(post.created_at)}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${post.category === 'question' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                    {post.category === 'question' ? t('community.question') : t('community.success_story')}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{post.content}</p>
                <div className="flex items-center gap-4 pt-1 border-t border-border/50">
                  <button onClick={() => handleUpvote(post.id)}
                    className={`flex items-center gap-1.5 py-2 px-3 rounded-lg min-h-[44px] transition-all ${post.upvoted ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
                    <ThumbsUp size={16} /><span className="text-sm">{post.upvotes_count || 0}</span>
                  </button>
                  <button className="flex items-center gap-1.5 py-2 px-3 rounded-lg min-h-[44px] text-muted-foreground">
                    <MessageCircle size={16} /><span className="text-sm">0</span>
                  </button>
                  <button className="flex items-center gap-1.5 py-2 px-3 rounded-lg min-h-[44px] text-muted-foreground ml-auto">
                    <Share2 size={16} />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}

        <button onClick={() => setShowCompose(true)}
          className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-105 transition-transform">
          <Plus size={24} />
        </button>

        {showCompose && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-foreground/50 flex items-end" onClick={() => setShowCompose(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 25 }}
              className="w-full bg-card rounded-t-3xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 bg-border rounded-full mx-auto" />
              <h3 className="text-lg font-bold text-foreground">{t('community.create_post')}</h3>
              <div className="flex gap-2">
                {(['question', 'success_story'] as const).map((cat) => (
                  <button key={cat} onClick={() => setNewCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium min-h-[40px] ${newCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {cat === 'question' ? `❓ ${t('community.question')}` : `🏆 ${t('community.success_story')}`}
                  </button>
                ))}
              </div>
              <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder={t('community.write_post')}
                className="w-full h-32 px-4 py-3 rounded-xl bg-muted text-foreground border border-border resize-none text-sm" />
              <button onClick={handlePost} disabled={!newPost.trim()}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold min-h-[48px] disabled:opacity-40">
                {t('community.post')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Community;
