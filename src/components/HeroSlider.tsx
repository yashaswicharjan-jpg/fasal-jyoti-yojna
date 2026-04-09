import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  {
    gradient: 'from-[hsl(37,60%,22%)] via-[hsl(42,73%,31%)] to-[hsl(37,90%,55%)]',
    emoji: '🌾',
    title: 'Golden Harvest',
  },
  {
    gradient: 'from-[hsl(115,37%,18%)] via-[hsl(140,35%,22%)] to-[hsl(115,37%,35%)]',
    emoji: '🌿',
    title: 'Green Fields',
  },
  {
    gradient: 'from-[hsl(20,40%,20%)] via-[hsl(42,50%,25%)] to-[hsl(30,60%,30%)]',
    emoji: '🌱',
    title: 'Rich Soil',
  },
];

const HeroSlider = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-40 rounded-2xl overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className={`absolute inset-0 bg-gradient-to-br ${slides[current].gradient}`}
        >
          <div className="absolute inset-0 backdrop-blur-sm bg-black/10" />
          <div className="relative flex items-center justify-center h-full">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="text-6xl"
            >
              {slides[current].emoji}
            </motion.span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === current ? 'bg-white w-6' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
