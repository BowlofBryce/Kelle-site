import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, Key } from 'lucide-react';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { fadeInUp } from '../lib/animations';

export function AdminLogin() {
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-admin-key`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: adminKey }),
      });

      const result = await response.json();

      if (result.valid && result.token) {
        localStorage.setItem('admin_session_token', result.token);
        navigate('/admin/dashboard');
      } else {
        setError('Invalid admin key');
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <div className="bg-gradient-to-br from-black/90 to-pink-900/30 border-2 border-pink-500/40 rounded-xl p-8 shadow-[0_0_50px_rgba(255,0,150,0.4)]">
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              Admin Access
            </h1>
            <p className="text-gray-400 mt-2">Enter the void</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                Admin Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={adminKey}
                  onChange={e => setAdminKey(e.target.value.toUpperCase())}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-black/60 border-2 border-pink-500/40 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors font-mono tracking-wider"
                  placeholder="VH-XXXXXXXX-XXXXXXXX-XXXXXXXX"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Enter your secure admin key to access the dashboard
              </p>
            </div>

            <AnimatedButton type="submit" className="w-full" disabled={loading}>
              {loading ? 'Authenticating...' : 'Enter Dashboard'}
            </AnimatedButton>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Authorized personnel only</p>
          </div>
        </div>

        <motion.div
          className="mt-6 text-center text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>Need admin access? Contact the system administrator.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
