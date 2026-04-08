import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MandiPrice {
  crop: string;
  price: number;
  change: number; // percentage
  unit: string;
}

const SAMPLE_PRICES: MandiPrice[] = [
  { crop: '🌾 Wheat', price: 2275, change: 2.1, unit: '₹/qt' },
  { crop: '🌽 Maize', price: 1962, change: -1.3, unit: '₹/qt' },
  { crop: '🫘 Soybean', price: 4200, change: 0.8, unit: '₹/qt' },
  { crop: '🧅 Onion', price: 1800, change: -3.5, unit: '₹/qt' },
  { crop: '🍅 Tomato', price: 2100, change: 5.2, unit: '₹/qt' },
  { crop: '🌶️ Chilli', price: 8500, change: 1.0, unit: '₹/qt' },
  { crop: '🥜 Groundnut', price: 5600, change: -0.5, unit: '₹/qt' },
  { crop: '🍚 Rice', price: 2183, change: 0.3, unit: '₹/qt' },
];

const MandiTicker = () => {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden rounded-2xl glass-card-solid">
      {/* Digital thread lines at top */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="text-xs font-semibold text-primary whitespace-nowrap flex items-center gap-1.5">
          📊 Mandi
        </span>
        <div className="h-4 w-px bg-border/50" />
      </div>
      <div className="overflow-hidden">
        <motion.div
          className="flex gap-1 px-3 pb-2"
          animate={{ x: [0, -1200] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          {[...SAMPLE_PRICES, ...SAMPLE_PRICES].map((item, i) => {
            const isUp = item.change > 0;
            const isDown = item.change < 0;
            return (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl whitespace-nowrap ${
                  isUp ? 'animate-price-up' : isDown ? 'animate-price-down' : ''
                }`}
              >
                <span className="text-xs text-foreground">{item.crop}</span>
                <span className="text-xs font-mono font-semibold text-foreground">
                  {item.price}
                </span>
                <span className={`text-[10px] font-mono font-semibold flex items-center gap-0.5 ${
                  isUp ? 'text-secondary' : isDown ? 'text-destructive' : 'text-muted-foreground'
                }`}>
                  {isUp ? <TrendingUp size={10} /> : isDown ? <TrendingDown size={10} /> : <Minus size={10} />}
                  {Math.abs(item.change)}%
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>
      {/* Thread line at bottom */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
    </div>
  );
};

export default MandiTicker;
