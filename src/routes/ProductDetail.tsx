import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Plus, Minus, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../hooks/useCart';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { ProductGrid } from '../components/merch/ProductGrid';
import { fadeInUp, scaleIn } from '../lib/animations';
import { organizeVariants, getColorHex } from '../lib/variantUtils';
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
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
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
        .not('printify_id', 'is', null)
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
        const organized = organizeVariants(vars);
        if (organized.colors.length > 0 && organized.sizes.length > 0) {
          const firstColor = organized.colors[0];
          const firstSize = organized.sizes[0];
          setSelectedColor(firstColor);
          setSelectedSize(firstSize);
          const variant = organized.variantMap.get(`${firstSize}|${firstColor}`);
          if (variant) setSelectedVariant(variant);
        } else {
          setSelectedVariant(vars[0]);
        }
      }

      const { data: related } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .not('printify_id', 'is', null)
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
  const variantOptions = organizeVariants(variants);

  const productImages = product.images && Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.thumbnail_url || 'https://images.pexels.com/photos/1058728/pexels-photo-1058728.jpeg?auto=compress&cs=tinysrgb&w=800'];

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    const variant = variantOptions.variantMap.get(`${selectedSize}|${color}`);
    if (variant) setSelectedVariant(variant);
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    const variant = variantOptions.variantMap.get(`${size}|${selectedColor}`);
    if (variant) setSelectedVariant(variant);
  };

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
          className="space-y-4"
        >
          <div className="aspect-square rounded-xl overflow-hidden border-2 border-pink-500/40 shadow-[0_0_40px_rgba(255,0,150,0.3)]">
            <motion.img
              key={selectedImageIndex}
              src={productImages[selectedImageIndex]}
              alt={`${product.name} - Image ${selectedImageIndex + 1}`}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {productImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {productImages.map((image, index) => (
                <motion.button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index
                      ? 'border-pink-500 shadow-[0_0_15px_rgba(255,0,150,0.5)]'
                      : 'border-gray-600 hover:border-pink-500/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img
                    src={image}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </motion.button>
              ))}
            </div>
          )}
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

          <div
            className="text-gray-300 leading-relaxed prose prose-invert prose-pink max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1"
            dangerouslySetInnerHTML={{ __html: product.description || '' }}
          />

          {variantOptions.colors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-200">
                Color: <span className="text-pink-400">{selectedColor}</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {variantOptions.colors.map(color => {
                  const hexColor = getColorHex(color);
                  const isSelected = selectedColor === color;

                  return (
                    <motion.button
                      key={color}
                      className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                        isSelected
                          ? 'border-pink-500 shadow-[0_0_15px_rgba(255,0,150,0.5)]'
                          : 'border-gray-600 hover:border-pink-500/50'
                      }`}
                      style={{ backgroundColor: hexColor }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleColorSelect(color)}
                      title={color}
                    >
                      {isSelected && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {variantOptions.sizes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-200">
                Size: <span className="text-pink-400">{selectedSize}</span>
              </h3>
              <div className="relative">
                <select
                  value={selectedSize}
                  onChange={e => handleSizeSelect(e.target.value)}
                  className="w-full md:w-48 px-4 py-3 bg-black/60 border-2 border-pink-500/40 rounded-lg text-gray-200 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 appearance-none cursor-pointer"
                >
                  {variantOptions.sizes.map(size => (
                    <option key={size} value={size} className="bg-black">
                      {size}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-pink-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
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
