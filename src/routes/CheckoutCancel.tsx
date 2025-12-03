import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { XCircle, ShoppingCart, Home } from 'lucide-react';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { fadeInUp, scaleIn } from '../lib/animations';

export function CheckoutCancel() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-2xl"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <div className="bg-gradient-to-br from-black/90 to-orange-900/20 border-2 border-orange-500/40 rounded-xl p-8 md:p-12 shadow-[0_0_50px_rgba(249,115,22,0.3)] text-center">
          <motion.div
            className="inline-block p-6 bg-orange-500/10 border-2 border-orange-500/40 rounded-full mb-6"
            variants={scaleIn}
            animate={{
              rotate: [0, -5, 5, -5, 0],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          >
            <XCircle className="w-16 h-16 text-orange-400" />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
            Payment Cancelled
          </h1>

          <p className="text-xl text-gray-300 mb-6">
            No worries! Your order was not processed.
          </p>

          <div className="bg-orange-500/10 border-2 border-orange-500/40 rounded-lg p-6 mb-8">
            <div className="text-left space-y-3 text-gray-300">
              <p className="text-sm">
                <strong className="text-orange-400">Your cart items are still saved!</strong>
              </p>
              <p className="text-sm">
                You can return to your cart at any time to complete your purchase. We'll keep your
                items safe for you.
              </p>
              <p className="text-sm text-gray-400">
                If you experienced any issues during checkout, please try again or contact our
                support team.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/cart">
              <AnimatedButton variant="primary" className="w-full sm:w-auto">
                <ShoppingCart className="w-5 h-5 inline mr-2" />
                Return to Cart
              </AnimatedButton>
            </Link>
            <Link to="/shop">
              <AnimatedButton variant="secondary" className="w-full sm:w-auto">
                Continue Shopping
              </AnimatedButton>
            </Link>
            <Link to="/">
              <AnimatedButton variant="outline" className="w-full sm:w-auto">
                <Home className="w-5 h-5 inline mr-2" />
                Back to Home
              </AnimatedButton>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
