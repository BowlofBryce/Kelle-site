import { motion } from 'framer-motion';
import { Heart, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-black/80 border-t-2 border-pink-500/30 mt-12 py-8 mb-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold text-pink-400 mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5" fill="currentColor" />
              About Us
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              The Velvet Hollow: where ink meets fabric. Born from late-night tattoo sessions
              and a love for 2000s internet culture.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-purple-400 mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="hover:text-pink-400 cursor-pointer transition-colors">Shop All</li>
              <li className="hover:text-pink-400 cursor-pointer transition-colors">
                Shipping Info
              </li>
              <li className="hover:text-pink-400 cursor-pointer transition-colors">
                Return Policy
              </li>
              <li className="hover:text-pink-400 cursor-pointer transition-colors">Contact</li>
              <li>
                <Link to="/velveth0ll0w-4dm1n/dashboard" className="hover:text-pink-400 transition-colors">
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-cyan-400 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Newsletter
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              Get notified about new drops and exclusive designs.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-3 py-2 bg-black/60 border border-pink-500/40 rounded text-sm text-gray-300 focus:outline-none focus:border-pink-500 transition-colors"
              />
              <motion.button
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-semibold rounded hover:from-pink-600 hover:to-purple-600 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Join
              </motion.button>
            </div>
          </div>
        </div>

        <motion.div
          className="mt-8 pt-6 border-t border-pink-500/20 text-center text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>
            &copy; {new Date().getFullYear()} The Velvet Hollow. Made with{' '}
            <Heart className="inline w-4 h-4 text-pink-500" fill="currentColor" /> and dark vibes.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
