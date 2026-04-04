import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, Image, X } from 'lucide-react';
import TopBar from '@/components/TopBar';
import GlassCard from '@/components/GlassCard';
import PostActions from '@/components/Community/PostActions';
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
  comments_count: number;
  created_at: string;
  media_url: string | null;
  image_url: string | null;
  location_tag: string | null;
  profiles?: { full_name: string; state: string | null; location_village: string | null; avatar_url: string | null } | null;
}

const SAMPLE_STORIES: Post[] = [
  {
    id: 'sample-1', user_id: '', content: '🌾 मेरे खेत में ड्रिप सिंचाई लगवाई — पानी 40% बचा और टमाटर की पैदावार 15 क्विंटल/एकड़ हुई! सरकारी सब्सिडी से 55% खर्चा बचा।\n\nDrip irrigation saved 40% water & increased tomato yield to 15 quintals/acre!',
    category: 'success_story', upvotes_count: 47, comments_count: 5, created_at: '2026-03-28T10:00:00Z', media_url: null, image_url: null, location_tag: 'पुणे, महाराष्ट्र',
    profiles: { full_name: 'रामदास पाटील', state: 'Maharashtra', location_village: 'पुणे', avatar_url: null },
  },
  {
    id: 'sample-2', user_id: '', content: '🏆 जैविक खेती से 3 साल में मिट्टी की गुणवत्ता बहुत सुधरी। गोबर की खाद + जीवामृत = रासायनिक खाद से बेहतर नतीजे!\n\nOrganic farming transformed my soil quality in 3 years.',
    category: 'success_story', upvotes_count: 83, comments_count: 12, created_at: '2026-03-25T08:30:00Z', media_url: null, image_url: null, location_tag: 'भोपाल',
    profiles: { full_name: 'सुनीता देवी', state: 'Madhya Pradesh', location_village: 'भोपाल', avatar_url: null },
  },
  {
    id: 'sample-3', user_id: '', content: '💰 PM-KISAN योजना से हर 4 महीने में ₹2,000 मिलते हैं। e-NAM पर प्याज बेचकर बाजार से 15% ज़्यादा दाम मिला!\n\nGot ₹6,000/year from PM-KISAN + 15% higher onion prices via e-NAM!',
    category: 'success_story', upvotes_count: 62, comments_count: 8, created_at: '2026-03-22T14:00:00Z', media_url: null, image_url: null, location_tag: 'जयपुर',
    profiles: { full_name: 'विकास शर्मा', state: 'Rajasthan', location_village: 'जयपुर', avatar_url: null },
  },
  {
    id: 'sample-4', user_id: '', content: '🌱 Krishi Sahayak AI ने मेरी फसल में झुलसा रोग पकड़ लिया — समय पर इलाज किया और 2 एकड़ गेहूं बच गया!\n\nAI disease detection caught blight early — saved 2 acres of wheat crop!',
    category: 'success_story', upvotes_count: 95, comments_count: 15, created_at: '2026-03-20T09:15:00Z', media_url: null, image_url: null, location_tag: 'लखनऊ',
    profiles: { full_name: 'अनिल कुमार', state: 'Uttar Pradesh', location_village: 'लखनऊ', avatar_url: null },
  },
];

const CATEGORIES = [
  { id: 'success_story', label: '🏆 सफलता की कहानी' },
  { id: 'question', label: '❓ सवाल' },
  { id: 'tip', label: '💡 खेती टिप' },
  { id: 'market_info', label: '💹 बाज़ार' },
  { id: 'weather_alert', label: '🌧️ मौसम' },
];

const Community = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState('all');
  const [showCompose, setShowCompose] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [newCategory, setNewCategory] = useState('success_story');
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [locationTag, setLocationTag] = useState('');
  const imageRef = useRef<HTMLInputElement>(null);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*, profiles(full_name, state, location_village, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Fetch posts error:', error);
      return;
    }
    const dbPosts = (data || []) as unknown as Post[];
    setPosts([...dbPosts, ...SAMPLE_STORIES]);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
    const channel = supabase
      .channel('community_feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_posts',
      }, async (payload) => {
        const { data } = await supabase
          .from('community_posts')
          .select('*, profiles(full_name, state, location_village, avatar_url)')
          .eq('id', payload.new.id)
          .single();
        if (data) setPosts(prev => [data as unknown as Post, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredPosts = filter === 'all' ? posts : posts.filter(p => p.category === filter);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setImagePreview(compressed.dataUrl);
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

    if (imageFile) {
      const fileName = `community/${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('farm-images')
        .upload(fileName, imageFile, { upsert: true });

      if (uploadError) {
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
      image_url: mediaUrl,
      location_tag: locationTag.trim() || null,
    });

    if (error) {
      toast.error(t('auth.post_failed'));
    } else {
      setNewPost('');
      setNewCategory('success_story');
      setShowCompose(false);
      setImagePreview(null);
      setImageFile(null);
      setLocationTag('');
      toast.success(t('auth.post_success'));
    }
    setUploadingImage(false);
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
    { key: 'tip', label: '💡 टिप' },
    { key: 'market_info', label: '💹 बाज़ार' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={t('community.title')} />
      <main className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap min-h-[40px] transition-all ${
                filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Feed */}
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
                {/* Author header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {(post.profiles?.full_name ?? 'K')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{post.profiles?.full_name || t('community.farmer')}</p>
                    <p className="text-xs text-muted-foreground">
                      {post.profiles?.location_village && `📍 ${post.profiles.location_village}`}
                      {post.profiles?.state && `, ${post.profiles.state}`}
                      {' · '}{timeAgo(post.created_at)}
                    </p>
                  </div>
                  {post.category && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                      {CATEGORIES.find(c => c.id === post.category)?.label?.split(' ')[0] ?? '🌾'} {post.category === 'question' ? t('community.question') : post.category === 'success_story' ? t('community.success_story') : post.category}
                    </span>
                  )}
                </div>

                {/* Location tag */}
                {post.location_tag && (
                  <p className="text-xs text-muted-foreground">📍 {post.location_tag}</p>
                )}

                {/* Content */}
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{post.content}</p>

                {/* Image */}
                {(post.image_url || post.media_url) && (
                  <div className="rounded-xl overflow-hidden">
                    <img src={post.image_url || post.media_url || ''} alt="Post" className="w-full max-h-[300px] object-cover" loading="lazy" />
                  </div>
                )}

                {/* Actions */}
                <PostActions
                  postId={post.id}
                  initialLikes={post.upvotes_count ?? 0}
                  initialComments={post.comments_count ?? 0}
                  isSample={post.id.startsWith('sample-')}
                />
              </GlassCard>
            </motion.div>
          ))
        )}
      </main>

      {/* FAB - outside main for proper fixed positioning */}
      <motion.button
        onClick={() => setShowCompose(true)}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-20 right-4 z-[100] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center"
      >
        <Plus size={24} />
      </motion.button>

      {/* Compose sheet */}
      <AnimatePresence>
        {showCompose && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-foreground/50 flex items-end" onClick={() => setShowCompose(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full bg-card rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-border rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">📝 {t('community.create_post')}</h3>
                <button onClick={() => setShowCompose(false)} className="text-muted-foreground text-xl">✕</button>
              </div>

              {/* Category */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setNewCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap min-h-[40px] ${
                      newCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Text */}
              <textarea value={newPost} onChange={e => setNewPost(e.target.value)}
                placeholder="अपना अनुभव यहाँ लिखें... / Share your farming experience..."
                className="w-full h-32 px-4 py-3 rounded-xl bg-muted text-foreground border border-border resize-none text-sm"
                maxLength={1000} />
              <p className="text-right text-xs text-muted-foreground">{newPost.length}/1000</p>

              {/* Image */}
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full max-h-[200px] object-cover rounded-xl" />
                  <button onClick={() => { setImagePreview(null); setImageFile(null); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-foreground/70 text-background flex items-center justify-center">
                    <X size={14} />
                  </button>
                </div>
              ) : (
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
              )}
              <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

              {/* Location */}
              <input
                type="text"
                value={locationTag}
                onChange={e => setLocationTag(e.target.value)}
                placeholder="📍 गाँव/शहर / Village or City (optional)"
                className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border border-border text-sm"
              />

              {/* Submit */}
              <button onClick={handlePost} disabled={!newPost.trim() || uploadingImage}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold min-h-[48px] disabled:opacity-40">
                {uploadingImage ? t('common.loading') : '🌾 पोस्ट करें / Share Post'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Community;
