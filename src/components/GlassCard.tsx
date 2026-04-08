import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

const GlassCard = ({ children, className = '', onClick }: GlassCardProps) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={onClick ? { y: -3, scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`glass-card-solid p-4 transition-shadow ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
