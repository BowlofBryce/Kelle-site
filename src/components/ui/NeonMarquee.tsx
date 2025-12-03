import { motion } from 'framer-motion';

interface NeonMarqueeProps {
  text: string;
  speed?: number;
}

export function NeonMarquee({ text, speed = 50 }: NeonMarqueeProps) {
  const repeatedText = Array(20)
    .fill(text)
    .map((t, i) => (
      <span key={i} className="mx-8">
        {t}
      </span>
    ));

  return (
    <div className="overflow-hidden bg-black/60 border-y-2 border-pink-500/40 py-3">
      <motion.div
        className="whitespace-nowrap text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent inline-block"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {repeatedText}
        {repeatedText}
      </motion.div>
    </div>
  );
}
