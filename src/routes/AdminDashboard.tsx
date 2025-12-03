import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FileText,
  BarChart3,
  LogOut,
  Plus,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { fadeInUp } from '../lib/animations';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];

export function AdminDashboard() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'content'>(
    'overview'
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalProducts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        navigate('/velveth0ll0w-4dm1n');
        return;
      }

      const admin = await isAdmin();
      if (!admin) {
        navigate('/');
        return;
      }

      fetchData();
    };

    checkAuth();
  }, [user, navigate, isAdmin]);

  const fetchData = async () => {
    setLoading(true);

    const { data: prods } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (prods) setProducts(prods);

    const { data: ords } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (ords) {
      setOrders(ords);
      const revenue = ords.reduce((sum, order) => sum + order.total_cents, 0);
      setStats({
        totalRevenue: revenue,
        totalOrders: ords.length,
        totalProducts: prods?.length || 0,
      });
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1a1a1a,_#050505)] text-gray-100">
      <div className="border-b-2 border-pink-500/30 bg-black/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <motion.button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          <motion.aside
            className="w-64 space-y-2"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <TabButton
              icon={<LayoutDashboard className="w-5 h-5" />}
              label="Overview"
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <TabButton
              icon={<Package className="w-5 h-5" />}
              label="Products"
              active={activeTab === 'products'}
              onClick={() => setActiveTab('products')}
            />
            <TabButton
              icon={<ShoppingBag className="w-5 h-5" />}
              label="Orders"
              active={activeTab === 'orders'}
              onClick={() => setActiveTab('orders')}
            />
            <TabButton
              icon={<FileText className="w-5 h-5" />}
              label="Content"
              active={activeTab === 'content'}
              onClick={() => setActiveTab('content')}
            />
          </motion.aside>

          <main className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <motion.div
                  className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            ) : (
              <>
                {activeTab === 'overview' && <OverviewTab stats={stats} />}
                {activeTab === 'products' && <ProductsTab products={products} onRefresh={fetchData} />}
                {activeTab === 'orders' && <OrdersTab orders={orders} />}
                {activeTab === 'content' && <ContentTab />}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active
          ? 'bg-pink-500/20 border-2 border-pink-500/50 text-pink-300'
          : 'text-gray-400 hover:text-pink-400 hover:bg-pink-500/10 border-2 border-transparent'
      }`}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </motion.button>
  );
}

function OverviewTab({ stats }: { stats: { totalRevenue: number; totalOrders: number; totalProducts: number } }) {
  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
      <h2 className="text-3xl font-bold text-pink-400">Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<BarChart3 className="w-8 h-8" />}
          label="Total Revenue"
          value={`$${(stats.totalRevenue / 100).toFixed(2)}`}
          color="pink"
        />
        <StatCard
          icon={<ShoppingBag className="w-8 h-8" />}
          label="Total Orders"
          value={stats.totalOrders.toString()}
          color="purple"
        />
        <StatCard
          icon={<Package className="w-8 h-8" />}
          label="Total Products"
          value={stats.totalProducts.toString()}
          color="cyan"
        />
      </div>

      <div className="bg-black/60 border-2 border-pink-500/40 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-200 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedButton variant="primary" className="w-full">
            <Plus className="w-5 h-5 inline mr-2" />
            Add New Product
          </AnimatedButton>
          <AnimatedButton variant="secondary" className="w-full">
            View Analytics
          </AnimatedButton>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'pink' | 'purple' | 'cyan';
}) {
  const colorClasses = {
    pink: 'text-pink-500 border-pink-500/40 shadow-[0_0_30px_rgba(255,0,150,0.2)]',
    purple: 'text-purple-500 border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.2)]',
    cyan: 'text-cyan-500 border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.2)]',
  };

  return (
    <motion.div
      className={`bg-black/60 border-2 rounded-lg p-6 ${colorClasses[color]}`}
      whileHover={{ y: -4 }}
    >
      <div className={`mb-3 ${colorClasses[color]}`}>{icon}</div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-100">{value}</p>
    </motion.div>
  );
}

function ProductsTab({ products, onRefresh }: { products: Product[]; onRefresh: () => void }) {
  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-pink-400">Products</h2>
        <AnimatedButton variant="primary">
          <Plus className="w-5 h-5 inline mr-2" />
          Add Product
        </AnimatedButton>
      </div>

      <div className="space-y-3">
        {products.map(product => (
          <div
            key={product.id}
            className="bg-black/60 border-2 border-pink-500/40 rounded-lg p-4 flex items-center gap-4"
          >
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-pink-500/30">
              <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-100">{product.name}</h3>
              <p className="text-sm text-gray-400">${(product.price_cents / 100).toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${product.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {product.active ? 'Active' : 'Inactive'}
              </span>
              {product.featured && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-400">
                  Featured
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function OrdersTab({ orders }: { orders: Order[] }) {
  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
      <h2 className="text-3xl font-bold text-pink-400">Orders</h2>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No orders yet</p>
          </div>
        ) : (
          orders.map(order => (
            <div
              key={order.id}
              className="bg-black/60 border-2 border-pink-500/40 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm text-gray-400">#{order.id.slice(0, 8)}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  order.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                  order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {order.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-200">{order.email}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-xl font-bold text-pink-400">
                  ${(order.total_cents / 100).toFixed(2)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function ContentTab() {
  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
      <h2 className="text-3xl font-bold text-pink-400">Content Management</h2>
      <div className="bg-black/60 border-2 border-pink-500/40 rounded-lg p-6">
        <p className="text-gray-400">
          CMS functionality for editing homepage content, bulletins, and about page text will be
          implemented here.
        </p>
      </div>
    </motion.div>
  );
}
