import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ThumbsUp, MessageCircle, Share2, Camera, Image, X, Send } from 'lucide-react';
import TopBar from '@/components/TopBar';
import GlassCard from '@/components/GlassCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { compressImage } from '@/utils/imageCompression';

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

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  profiles?: { full_name: string } | null;
}

// Sample success stories for display
const SAMPLE_STORIES = [
  {
    id: 'sample-1', user_id: '', content: '🌾 मेरे खेत में ड्रिप सिंचाई लगवाई — पानी 40% बचा और टमाटर की पैदावार 15 क्विंटल/एकड़ हुई! सरकारी सब्सिडी से 55% खर्चा बचा।\n\nDrip irrigation saved 40% water & increased tomato yield to 15 quintals/acre!',
    category: 'success_story', upvotes_count: 47, created_at: '2026-03-28T10:00:00Z', media_url: null,
    profiles: { full_name: 'रामदास पाटील', state: 'Maharashtra' }, upvoted: false,
  },
  {
    id: 'sample-2', user_id: '', content: '🏆 जैविक खेती से 3 साल में मिट्टी की गुणवत्ता बहुत सुधरी। गोबर की खाद + जीवामृत = रासायनिक खाद से बेहतर नतीजे!\n\nOrganic farming transformed my soil quality in 3 years. Vermicompost + Jeevamrut beat chemical fertilizers!',
    category: 'success_story', upvotes_count: 83, created_at: '2026-03-25T08:30:00Z', media_url: null,
    profiles: { full_name: 'सुनीता देवी', state: 'Madhya Pradesh' }, upvoted: false,
  },
  {
    id: 'sample-3', user_id: '', content: '💰 PM-KISAN योजना से हर 4 महीने में ₹2,000 मिलते हैं। e-NAM पर प्याज बेचकर बाजार से 15% ज़्यादा दाम मिला!\n\nGot ₹6,000/year from PM-KISAN + 15% higher onion prices via e-NAM!',
    category: 'success_story', upvotes_count: 62, created_at: '2026-03-22T14:00:00Z', media_url: null,
    profiles: { full_name: 'विकास शर्मा', state: 'Rajasthan' }, upvoted: false,
  },
  {
    id: 'sample-4', user_id: '', content: '🌱 Krishi Sahayak AI ने मेरी फसल में झुलसा रोग पकड़ लिया — समय पर इलाज किया और 2 एकड़ गेहूं बच गया!\n\nAI disease detection caught blight early — saved 2 acres of wheat crop!',
    category: 'success_story', upvotes_count: 95, created_at: '2026-03-20T09:15:00Z', media_url: null,
    profiles: { full_name: 'अनिल कुमार', state: 'Uttar Pradesh' }, upvoted: false,
  },
];

const Community = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState('all');
  const [showCompose, setShowCompose] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [newCategory, setNewCategory] = useState<'question' | 'success_story'>('question');
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [showComments, setShowComments] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const imageRef = useRef<HTMLInputElement>(null);

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
    const dbPosts = (data || []).map((p: any) => ({ ...p, upvoted: false }));
    // Merge with sample stories
    setPosts([...dbPosts, ...SAMPLE_STORIES]);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
    const channel = supabase
      .channel('community_posts_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => fetchPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredPosts = filter === 'all' ? posts : posts.filter((p) => p.category === filter);

  const handleUpvote = async (postId: string) => {
    if (postId.startsWith('sample-')) {
      setPosts(posts.map(p => p.id === postId ? { ...p, upvotes_count: p.upvoted ? p.upvotes_count - 1 : p.upvotes_count + 1, upvoted: !p.upvoted } : p));
      return;
    }
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const newCount = post.upvoted ? (post.upvotes_count || 0) - 1 : (post.upvotes_count || 0) + 1;
    setPosts(posts.map((p) => p.id === postId ? { ...p, upvotes_count: newCount, upvoted: !p.upvoted } : p));
    await supabase.from('community_posts').update({ upvotes_count: newCount }).eq('id', postId);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setImagePreview(compressed.dataUrl);
      // Convert dataUrl back to file for upload
      const resp = await fetch(compressed.dataUrl);
      const blob = await resp.blob();
      setImageFile(new File([blob], file.name, { type: 'image/jpeg' }));
    } catch {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    setUploadingImage(true);

    let mediaUrl: string | null = null;

    // Upload image if selected
    if (imageFile) {
      const fileName = `${user.id}/${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('farm-images')
        .upload(fileName, imageFile, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error(t('community.upload_failed'));
        setUploadingImage(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('farm-images').getPublicUrl(fileName);
      mediaUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('community_posts').insert({
      user_id: user.id,
      content: newPost,
      category: newCategory,
      media_url: mediaUrl,
    });

    if (error) {
      toast.error(t('auth.post_failed'));
      console.error(error);
    } else {
      setNewPost('');
      setShowCompose(false);
      setImagePreview(null);
      setImageFile(null);
      toast.success(t('auth.post_success'));
    }
    setUploadingImage(false);
  };

  const fetchComments = async (postId: string) => {
    if (postId.startsWith('sample-')) return;
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(full_name)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    setComments(prev => ({ ...prev, [postId]: data || [] }));
  };

  const handleComment = async (postId: string) => {
    if (!commentInput.trim() || !user || postId.startsWith('sample-')) return;
    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: user.id,
      comment_text: commentInput,
    });
    if (!error) {
      setCommentInput('');
      fetchComments(postId);
    }
  };

  const toggleComments = (postId: string) => {
    if (showComments === postId) {
      setShowComments(null);
    } else {
      setShowComments(postId);
      if (!comments[postId]) fetchComments(postId);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
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
            <p className="text-muted-foreground text-sm">{t('community.no_posts')}</p>
          </GlassCard>
        ) : (
          filteredPosts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <GlassCard className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg">👨‍🌾</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{post.profiles?.full_name || t('community.farmer')}</p>
                    <p className="text-xs text-muted-foreground">{post.profiles?.state || ''} · {timeAgo(post.created_at)}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${post.category === 'question' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                    {post.category === 'question' ? t('community.question') : t('community.success_story')}
                  </span>
                </div>

                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{post.content}</p>

                {post.media_url && (
                  <div className="rounded-xl overflow-hidden">
                    <img src={post.media_url} alt="Post" className="w-full max-h-[300px] object-cover" loading="lazy" />
                  </div>
                )}

                <div className="flex items-center gap-4 pt-1 border-t border-border/50">
                  <button onClick={() => handleUpvote(post.id)}
                    className={`flex items-center gap-1.5 py-2 px-3 rounded-lg min-h-[44px] transition-all ${post.upvoted ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
                    <ThumbsUp size={16} /><span className="text-sm">{post.upvotes_count || 0}</span>
                  </button>
                  <button onClick={() => toggleComments(post.id)}
                    className={`flex items-center gap-1.5 py-2 px-3 rounded-lg min-h-[44px] ${showComments === post.id ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
                    <MessageCircle size={16} /><span className="text-sm">{comments[post.id]?.length || 0}</span>
                  </button>
                  <button className="flex items-center gap-1.5 py-2 px-3 rounded-lg min-h-[44px] text-muted-foreground ml-auto">
                    <Share2 size={16} />
                  </button>
                </div>

                {/* Comments section */}
                <AnimatePresence>
                  {showComments === post.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border/50 pt-3 space-y-2">
                      {(comments[post.id] || []).map((c) => (
                        <div key={c.id} className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <span className="text-xs">👤</span>
                          </div>
                          <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2">
                            <p className="text-xs font-semibold text-foreground">{c.profiles?.full_name || t('community.farmer')}</p>
                            <p className="text-xs text-foreground mt-0.5">{c.comment_text}</p>
                          </div>
                        </div>
                      ))}
                      {!post.id.startsWith('sample-') && (
                        <div className="flex items-center gap-2">
                          <input
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                            placeholder={t('community.add_comment')}
                            className="flex-1 px-3 py-2 rounded-full bg-muted text-foreground text-xs border border-border min-h-[36px]"
                          />
                          <button onClick={() => handleComment(post.id)} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Send size={14} />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          ))
        )}

        {/* FAB for creating post */}
        <button onClick={() => setShowCompose(true)}
          className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-105 transition-transform">
          <Plus size={24} />
        </button>

        {/* Compose sheet */}
        <AnimatePresence>
          {showCompose && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-foreground/50 flex items-end" onClick={() => setShowCompose(false)}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="w-full bg-card rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="w-10 h-1 bg-border rounded-full mx-auto" />
                <h3 className="text-lg font-bold text-foreground">{t('community.create_post')}</h3>

                {/* Category picker */}
                <div className="flex gap-2">
                  {(['question', 'success_story'] as const).map((cat) => (
                    <button key={cat} onClick={() => setNewCategory(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-medium min-h-[40px] ${newCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {cat === 'question' ? `❓ ${t('community.question')}` : `🏆 ${t('community.success_story')}`}
                    </button>
                  ))}
                </div>

                {/* Text area */}
                <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder={t('community.write_post')}
                  className="w-full h-32 px-4 py-3 rounded-xl bg-muted text-foreground border border-border resize-none text-sm" />

                {/* Image preview */}
                {imagePreview && (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-[200px] object-cover rounded-xl" />
                    <button onClick={() => { setImagePreview(null); setImageFile(null); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-foreground/70 text-background flex items-center justify-center">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Image upload buttons */}
                <div className="flex gap-2">
                  <button onClick={() => { imageRef.current?.setAttribute('capture', 'environment'); imageRef.current?.click(); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium min-h-[44px]">
                    <Camera size={16} /> {t('community.photo')}
                  </button>
                  <button onClick={() => { imageRef.current?.removeAttribute('capture'); imageRef.current?.click(); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium min-h-[44px]">
                    <Image size={16} /> {t('community.gallery')}
                  </button>
                </div>
                <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

                {/* Post button */}
                <button onClick={handlePost} disabled={!newPost.trim() || uploadingImage}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold min-h-[48px] disabled:opacity-40">
                  {uploadingImage ? t('common.loading') : t('community.post')}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Community;
