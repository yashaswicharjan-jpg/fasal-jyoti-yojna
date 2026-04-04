import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import GlassCard from '@/components/GlassCard';
import PostActions from './PostActions';
import { useTranslation } from 'react-i18next';

const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  success_story: { label: 'सफलता की कहानी', emoji: '🏆' },
  question: { label: 'सवाल', emoji: '❓' },
  tip: { label: 'टिप', emoji: '💡' },
  market_info: { label: 'बाज़ार', emoji: '💹' },
  weather_alert: { label: 'मौसम', emoji: '🌧️' },
};

const MyPostsTab = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchMyPosts();
  }, [user?.id]);

  const fetchMyPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('community_posts')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setPosts(data ?? []);
    setLoading(false);
  };

  const deletePost = async (postId: string) => {
    if (!window.confirm('यह पोस्ट हटाएं? / Delete this post?')) return;
    setDeleting(postId);
    await supabase.from('community_posts').delete().eq('id', postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    setDeleting(null);
  };

  if (loading) {
    return (
      <GlassCard className="flex flex-col items-center justify-center py-8">
        <span className="text-3xl animate-pulse">🌱</span>
        <p className="text-sm text-muted-foreground mt-2">{t('common.loading')}</p>
      </GlassCard>
    );
  }

  if (posts.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center py-8">
        <span className="text-4xl mb-2">✍️</span>
        <p className="text-sm text-muted-foreground text-center">
          अभी कोई पोस्ट नहीं। Community में "+" बटन से पोस्ट करें।
        </p>
      </GlassCard>
    );
  }

  const totalLikes = posts.reduce((s, p) => s + (p.upvotes_count ?? 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.comments_count ?? 0), 0);

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'पोस्ट', value: posts.length, icon: '📝', color: 'bg-primary/10 text-primary' },
          { label: 'पसंद', value: totalLikes, icon: '❤️', color: 'bg-destructive/10 text-destructive' },
          { label: 'टिप्पणियाँ', value: totalComments, icon: '💬', color: 'bg-accent/10 text-accent' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-xl p-3 text-center ${stat.color}`}>
            <div className="text-lg">{stat.icon}</div>
            <div className="text-xl font-bold">{stat.value}</div>
            <div className="text-[11px]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Posts */}
      {posts.map(post => {
        const meta = CATEGORY_META[post.category] ?? { label: post.category, emoji: '🌾' };
        return (
          <motion.div key={post.id} layout>
            <GlassCard className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                  {meta.emoji} {meta.label}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString('hi-IN')}
                </span>
              </div>

              {(post.image_url || post.media_url) && (
                <img
                  src={post.image_url || post.media_url}
                  alt="Post"
                  className="w-full max-h-[200px] object-cover rounded-xl"
                  loading="lazy"
                />
              )}

              {post.location_tag && (
                <p className="text-xs text-muted-foreground">📍 {post.location_tag}</p>
              )}

              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line line-clamp-4">
                {post.content}
              </p>

              <PostActions
                postId={post.id}
                initialLikes={post.upvotes_count ?? 0}
                initialComments={post.comments_count ?? 0}
              />

              <div className="flex justify-end">
                <button
                  onClick={() => deletePost(post.id)}
                  disabled={deleting === post.id}
                  className="flex items-center gap-1 text-xs text-destructive/70 hover:text-destructive py-1 px-2"
                >
                  <Trash2 size={12} />
                  {deleting === post.id ? 'हटाया जा रहा है...' : 'हटाएं'}
                </button>
              </div>
            </GlassCard>
          </motion.div>
        );
      })}
    </div>
  );
};

export default MyPostsTab;
