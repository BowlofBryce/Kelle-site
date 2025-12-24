import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FileText,
  LogOut,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fadeInUp } from '../lib/animations';
import type { Database } from '../lib/database.types';
import { ProductsTab } from '../components/admin/ProductsTab';
import { OrdersTab } from '../components/admin/OrdersTab';
import { ContentTab } from '../components/admin/ContentTab';
import { OverviewTab } from '../components/admin/OverviewTab';

type Product = Database['public']['Tables']['products']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];

export function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'content'>(
    'overview'
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalProducts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_session_token');

    if (!token) {
      navigate('/backstage');
      return;
    }

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-admin-session`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (!result.valid) {
        localStorage.removeItem('admin_session_token');
        navigate('/backstage');
        return;
      }

      fetchData();
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('admin_session_token');
      navigate('/backstage');
    }
  };

  const fetchData = async () => {
    setLoading(true);

    const { data: prods } = await supabase
      .from('products')
      .select('*')
      .not('printify_id', 'is', null)
      .order('created_at', { ascending: false });
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
    localStorage.removeItem('admin_session_token');
    navigate('/backstage');
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
                {activeTab === 'overview' && <OverviewTab stats={stats} onRefresh={fetchData} />}
                {activeTab === 'products' && <ProductsTab products={products} onRefresh={fetchData} />}
                {activeTab === 'orders' && <OrdersTab orders={orders} onRefresh={fetchData} />}
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

