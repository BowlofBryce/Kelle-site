import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { fadeInUp } from '../lib/animations';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      navigate('/velveth0ll0w-4dm1n/dashboard');
    }

    setLoading(false);
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
                  placeholder="admin@velveth ollow.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-black/60 border-2 border-pink-500/40 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
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
