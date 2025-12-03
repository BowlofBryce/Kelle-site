import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Database } from '../../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      className="bg-black/60 border-2 border-pink-500/40 rounded-lg overflow-hidden cursor-pointer shadow-[0_0_20px_rgba(255,0,150,0.3)] hover:shadow-[0_0_40px_rgba(255,0,150,0.5)] transition-shadow"
      whileHover={{ scale: 1.05, rotate: -1 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 90, damping: 14 }}
      onClick={() => navigate(`/product/${product.slug}`)}
    >
      <div className="relative overflow-hidden aspect-square">
        <motion.img
          src={product.thumbnail_url || 'https://images.pexels.com/photos/1058728/pexels-photo-1058728.jpeg?auto=compress&cs=tinysrgb&w=800'}
          alt={product.name}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.08 }}
          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
        />
        {product.featured && (
          <motion.div
            className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full"
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            FEATURED
          </motion.div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-100 mb-2 line-clamp-2">{product.name}</h3>
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            ${(product.price_cents / 100).toFixed(2)}
          </span>
          <motion.button
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-semibold rounded-full hover:from-pink-600 hover:to-purple-600 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${product.slug}`);
            }}
          >
            View
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
