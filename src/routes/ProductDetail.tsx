import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../hooks/useCart';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { ProductGrid } from '../components/merch/ProductGrid';
import { fadeInUp, scaleIn } from '../lib/animations';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Variant = Database['public']['Tables']['variants']['Row'];

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);

      const { data: prod } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .maybeSingle();

      if (!prod) {
        navigate('/shop');
        return;
      }

      setProduct(prod);

      const { data: vars } = await supabase
        .from('variants')
        .select('*')
        .eq('product_id', prod.id);

      if (vars && vars.length > 0) {
        setVariants(vars);
        setSelectedVariant(vars[0]);
      }

      const { data: related } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .neq('id', prod.id)
        .limit(4);

      if (related) setRelatedProducts(related);

      await supabase.from('analytics_events').insert({
        type: 'product_view',
        path: `/product/${slug}`,
        product_id: prod.id,
        session_id: sessionStorage.getItem('session_id') || crypto.randomUUID(),
      });

      setLoading(false);
    };

    fetchProduct();
  }, [slug, navigate]);

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      price_cents: selectedVariant?.price_cents || product.price_cents,
      quantity,
      thumbnail_url: product.thumbnail_url,
      variantName: selectedVariant?.name,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);

    supabase.from('analytics_events').insert({
      type: 'add_to_cart',
      product_id: product.id,
      session_id: sessionStorage.getItem('session_id') || crypto.randomUUID(),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (!product) return null;

  const displayPrice = selectedVariant?.price_cents || product.price_cents;

  return (
    <div className="space-y-12">
      <motion.button
        className="flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors"
        onClick={() => navigate('/shop')}
        whileHover={{ x: -4 }}
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Shop
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="relative"
        >
          <div className="aspect-square rounded-xl overflow-hidden border-2 border-pink-500/40 shadow-[0_0_40px_rgba(255,0,150,0.3)]">
            <motion.img
              src={
                product.thumbnail_url ||
                'https://images.pexels.com/photos/1058728/pexels-photo-1058728.jpeg?auto=compress&cs=tinysrgb&w=800'
              }
              alt={product.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 80, damping: 15 }}
            />
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              {product.name}
            </h1>
            <p className="text-3xl font-bold text-pink-500">
              ${(displayPrice / 100).toFixed(2)}
            </p>
          </div>

          <p className="text-gray-300 leading-relaxed">{product.description}</p>

          {variants.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-200">Select Variant</h3>
              <div className="flex flex-wrap gap-3">
                {variants.map(variant => (
                  <motion.button
                    key={variant.id}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      selectedVariant?.id === variant.id
                        ? 'border-pink-500 bg-pink-500/20 text-pink-300'
                        : 'border-gray-600 text-gray-400 hover:border-pink-500/50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedVariant(variant)}
                  >
                    {variant.name}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-200">Quantity</h3>
            <div className="flex items-center gap-4">
              <motion.button
                className="p-2 bg-pink-500/20 border border-pink-500/40 rounded-lg text-pink-400 hover:bg-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-5 h-5" />
              </motion.button>
              <span className="text-2xl font-bold text-gray-200 w-12 text-center">
                {quantity}
              </span>
              <motion.button
                className="p-2 bg-pink-500/20 border border-pink-500/40 rounded-lg text-pink-400 hover:bg-pink-500/30"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          <div className="pt-4">
            <AnimatedButton
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              {addedToCart ? 'Added to Cart!' : 'Add to Cart'}
            </AnimatedButton>
          </div>
        </motion.div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="pt-12 border-t-2 border-pink-500/20">
          <ProductGrid products={relatedProducts} title="You Might Also Like" />
        </section>
      )}
    </div>
  );
}
