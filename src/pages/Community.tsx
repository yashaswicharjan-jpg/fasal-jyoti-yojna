import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import TopBar from '@/components/TopBar';
import GlassCard from '@/components/GlassCard';

interface Post {
  id: string;
  author: string;
  village: string;
  avatar: string;
  content: string;
  category: 'question' | 'success_story';
  upvotes: number;
  comments: number;
  time: string;
  upvoted: boolean;
}

const mockPosts: Post[] = [
  {
    id: '1',
    author: 'राम कुमार',
    village: 'बारामती, महाराष्ट्र',
    avatar: '👨‍🌾',
    content: 'मेरे टमाटर के पत्तों पर पीले धब्बे आ रहे हैं। कोई बता सकता है ये कौनसा रोग है? 🍅',
    category: 'question',
    upvotes: 12,
    comments: 5,
    time: '2 घंटे पहले',
    upvoted: false,
  },
  {
    id: '2',
    author: 'प्रिया शर्मा',
    village: 'इंदौर, मध्य प्रदेश',
    avatar: '👩‍🌾',
    content: 'इस साल सोयाबीन की फसल बहुत अच्छी हुई! जैविक खेती से 20% ज्यादा उपज मिली। धन्यवाद Krishi Sahayak! 🎉',
    category: 'success_story',
    upvotes: 45,
    comments: 12,
    time: '5 घंटे पहले',
    upvoted: false,
  },
  {
    id: '3',
    author: 'विजय पाटिल',
    village: 'नासिक, महाराष्ट्र',
    avatar: '👨‍🌾',
    content: 'ड्रिप सिंचाई लगाने से पानी की 40% बचत हुई। PM कृषि सिंचाई योजना से सब्सिडी भी मिली। 💧',
    category: 'success_story',
    upvotes: 32,
    comments: 8,
    time: '1 दिन पहले',
    upvoted: false,
  },
];

const Community = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [filter, setFilter] = useState<string>('all');
  const [showCompose, setShowCompose] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [newCategory, setNewCategory] = useState<'question' | 'success_story'>('question');

  const filteredPosts = filter === 'all'
    ? posts
    : posts.filter((p) => p.category === filter);

  const handleUpvote = (id: string) => {
    setPosts(posts.map((p) =>
      p.id === id
        ? { ...p, upvotes: p.upvoted ? p.upvotes - 1 : p.upvotes + 1, upvoted: !p.upvoted }
        : p
    ));
  };

  const handlePost = () => {
    if (!newPost.trim()) return;
    const post: Post = {
      id: Date.now().toString(),
      author: 'आप',
      village: 'मेरा गाँव',
      avatar: '🧑‍🌾',
      content: newPost,
      category: newCategory,
      upvotes: 0,
      comments: 0,
      time: 'अभी',
      upvoted: false,
    };
    setPosts([post, ...posts]);
    setNewPost('');
    setShowCompose(false);
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
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap min-h-[40px] transition-all ${
                filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Posts */}
        {filteredPosts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{post.avatar}</span>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{post.author}</p>
                  <p className="text-xs text-muted-foreground">{post.village} · {post.time}</p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                    post.category === 'question'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-accent/10 text-accent'
                  }`}
                >
                  {post.category === 'question' ? t('community.question') : t('community.success_story')}
                </span>
              </div>

              <p className="text-sm text-foreground leading-relaxed">{post.content}</p>

              <div className="flex items-center gap-4 pt-1 border-t border-border/50">
                <button
                  onClick={() => handleUpvote(post.id)}
                  className={`flex items-center gap-1.5 py-2 px-3 rounded-lg min-h-[44px] transition-all ${
                    post.upvoted ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                  }`}
                >
                  <ThumbsUp size={16} />
                  <span className="text-sm">{post.upvotes}</span>
                </button>
                <button className="flex items-center gap-1.5 py-2 px-3 rounded-lg min-h-[44px] text-muted-foreground">
                  <MessageCircle size={16} />
                  <span className="text-sm">{post.comments}</span>
                </button>
                <button className="flex items-center gap-1.5 py-2 px-3 rounded-lg min-h-[44px] text-muted-foreground ml-auto">
                  <Share2 size={16} />
                </button>
              </div>
            </GlassCard>
          </motion.div>
        ))}

        {/* Compose FAB */}
        <button
          onClick={() => setShowCompose(true)}
          className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        >
          <Plus size={24} />
        </button>

        {/* Compose Modal */}
        {showCompose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-foreground/50 flex items-end"
            onClick={() => setShowCompose(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full bg-card rounded-t-3xl p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-border rounded-full mx-auto" />
              <h3 className="text-lg font-bold text-foreground">{t('community.create_post')}</h3>

              <div className="flex gap-2">
                {(['question', 'success_story'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium min-h-[40px] ${
                      newCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {cat === 'question' ? `❓ ${t('community.question')}` : `🏆 ${t('community.success_story')}`}
                  </button>
                ))}
              </div>

              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder={t('community.write_post')}
                className="w-full h-32 px-4 py-3 rounded-xl bg-muted text-foreground border border-border resize-none text-sm"
              />

              <button
                onClick={handlePost}
                disabled={!newPost.trim()}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold min-h-[48px] disabled:opacity-40"
              >
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
