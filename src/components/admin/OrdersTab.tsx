import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Send,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AnimatedButton } from '../ui/AnimatedButton';
import { fadeInUp } from '../../lib/animations';
import type { Database } from '../../lib/database.types';

type Order = Database['public']['Tables']['orders']['Row'];

interface OrdersTabProps {
  orders: Order[];
  onRefresh: () => void;
}

export function OrdersTab({ orders, onRefresh }: OrdersTabProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      alert('Order status updated successfully!');
      onRefresh();
    } catch (error) {
      console.error('Status update error:', error);
      alert('Failed to update order status');
    }
  };

  const handleFulfillmentStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ fulfillment_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      alert('Fulfillment status updated successfully!');
      onRefresh();
    } catch (error) {
      console.error('Fulfillment status update error:', error);
      alert('Failed to update fulfillment status');
    }
  };

  const handleSendToPrintify = async (orderId: string) => {
    setProcessingOrder(orderId);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-printify-order`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to send order to Printify');
      } else {
        const result = await response.json();
        alert(`Order sent to Printify! Printify Order ID: ${result.printifyOrderId}`);
        onRefresh();
      }
    } catch (error) {
      console.error('Printify order error:', error);
      alert('Failed to send order to Printify');
    } finally {
      setProcessingOrder(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-400 border-green-500/40';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
    }
  };

  const getFulfillmentColor = (status: string | null) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'shipped':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'delivered':
        return 'bg-green-500/20 text-green-400 border-green-500/40';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
    }
  };

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-pink-400">Orders</h2>
        <AnimatedButton variant="secondary" onClick={onRefresh}>
          <RefreshCw className="w-5 h-5 inline mr-2" />
          Refresh
        </AnimatedButton>
      </div>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No orders yet</p>
          </div>
        ) : (
          orders.map((order) => {
            const isExpanded = expandedOrder === order.id;
            const address = order.shipping_address as any;

            return (
              <motion.div
                key={order.id}
                layout
                className="bg-black/60 border-2 border-pink-500/40 rounded-lg overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer hover:bg-pink-500/5 transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-gray-400">#{order.id.slice(0, 8)}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                        {order.status.toUpperCase()}
                      </span>
                      {order.fulfillment_status && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getFulfillmentColor(order.fulfillment_status)}`}>
                          {order.fulfillment_status.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xl font-bold text-pink-400">
                        ${(order.total_cents / 100).toFixed(2)}
                      </p>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-200">{order.email}</p>
                      <p className="text-sm text-gray-400">{order.customer_name}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t-2 border-pink-500/30 p-4 bg-black/40"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-lg font-semibold text-pink-300 mb-3">Order Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Order ID:</span>
                            <span className="text-gray-200 font-mono">{order.id}</span>
                          </div>
                          {order.stripe_payment_intent_id && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Stripe Payment:</span>
                              <span className="text-gray-200 font-mono text-xs">{order.stripe_payment_intent_id}</span>
                            </div>
                          )}
                          {order.printify_order_id && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Printify Order:</span>
                              <span className="text-gray-200 font-mono">{order.printify_order_id}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-400">Phone:</span>
                            <span className="text-gray-200">{order.customer_phone || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-pink-300 mb-3">Shipping Address</h4>
                        {address ? (
                          <div className="text-sm text-gray-300 space-y-1">
                            <p>{address.line1}</p>
                            {address.line2 && <p>{address.line2}</p>}
                            <p>
                              {address.city}, {address.state} {address.postal_code}
                            </p>
                            <p>{address.country}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">No shipping address</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <h4 className="text-lg font-semibold text-pink-300 mb-3">Actions</h4>
                        <div className="flex flex-wrap gap-3">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="px-4 py-2 bg-black/60 border border-pink-500/40 rounded text-gray-300 focus:outline-none focus:border-pink-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                          </select>

                          <select
                            value={order.fulfillment_status || 'unfulfilled'}
                            onChange={(e) => handleFulfillmentStatusChange(order.id, e.target.value)}
                            className="px-4 py-2 bg-black/60 border border-pink-500/40 rounded text-gray-300 focus:outline-none focus:border-pink-500"
                          >
                            <option value="unfulfilled">Unfulfilled</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="failed">Failed</option>
                          </select>

                          {order.status === 'paid' && !order.printify_order_id && (
                            <AnimatedButton
                              variant="primary"
                              onClick={() => handleSendToPrintify(order.id)}
                              disabled={processingOrder === order.id}
                            >
                              {processingOrder === order.id ? (
                                <RefreshCw className="w-5 h-5 inline mr-2 animate-spin" />
                              ) : (
                                <Send className="w-5 h-5 inline mr-2" />
                              )}
                              Send to Printify
                            </AnimatedButton>
                          )}

                          {order.printify_order_id && (
                            <span className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded border border-green-500/40">
                              <CheckCircle className="w-5 h-5" />
                              Sent to Printify
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
