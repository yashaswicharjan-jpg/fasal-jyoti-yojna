import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PostActionsProps {
  postId: string;
  initialLikes: number;
  initialComments: number;
  isSample?: boolean;
}

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
  profiles?: { full_name: string; location_village: string | null } | null;
}

const PostActions = ({ postId, initialLikes, initialComments, isSample }: PostActionsProps) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(initialComments);
  const [commentText, setCommentText] = useState('');
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!user?.id || isSample) return;
    supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [postId, user?.id, isSample]);

  const handleLike = async () => {
    if (!user?.id || likeLoading) return;
    if (isSample) {
      setLiked(!liked);
      setLikeCount(c => liked ? Math.max(0, c - 1) : c + 1);
      return;
    }
    setLikeLoading(true);
    const optimistic = !liked;
    setLiked(optimistic);
    setLikeCount(c => optimistic ? c + 1 : Math.max(0, c - 1));
    try {
      const { data, error } = await supabase.rpc('toggle_post_like', {
        p_post_id: postId,
        p_user_id: user.id,
      });
      if (error) throw error;
      setLiked(data.liked);
      setLikeCount(data.count);
    } catch {
      setLiked(!optimistic);
      setLikeCount(c => optimistic ? Math.max(0, c - 1) : c + 1);
    } finally {
      setLikeLoading(false);
    }
  };

  const loadComments = async () => {
    if (isSample) { setShowComments(v => !v); return; }
    if (commentsLoaded) { setShowComments(v => !v); return; }
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(full_name, location_village)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    setComments(data ?? []);
    setCommentCount(data?.length ?? 0);
    setCommentsLoaded(true);
    setShowComments(true);
  };

  const submitComment = async () => {
    if (!commentText.trim() || !user?.id || posting || isSample) return;
    setPosting(true);
    try {
      await supabase.rpc('add_comment', {
        p_post_id: postId,
        p_user_id: user.id,
        p_comment: commentText.trim(),
      });
      setCommentText('');
      // Refetch comments
      const { data } = await supabase
        .from('comments')
        .select('*, profiles(full_name, location_village)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      setComments(data ?? []);
      setCommentCount(data?.length ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Krishi Sahayak',
        text: 'किसान का अनुभव देखें',
        url: window.location.href,
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 pt-1 border-t border-border/50">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 py-2 px-3 rounded-lg min-h-[40px] transition-all flex-1 justify-center text-sm font-medium ${
            liked ? 'text-destructive bg-destructive/10' : 'text-muted-foreground'
          }`}
        >
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
          {likeCount > 0 && likeCount} पसंद
        </button>

        <button
          onClick={loadComments}
          className={`flex items-center gap-1.5 py-2 px-3 rounded-lg min-h-[40px] transition-all flex-1 justify-center text-sm font-medium ${
            showComments ? 'text-primary bg-primary/10' : 'text-muted-foreground'
          }`}
        >
          <MessageCircle size={16} />
          {commentCount > 0 && commentCount} टिप्पणी
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 py-2 px-3 rounded-lg min-h-[40px] text-muted-foreground flex-1 justify-center text-sm font-medium"
        >
          <Share2 size={16} /> शेयर
        </button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {comments.length === 0 && !isSample ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                अभी कोई टिप्पणी नहीं। पहले टिप्पणी करें!
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {comments.map(c => (
                  <div key={c.id} className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {(c.profiles?.full_name ?? 'K')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2">
                      <p className="text-xs font-semibold text-foreground">{c.profiles?.full_name ?? 'किसान'}</p>
                      <p className="text-xs text-foreground mt-0.5">{c.comment_text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {user?.id && !isSample && (
              <div className="flex items-center gap-2">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submitComment(); }}
                  placeholder="टिप्पणी लिखें..."
                  className="flex-1 px-3 py-2 rounded-full bg-muted text-foreground text-xs border border-border min-h-[36px]"
                />
                <button
                  onClick={submitComment}
                  disabled={!commentText.trim() || posting}
                  className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"
                >
                  <Send size={14} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PostActions;
