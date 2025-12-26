import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Plus, Minus, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../hooks/useCart';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { ProductGrid } from '../components/merch/ProductGrid';
import { fadeInUp, scaleIn } from '../lib/animations';
import { organizeVariants, getColorInfo } from '../lib/variantUtils';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Variant = Database['public']['Tables']['variants']['Row'];

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [stockError, setStockError] = useState('');

  const variantOptions = useMemo(() => organizeVariants(variants), [variants]);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!slug) return;

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

      if (!isMounted) return;
      setProduct(prod);

      // ✅ IMPORTANT FIX:
      // Do NOT filter by available=true here. That hides most Printify variants.
      // Fetch all variants and allow UI to disable out-of-stock combinations.
      const { data: vars } = await supabase
        .from('variants')
        .select('*')
        .eq('product_id', prod.id);

      if (!isMounted) return;

      const allVariants = vars || [];
      setVariants(allVariants);

      const organized = organizeVariants(allVariants);

      // Pick an initial selection:
      // Prefer the first in-stock combo, else fall back to first combo.
      let initialSize = organized.sizes[0] || '';
      let initialColor = organized.colors[0] || '';

      const firstInStock = allVariants.find(v => !!v.available);
      if (firstInStock) {
        const vSize = ((firstInStock as any).size || (firstInStock.name || '').split('/')[0]?.trim()) || initialSize;
        const vColor = ((firstInStock as any).color || (firstInStock.name || '').split('/')[1]?.trim()) || initialColor;
        if (vSize) initialSize = vSize;
        if (vColor) initialColor = vColor;
        setSelectedVariant(firstInStock);
      } else {
        const fallback = organized.variantMap.get(`${initialSize}|${initialColor}`) || allVariants[0] || null;
        setSelectedVariant(fallback);
      }

      setSelectedSize(initialSize);
      setSelectedColor(initialColor);

      const { data: related } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .not('printify_id', 'is', null)
        .neq('id', prod.id)
        .limit(6);

      if (!isMounted) return;
      setRelatedProducts(related || []);
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [slug, navigate]);

  useEffect(() => {
    setAddedToCart(false);
  }, [selectedVariant?.id, quantity]);

  const handleAddToCart = () => {
    if (!product) return;
    setStockError('');

    if (!selectedVariant || !selectedVariant.available) {
      setStockError('This variant is currently out of stock. Please choose another option.');
      return;
    }

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      price_cents: selectedVariant.price_cents || product.price_cents,
      quantity,
      thumbnail_url: product.thumbnail_url,
      variantName: selectedVariant.name,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-300">Loading...</div>
      </div>
    );
  }

  const baseImages =
    (product.images && product.images.length > 0 ? product.images : null) ||
    (product.thumbnail_url ? [product.thumbnail_url] : null) ||
    ['https://images.pexels.com/photos/1058728/pexels-photo-1058728.jpeg?auto=compress&cs=tinysrgb&w=800'];

  const productImages = selectedVariant?.preview_url
    ? [selectedVariant.preview_url, ...baseImages]
    : baseImages;

  const variantKey = (size: string, color: string) => `${size}|${color}`;
  const getVariantFor = (size: string, color: string) => variantOptions.variantMap.get(variantKey(size, color));

  const isComboAvailable = (size: string, color: string) => {
    const v = getVariantFor(size, color);
    return !!v && !!v.available;
  };

  const availableSizesForColor = (color: string) =>
    variantOptions.sizes.filter(size => isComboAvailable(size, color));

  const hasAnyAvailableForColor = (color: string) =>
    variantOptions.sizes.some(size => isComboAvailable(size, color));

  const availableColorsForSize = (size: string) =>
    variantOptions.colors.filter(color => isComboAvailable(size, color));

  const hasAnyAvailableForSize = (size: string) =>
    variantOptions.colors.some(color => isComboAvailable(size, color));

  const handleColorSelect = (color: string) => {
    if (!hasAnyAvailableForColor(color)) return;

    setSelectedColor(color);
    setSelectedImageIndex(0);

    const validSizes = availableSizesForColor(color);
    const nextSize =
      validSizes.includes(selectedSize)
        ? selectedSize
        : (validSizes[0] ?? variantOptions.sizes[0] ?? selectedSize);

    setSelectedSize(nextSize);

    const variant =
      getVariantFor(nextSize, color) ??
      // Fallback: pick any variant for the selected color (even if unavailable)
      variants.find(v => {
        const vSize = (v as any).size || (v.name || '').split('/')[0]?.trim();
        const vColor = (v as any).color || (v.name || '').split('/')[1]?.trim();
        return vColor === color && vSize === nextSize;
      }) ??
      variants.find(v => {
        const vColor = (v as any).color || (v.name || '').split('/')[1]?.trim();
        return vColor === color;
      });

    if (variant) setSelectedVariant(variant);
  };

  const handleSizeSelect = (size: string) => {
    if (!hasAnyAvailableForSize(size)) return;

    setSelectedSize(size);
    setSelectedImageIndex(0);

    const validColors = availableColorsForSize(size);
    const nextColor =
      validColors.includes(selectedColor)
        ? selectedColor
        : (validColors[0] ?? variantOptions.colors[0] ?? selectedColor);

    setSelectedColor(nextColor);

    const variant =
      getVariantFor(size, nextColor) ??
      variants.find(v => {
        const vSize = (v as any).size || (v.name || '').split('/')[0]?.trim();
        const vColor = (v as any).color || (v.name || '').split('/')[1]?.trim();
        return vSize === size && vColor === nextColor;
      }) ??
      variants.find(v => {
        const vSize = (v as any).size || (v.name || '').split('/')[0]?.trim();
        return vSize === size;
      });

    if (variant) setSelectedVariant(variant);
  };

  const canAddToCart = !!selectedVariant && !!selectedVariant.available;

  return (
    <div className="space-y-12">
      <motion.button
        className="flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors"
        onClick={() => navigate(-1)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <motion.div
          className="space-y-4"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-black/40 border border-pink-500/20">
            <img
              src={productImages[selectedImageIndex]}
              alt={product.name}
              className="w-full h-full object-contain p-6"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {productImages.slice(0, 8).map((img, index) => (
              <button
                key={`${img}-${index}`}
                onClick={() => setSelectedImageIndex(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                  selectedImageIndex === index
                    ? 'border-pink-500 shadow-[0_0_15px_rgba(255,0,150,0.35)]'
                    : 'border-gray-700 hover:border-pink-500/40'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* Details */}
        <motion.div
          className="space-y-6"
          initial="initial"
          animate="animate"
          variants={scaleIn}
        >
          <div>
            <h1 className="text-3xl font-bold text-white">{product.name}</h1>
            <p className="text-2xl font-semibold text-pink-400 mt-2">
              ${(product.price_cents / 100).toFixed(2)}
            </p>
          </div>

          <div
            className="prose prose-invert max-w-none text-gray-200"
            dangerouslySetInnerHTML={{ __html: product.description || '' }}
          />

          {/* Color Selection */}
          {variantOptions.colors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-200">
                Color: <span className="text-pink-400">{selectedColor}</span>
              </h3>

              <div className="flex flex-wrap gap-3">
                {variantOptions.colors.map(color => {
                  const colorInfo = getColorInfo(color, variants, variantOptions.sizes);
                  const isSelected = selectedColor === color;
                  const selectable = hasAnyAvailableForColor(color);

                  return (
                    <motion.button
                      key={color}
                      className={`relative w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${
                        isSelected
                          ? 'border-pink-500 shadow-[0_0_15px_rgba(255,0,150,0.5)]'
                          : 'border-gray-600 hover:border-pink-500/50'
                      }`}
                      whileHover={{ scale: selectable ? 1.1 : 1 }}
                      whileTap={{ scale: selectable ? 0.9 : 1 }}
                      onClick={() => handleColorSelect(color)}
                      disabled={!selectable}
                      title={color}
                      style={{
                        opacity: selectable ? 1 : 0.35,
                        cursor: selectable ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {colorInfo.previewUrl ? (
                        <img
                          src={colorInfo.previewUrl}
                          alt={color}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full"
                          style={{ backgroundColor: colorInfo.hexColor }}
                        />
                      )}

                      {isSelected && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {variantOptions.sizes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-200">
                Size: <span className="text-pink-400">{selectedSize}</span>
              </h3>

              <div className="relative">
                <select
                  value={selectedSize}
                  onChange={e => handleSizeSelect(e.target.value)}
                  className="w-full md:w-48 px-4 py-3 bg-black/60 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 appearance-none cursor-pointer"
                >
                  {variantOptions.sizes.map(size => (
                    <option
                      key={size}
                      value={size}
                      className="bg-black"
                      disabled={!isComboAvailable(size, selectedColor)}
                    >
                      {size}{!isComboAvailable(size, selectedColor) ? ' (Out of stock)' : ''}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-200">Quantity</h3>
            <div className="flex items-center gap-4">
              <motion.button
                className="w-12 h-12 rounded-xl bg-black/60 border border-gray-700 flex items-center justify-center text-white hover:bg-pink-500/20 disabled:opacity-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-5 h-5" />
              </motion.button>

              <div className="text-2xl font-semibold text-white w-12 text-center">
                {quantity}
              </div>

              <motion.button
                className="w-12 h-12 rounded-xl bg-black/60 border border-gray-700 flex items-center justify-center text-white hover:bg-pink-500/20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Add to Cart */}
          <div className="pt-4">
            <AnimatedButton
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className="w-full flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              {addedToCart ? 'Added to Cart!' : canAddToCart ? 'Add to Cart' : 'Out of Stock'}
            </AnimatedButton>

            {stockError && (
              <p className="mt-3 text-sm text-red-400">{stockError}</p>
            )}
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
