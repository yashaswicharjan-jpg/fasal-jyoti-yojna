import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

const GlassCard = ({ children, className = '', onClick }: GlassCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card-solid p-4 transition-all ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default GlassCard;
