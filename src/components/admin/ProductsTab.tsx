import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Star,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  X,
  Upload,
  Package,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AnimatedButton } from '../ui/AnimatedButton';
import { fadeInUp } from '../../lib/animations';
import type { Database } from '../../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductsTabProps {
  products: Product[];
  onRefresh: () => void;
}

export function ProductsTab({ products, onRefresh }: ProductsTabProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price_cents: 2999,
    thumbnail_url: '',
    active: true,
    featured: false,
    category: 'merch',
  });

  const handleSync = async () => {
    setSyncing(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-printify-products`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to sync products');
      } else {
        const result = await response.json();
        alert(`Successfully synced ${result.synced} products from Printify!`);
        onRefresh();
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync products');
    } finally {
      setSyncing(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price_cents: 2999,
      thumbnail_url: '',
      active: true,
      featured: false,
      category: 'merch',
    });
  };

  const handleSave = async () => {
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(formData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        alert('Product updated successfully!');
      } else if (isCreating) {
        const { error } = await supabase.from('products').insert([formData]);

        if (error) throw error;
        alert('Product created successfully!');
      }

      setEditingProduct(null);
      setIsCreating(false);
      onRefresh();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save product');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);

      if (error) throw error;
      alert('Product deleted successfully!');
      onRefresh();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete product');
    }
  };

  const toggleActive = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: !product.active })
        .eq('id', product.id);

      if (error) throw error;
      onRefresh();
    } catch (error) {
      console.error('Toggle error:', error);
      alert('Failed to update product status');
    }
  };

  const toggleFeatured = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ featured: !product.featured })
        .eq('id', product.id);

      if (error) throw error;
      onRefresh();
    } catch (error) {
      console.error('Toggle error:', error);
      alert('Failed to update product featured status');
    }
  };

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-pink-400">Products</h2>
        <div className="flex gap-3">
          <AnimatedButton
            variant="secondary"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw className={`w-5 h-5 inline mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync from Printify
          </AnimatedButton>
          <AnimatedButton variant="primary" onClick={handleCreate}>
            <Plus className="w-5 h-5 inline mr-2" />
            Add Product
          </AnimatedButton>
        </div>
      </div>

      <AnimatePresence>
        {(editingProduct || isCreating) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/60 border-2 border-pink-500/40 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-pink-300">
                {isCreating ? 'Create New Product' : 'Edit Product'}
              </h3>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsCreating(false);
                }}
                className="text-gray-400 hover:text-pink-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-black/60 border border-pink-500/40 rounded text-gray-300 focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={(formData.price_cents || 0) / 100}
                  onChange={(e) =>
                    setFormData({ ...formData, price_cents: Math.round(parseFloat(e.target.value) * 100) })
                  }
                  className="w-full px-4 py-2 bg-black/60 border border-pink-500/40 rounded text-gray-300 focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-black/60 border border-pink-500/40 rounded text-gray-300 focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">Thumbnail URL</label>
                <input
                  type="text"
                  value={formData.thumbnail_url || ''}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  className="w-full px-4 py-2 bg-black/60 border border-pink-500/40 rounded text-gray-300 focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                <select
                  value={formData.category || 'merch'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-black/60 border border-pink-500/40 rounded text-gray-300 focus:outline-none focus:border-pink-500 transition-colors"
                >
                  <option value="merch">Merch</option>
                  <option value="apparel">Apparel</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active || false}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-5 h-5 text-pink-500 bg-black/60 border-pink-500/40 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-400">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured || false}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-5 h-5 text-pink-500 bg-black/60 border-pink-500/40 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-400">Featured</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <AnimatedButton
                variant="secondary"
                onClick={() => {
                  setEditingProduct(null);
                  setIsCreating(false);
                }}
              >
                Cancel
              </AnimatedButton>
              <AnimatedButton variant="primary" onClick={handleSave}>
                <Save className="w-5 h-5 inline mr-2" />
                Save Product
              </AnimatedButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {products.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No products yet. Sync from Printify or create manually.</p>
          </div>
        ) : (
          products.map((product) => (
            <motion.div
              key={product.id}
              layout
              className="bg-black/60 border-2 border-pink-500/40 rounded-lg p-4 flex items-center gap-4"
            >
              <div className="w-20 h-20 rounded-lg overflow-hidden border border-pink-500/30 flex-shrink-0">
                {product.thumbnail_url ? (
                  <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-100 truncate">{product.name}</h3>
                <p className="text-sm text-gray-400">${(product.price_cents / 100).toFixed(2)}</p>
                {product.printify_id && (
                  <p className="text-xs text-purple-400 mt-1">Printify ID: {product.printify_id}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => toggleActive(product)}
                  className={`p-2 rounded transition-colors ${
                    product.active
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title={product.active ? 'Active' : 'Inactive'}
                >
                  {product.active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </motion.button>
                <motion.button
                  onClick={() => toggleFeatured(product)}
                  className={`p-2 rounded transition-colors ${
                    product.featured
                      ? 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30'
                      : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title={product.featured ? 'Featured' : 'Not Featured'}
                >
                  <Star className="w-5 h-5" fill={product.featured ? 'currentColor' : 'none'} />
                </motion.button>
                <motion.button
                  onClick={() => handleEdit(product)}
                  className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Edit2 className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={() => handleDelete(product.id)}
                  className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash2 className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
