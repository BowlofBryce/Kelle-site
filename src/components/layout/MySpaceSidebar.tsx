import { motion } from 'framer-motion';
import { Skull, Star, Heart } from 'lucide-react';
import { slideInLeft, breathingScale } from '../../lib/animations';

export function MySpaceSidebar() {
  return (
    <motion.aside
      className="hidden lg:block w-64 space-y-4"
      variants={slideInLeft}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="bg-gradient-to-br from-black/80 to-pink-900/20 border-2 border-pink-500/40 rounded-lg p-4 shadow-[0_0_30px_rgba(255,0,150,0.2)]"
        animate={breathingScale}
      >
        <div className="flex flex-col items-center text-center">
          <motion.div
            className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 p-1 mb-3"
            whileHover={{ rotate: 5, scale: 1.05 }}
          >
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <Skull className="w-12 h-12 text-pink-500" />
            </div>
          </motion.div>

          <h2 className="text-xl font-bold text-pink-400 mb-1">The Velvet Hollow</h2>
          <div className="flex items-center gap-2 mb-3">
            <motion.div
              className="w-2 h-2 rounded-full bg-green-400"
              animate={{
                scale: [1, 1.2, 1],
                boxShadow: [
                  '0 0 5px rgba(74, 222, 128, 0.5)',
                  '0 0 15px rgba(74, 222, 128, 0.8)',
                  '0 0 5px rgba(74, 222, 128, 0.5)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-xs text-green-400 font-semibold">Online Now</span>
          </div>

          <div className="w-full border-t border-pink-500/30 pt-3 mt-2">
            <p className="text-sm text-gray-300 italic leading-relaxed">
              "Your darkest dreams, wearable. Tattoo-inspired streetwear for rebels and artists."
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="bg-black/60 border-2 border-purple-500/40 rounded-lg p-4 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
          <Star className="w-5 h-5" fill="currentColor" />
          Top 8 Styles
        </h3>
        <ul className="space-y-2 text-sm">
          {[
            'Traditional Flash',
            'Neo-Traditional',
            'Blackwork',
            'Illustrative',
            'Dotwork',
            'Geometric',
            'Watercolor',
            'Surrealism',
          ].map((style, i) => (
            <motion.li
              key={style}
              className="flex items-center gap-2 text-gray-300 hover:text-pink-400 cursor-pointer transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              whileHover={{ x: 5 }}
            >
              <Heart className="w-3 h-3" fill="currentColor" />
              {style}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        className="bg-black/60 border-2 border-cyan-500/40 rounded-lg p-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-lg font-bold text-cyan-400 mb-3">Activity Feed</h3>
        <div className="space-y-3 text-xs text-gray-400">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="text-pink-400">Sarah</span> added 2 items to cart
            <div className="text-gray-500 mt-1">2 minutes ago</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <span className="text-pink-400">Mike</span> purchased "Skull Roses Tee"
            <div className="text-gray-500 mt-1">15 minutes ago</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            New drop coming <span className="text-cyan-400">Friday!</span>
            <div className="text-gray-500 mt-1">1 hour ago</div>
          </motion.div>
        </div>
      </motion.div>
    </motion.aside>
  );
}
