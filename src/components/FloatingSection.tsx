import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FloatingSectionProps {
  children: ReactNode;
  index?: number;
  className?: string;
  float?: 'slow' | 'medium' | 'fast' | 'none';
}

const springConfig = {
  type: 'spring' as const,
  stiffness: 100,
  damping: 15,
  mass: 0.8,
};

const FloatingSection = ({ children, index = 0, className = '', float = 'slow' }: FloatingSectionProps) => {
  const floatClass = float === 'none' ? '' :
    float === 'fast' ? 'animate-float-fast' :
    float === 'medium' ? 'animate-float-medium' :
    'animate-float-slow';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springConfig, delay: index * 0.1 }}
      className={`${floatClass} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default FloatingSection;
