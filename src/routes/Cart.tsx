import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { fadeInUp } from '../lib/animations';

export function Cart() {
  const { items, removeItem, updateQuantity, totalCents } = useCart();

  if (items.length === 0) {
    return (
      <motion.div
        className="text-center py-24"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="inline-block p-6 bg-pink-500/10 border-2 border-pink-500/40 rounded-full mb-6"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <ShoppingBag className="w-16 h-16 text-pink-500" />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-300 mb-4">Your cart is empty</h2>
        <p className="text-gray-400 mb-8">
          Add some dark vibes to your wardrobe
        </p>
        <Link to="/shop">
          <AnimatedButton variant="primary">Browse Products</AnimatedButton>
        </Link>
      </motion.div>
    );
  }

  const shipping = totalCents >= 5000 ? 0 : 500;
  const tax = Math.round(totalCents * 0.08);
  const total = totalCents + shipping + tax;

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
        Shopping Cart
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {items.map(item => (
              <motion.div
                key={item.id}
                className="bg-black/60 border-2 border-pink-500/40 rounded-lg p-4 shadow-[0_0_20px_rgba(255,0,150,0.3)]"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                layout
              >
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden border border-pink-500/30 flex-shrink-0">
                    <img
                      src={item.thumbnail_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-100 mb-1">
                      {item.name}
                    </h3>
                    {item.variantName && (
                      <p className="text-sm text-gray-400 mb-2">{item.variantName}</p>
                    )}
                    <p className="text-lg font-bold text-pink-400">
                      ${(item.price_cents / 100).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <motion.button
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>

                    <div className="flex items-center gap-2">
                      <motion.button
                        className="p-1 bg-pink-500/20 border border-pink-500/40 rounded text-pink-400 hover:bg-pink-500/30"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </motion.button>
                      <span className="text-lg font-semibold text-gray-200 w-8 text-center">
                        {item.quantity}
                      </span>
                      <motion.button
                        className="p-1 bg-pink-500/20 border border-pink-500/40 rounded text-pink-400 hover:bg-pink-500/30"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <motion.div
          className="lg:col-span-1"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <div className="bg-gradient-to-br from-black/80 to-pink-900/20 border-2 border-pink-500/40 rounded-lg p-6 shadow-[0_0_30px_rgba(255,0,150,0.4)] sticky top-24">
            <h2 className="text-2xl font-bold text-pink-400 mb-6">Order Summary</h2>

            <div className="space-y-3 mb-6 text-gray-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${(totalCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-400' : ''}>
                  {shipping === 0 ? 'FREE' : `$${(shipping / 100).toFixed(2)}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-500 italic">
                  Free shipping on orders over $50
                </p>
              )}
              <div className="flex justify-between">
                <span>Tax (est.)</span>
                <span>${(tax / 100).toFixed(2)}</span>
              </div>
              <div className="border-t border-pink-500/30 pt-3 flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-pink-400">${(total / 100).toFixed(2)}</span>
              </div>
            </div>

            <Link to="/checkout">
              <AnimatedButton variant="primary" className="w-full">
                Proceed to Checkout
              </AnimatedButton>
            </Link>

            <Link to="/shop">
              <motion.button
                className="w-full mt-3 px-6 py-3 text-pink-400 hover:text-pink-300 transition-colors text-center"
                whileHover={{ scale: 1.02 }}
              >
                Continue Shopping
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
