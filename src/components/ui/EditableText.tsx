import { motion } from 'framer-motion';
import { scaleIn } from '../../lib/animations';

interface EditableTextProps {
  text: string;
  className?: string;
  animate?: boolean;
}

export function EditableText({ text, className = '', animate = true }: EditableTextProps) {
  if (animate) {
    return (
      <motion.div
        className={className}
        variants={scaleIn}
        initial="hidden"
        animate="visible"
      >
        {text}
      </motion.div>
    );
  }

  return <div className={className}>{text}</div>;
}
