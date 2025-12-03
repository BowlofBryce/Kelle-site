import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface GlitterBorderCardProps {
  children: ReactNode;
  className?: string;
  rotation?: number;
}

export function GlitterBorderCard({
  children,
  className = '',
  rotation = 0,
}: GlitterBorderCardProps) {
  return (
    <motion.div
      className={`bg-black/80 border-2 border-pink-500/60 rounded-lg p-4 shadow-[0_0_30px_rgba(255,0,150,0.4)] ${className}`}
      style={{ rotate: rotation }}
      initial={{ opacity: 0, scale: 0.8, rotate: rotation - 10 }}
      animate={{ opacity: 1, scale: 1, rotate: rotation }}
      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      whileHover={{
        rotate: rotation + 2,
        scale: 1.02,
        boxShadow: '0 0 50px rgba(255,0,150,0.6)',
      }}
    >
      {children}
    </motion.div>
  );
}
