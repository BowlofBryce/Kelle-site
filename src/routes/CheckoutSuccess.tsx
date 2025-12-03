import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Mail, Home } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { fadeInUp, scaleIn } from '../lib/animations';

export function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .maybeSingle();

      if (data) {
        setOrder(data);
      }
      setLoading(false);
    };

    fetchOrder();
  }, [sessionId]);

  const confettiColors = ['#ec4899', '#a855f7', '#06b6d4', '#10b981', '#f59e0b'];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: confettiColors[i % confettiColors.length],
            left: `${Math.random() * 100}%`,
            top: -20,
          }}
          animate={{
            y: [0, window.innerHeight + 100],
            x: [0, (Math.random() - 0.5) * 200],
            rotate: [0, Math.random() * 360],
            opacity: [1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 0.5,
            ease: 'easeOut',
          }}
        />
      ))}

      <motion.div
        className="w-full max-w-2xl relative z-10"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <div className="bg-gradient-to-br from-black/90 to-pink-900/30 border-2 border-pink-500/40 rounded-xl p-8 md:p-12 shadow-[0_0_50px_rgba(255,0,150,0.4)] text-center">
          <motion.div
            className="inline-block p-6 bg-green-500/10 border-2 border-green-500/40 rounded-full mb-6"
            variants={scaleIn}
            animate={{
              scale: [1, 1.1, 1],
              boxShadow: [
                '0 0 20px rgba(34, 197, 94, 0.3)',
                '0 0 40px rgba(34, 197, 94, 0.6)',
                '0 0 20px rgba(34, 197, 94, 0.3)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <CheckCircle className="w-16 h-16 text-green-400" />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Payment Successful!
          </h1>

          <p className="text-xl text-gray-300 mb-8">
            Thank you for your order from The Velvet Hollow
          </p>

          {loading ? (
            <motion.div
              className="inline-block w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          ) : order ? (
            <div className="space-y-6">
              <div className="bg-black/60 border-2 border-pink-500/40 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Order Number</p>
                    <p className="font-mono text-pink-400 font-semibold">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-green-400">
                      ${(order.total_cents / 100).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Email</p>
                    <p className="text-gray-200">{order.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Status</p>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                      PAID
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-cyan-500/10 border-2 border-cyan-500/40 rounded-lg p-6">
                <Package className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">
                    What happens next?
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span>Order confirmation sent to {order.email}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Package className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span>Your items are being prepared for printing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Package className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span>Shipping notification will be sent when your order ships</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link to="/">
                  <AnimatedButton variant="primary" className="w-full sm:w-auto">
                    <Home className="w-5 h-5 inline mr-2" />
                    Back to Home
                  </AnimatedButton>
                </Link>
                <Link to="/shop">
                  <AnimatedButton variant="secondary" className="w-full sm:w-auto">
                    Continue Shopping
                  </AnimatedButton>
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-400 mb-6">
                Your order has been placed successfully. A confirmation email will be sent shortly.
              </p>
              <Link to="/">
                <AnimatedButton variant="primary">
                  <Home className="w-5 h-5 inline mr-2" />
                  Back to Home
                </AnimatedButton>
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
