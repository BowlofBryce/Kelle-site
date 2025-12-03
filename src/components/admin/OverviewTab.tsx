import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  ShoppingBag,
  Package,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AnimatedButton } from '../ui/AnimatedButton';
import { fadeInUp } from '../../lib/animations';

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  revenueToday: number;
  ordersToday: number;
  revenueThisWeek: number;
  ordersThisWeek: number;
  revenueThisMonth: number;
  ordersThisMonth: number;
  avgOrderValue: number;
}

interface OverviewTabProps {
  stats: { totalRevenue: number; totalOrders: number; totalProducts: number };
  onRefresh: () => void;
}

export function OverviewTab({ stats, onRefresh }: OverviewTabProps) {
  const [detailedStats, setDetailedStats] = useState<Stats>({
    totalRevenue: stats.totalRevenue,
    totalOrders: stats.totalOrders,
    totalProducts: stats.totalProducts,
    revenueToday: 0,
    ordersToday: 0,
    revenueThisWeek: 0,
    ordersThisWeek: 0,
    revenueThisMonth: 0,
    ordersThisMonth: 0,
    avgOrderValue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetailedStats();
  }, [stats]);

  const loadDetailedStats = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const { data: ordersToday } = await supabase
        .from('orders')
        .select('total_cents')
        .eq('status', 'paid')
        .gte('created_at', today.toISOString());

      const { data: ordersThisWeek } = await supabase
        .from('orders')
        .select('total_cents')
        .eq('status', 'paid')
        .gte('created_at', weekAgo.toISOString());

      const { data: ordersThisMonth } = await supabase
        .from('orders')
        .select('total_cents')
        .eq('status', 'paid')
        .gte('created_at', monthAgo.toISOString());

      const { data: recent } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const revenueToday = ordersToday?.reduce((sum, o) => sum + o.total_cents, 0) || 0;
      const revenueWeek = ordersThisWeek?.reduce((sum, o) => sum + o.total_cents, 0) || 0;
      const revenueMonth = ordersThisMonth?.reduce((sum, o) => sum + o.total_cents, 0) || 0;

      setDetailedStats({
        totalRevenue: stats.totalRevenue,
        totalOrders: stats.totalOrders,
        totalProducts: stats.totalProducts,
        revenueToday,
        ordersToday: ordersToday?.length || 0,
        revenueThisWeek: revenueWeek,
        ordersThisWeek: ordersThisWeek?.length || 0,
        revenueThisMonth: revenueMonth,
        ordersThisMonth: ordersThisMonth?.length || 0,
        avgOrderValue: stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0,
      });

      setRecentOrders(recent || []);
    } catch (error) {
      console.error('Error loading detailed stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-pink-400">Dashboard Overview</h2>
        <AnimatedButton variant="secondary" onClick={onRefresh}>
          <RefreshCw className="w-5 h-5 inline mr-2" />
          Refresh
        </AnimatedButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<DollarSign className="w-8 h-8" />}
          label="Total Revenue"
          value={`$${(detailedStats.totalRevenue / 100).toFixed(2)}`}
          color="pink"
        />
        <StatCard
          icon={<ShoppingBag className="w-8 h-8" />}
          label="Total Orders"
          value={detailedStats.totalOrders.toString()}
          color="purple"
        />
        <StatCard
          icon={<Package className="w-8 h-8" />}
          label="Total Products"
          value={detailedStats.totalProducts.toString()}
          color="cyan"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black/60 border-2 border-pink-500/40 rounded-lg p-6">
          <h3 className="text-xl font-bold text-pink-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Average Order Value</span>
              <span className="text-2xl font-bold text-pink-400">
                ${(detailedStats.avgOrderValue / 100).toFixed(2)}
              </span>
            </div>
            <div className="h-px bg-pink-500/20" />
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Today's Revenue</span>
              <span className="text-xl font-bold text-green-400">
                ${(detailedStats.revenueToday / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Orders today</span>
              <span className="text-gray-300">{detailedStats.ordersToday}</span>
            </div>
          </div>
        </div>

        <div className="bg-black/60 border-2 border-purple-500/40 rounded-lg p-6">
          <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Time Period Stats
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400">This Week</span>
                <span className="text-xl font-bold text-purple-400">
                  ${(detailedStats.revenueThisWeek / 100).toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-gray-500">{detailedStats.ordersThisWeek} orders</div>
            </div>
            <div className="h-px bg-purple-500/20" />
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400">This Month</span>
                <span className="text-xl font-bold text-cyan-400">
                  ${(detailedStats.revenueThisMonth / 100).toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-gray-500">{detailedStats.ordersThisMonth} orders</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black/60 border-2 border-pink-500/40 rounded-lg p-6">
        <h3 className="text-xl font-bold text-pink-300 mb-4 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" />
          Recent Orders
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <motion.div
              className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="text-center py-8 text-gray-400">No recent orders</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-black/40 rounded border border-pink-500/20 hover:border-pink-500/40 transition-colors"
              >
                <div>
                  <p className="text-gray-200 font-medium">{order.email}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-pink-400">
                    ${(order.total_cents / 100).toFixed(2)}
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      order.status === 'paid'
                        ? 'bg-green-500/20 text-green-400'
                        : order.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
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
