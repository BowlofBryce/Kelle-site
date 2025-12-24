import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Skull, Home, Store, Info } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

export function NavBar() {
  const { itemCount } = useCart();

  return (
    <motion.nav
      className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-pink-500/30 shadow-[0_4px_20px_rgba(255,0,150,0.3)]"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <Skull className="w-8 h-8 text-pink-500" />
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              The Velvet Hollow
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <NavLink to="/" icon={<Home className="w-5 h-5" />} label="Home" />
            <NavLink to="/shop" icon={<Store className="w-5 h-5" />} label="Shop" />
            <NavLink to="/about" icon={<Info className="w-5 h-5" />} label="About" />

            <Link to="/cart" className="relative">
              <motion.div
                className="p-2 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 hover:from-pink-500/40 hover:to-purple-500/40 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShoppingCart className="w-5 h-5 text-pink-400" />
                {itemCount > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    {itemCount}
                  </motion.span>
                )}
              </motion.div>
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to}>
      <motion.div
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-pink-400 hover:bg-pink-500/10 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {icon}
        <span className="text-sm font-medium hidden md:inline">{label}</span>
      </motion.div>
    </Link>
  );
}
