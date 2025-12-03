import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProductGrid } from '../components/merch/ProductGrid';
import { slideInLeft } from '../lib/animations';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [showFilters, setShowFilters] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: cats } = await supabase.from('categories').select('*').order('name');
      if (cats) setCategories(cats);

      let query = supabase.from('products').select('*').eq('active', true);

      if (selectedCategory) {
        const { data: productCategories } = await supabase
          .from('product_categories')
          .select('product_id')
          .eq('category_id', selectedCategory);

        if (productCategories) {
          const productIds = productCategories.map(pc => pc.product_id);
          query = query.in('id', productIds);
        }
      }

      const { data: prods } = await query.order('created_at', { ascending: false });

      if (prods) {
        const filtered = prods.filter(
          p =>
            p.price_cents >= priceRange[0] * 100 &&
            p.price_cents <= priceRange[1] * 100
        );
        setProducts(filtered);
      }

      setLoading(false);

      await supabase.from('analytics_events').insert({
        type: 'page_view',
        path: '/shop',
        session_id: sessionStorage.getItem('session_id') || crypto.randomUUID(),
      });
    };

    fetchData();
  }, [selectedCategory, priceRange]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
          Shop All
        </h1>
        <motion.button
          className="lg:hidden flex items-center gap-2 px-4 py-2 bg-pink-500/20 border border-pink-500/40 rounded-lg text-pink-400 hover:bg-pink-500/30 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-5 h-5" />
          Filters
        </motion.button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <AnimatePresence>
          {showFilters && (
            <motion.aside
              className="w-full lg:w-64 space-y-6"
              variants={slideInLeft}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="bg-black/60 border-2 border-pink-500/40 rounded-lg p-4 shadow-[0_0_20px_rgba(255,0,150,0.3)]">
                <h3 className="text-lg font-bold text-pink-400 mb-4">Categories</h3>
                <div className="space-y-2">
                  <FilterButton
                    active={selectedCategory === null}
                    onClick={() => setSelectedCategory(null)}
                  >
                    All Products
                  </FilterButton>
                  {categories.map(cat => (
                    <FilterButton
                      key={cat.id}
                      active={selectedCategory === cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.name}
                    </FilterButton>
                  ))}
                </div>
              </div>

              <div className="bg-black/60 border-2 border-purple-500/40 rounded-lg p-4 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                <h3 className="text-lg font-bold text-purple-400 mb-4">Price Range</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={priceRange[1]}
                    onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full accent-pink-500"
                  />
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <motion.div
                className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-pink-500/30 text-pink-300 border border-pink-500/50'
          : 'text-gray-400 hover:text-pink-400 hover:bg-pink-500/10'
      }`}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
