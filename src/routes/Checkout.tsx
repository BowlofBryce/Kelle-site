import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, AlertCircle, Lock, Mail, User } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { supabase } from '../lib/supabase';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { fadeInUp } from '../lib/animations';

export function Checkout() {
  const { items, totalCents, clearCart } = useCart();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          customerEmail: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        await supabase.from('analytics_events').insert({
          type: 'checkout',
          session_id: sessionStorage.getItem('session_id') || crypto.randomUUID(),
        });

        clearCart();
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  const shipping = totalCents >= 5000 ? 0 : 500;
  const tax = Math.round(totalCents * 0.08);
  const total = totalCents + shipping + tax;

  if (items.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="max-w-2xl mx-auto py-12"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <div className="text-center mb-8">
        <motion.div
          className="inline-block p-4 bg-pink-500/10 border-2 border-pink-500/40 rounded-full mb-4"
          animate={{
            boxShadow: [
              '0 0 20px rgba(255, 0, 150, 0.3)',
              '0 0 40px rgba(255, 0, 150, 0.6)',
              '0 0 20px rgba(255, 0, 150, 0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Lock className="w-8 h-8 text-pink-500" />
        </motion.div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
          Secure Checkout
        </h1>
        <p className="text-gray-400">Powered by Stripe</p>
      </div>

      <div className="bg-gradient-to-br from-black/80 to-pink-900/20 border-2 border-pink-500/40 rounded-xl p-8 shadow-[0_0_50px_rgba(255,0,150,0.3)]">
        <h2 className="text-2xl font-bold text-pink-400 mb-6">Order Summary</h2>

        <div className="space-y-4 mb-6">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-pink-500/20">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-pink-500/30">
                <img
                  src={item.thumbnail_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-100 text-sm">{item.name}</h3>
                {item.variantName && (
                  <p className="text-xs text-gray-400">{item.variantName}</p>
                )}
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
              <p className="font-bold text-pink-400">
                ${((item.price_cents * item.quantity) / 100).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-2 mb-6 text-gray-300 border-t border-pink-500/20 pt-4">
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
          <div className="flex justify-between">
            <span>Tax (est.)</span>
            <span>${(tax / 100).toFixed(2)}</span>
          </div>
          <div className="border-t border-pink-500/30 pt-2 flex justify-between text-xl font-bold">
            <span>Total</span>
            <span className="text-pink-400">${(total / 100).toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleCheckout} className="space-y-6">
          {error && (
            <motion.div
              className="bg-red-500/10 border-2 border-red-500/40 rounded-lg p-4 flex items-start gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-black/60 border-2 border-pink-500/40 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                placeholder="your@email.com"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Order confirmation will be sent to this email
            </p>
          </div>

          <div className="bg-cyan-500/10 border-2 border-cyan-500/40 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="font-semibold text-cyan-400 mb-1">Secure Payment</p>
                <p className="text-xs">
                  You'll be redirected to Stripe's secure checkout page to complete your payment.
                  Shipping address will be collected there.
                </p>
              </div>
            </div>
          </div>

          <AnimatedButton type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CreditCard className="w-5 h-5" />
                Proceed to Payment
              </span>
            )}
          </AnimatedButton>

          <p className="text-xs text-center text-gray-500">
            By completing your purchase, you agree to our terms of service
          </p>
        </form>
      </div>
    </motion.div>
  );
}
