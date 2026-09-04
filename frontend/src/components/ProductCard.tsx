import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, ShoppingCart, Leaf, CheckCircle, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { CartContext } from '../context/CartContext';

export interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  available_quantity: number;
  location: string;
  is_organic: boolean;
  category_name?: string;
  farmer_name?: string;
  primary_image?: string;
  rating?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: () => void;
}

const FALLBACK_IMAGES: Record<string, string> = {
  'Mango': 'https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=400',
  'Onion': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?q=80&w=400',
  'Potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=400',
  'Tomato': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=400',
};

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const defaultFallback = 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400';
  const imageUrl = product.primary_image
    ? (product.primary_image.startsWith('http') ? product.primary_image : `/uploads/${product.primary_image}`)
    : (FALLBACK_IMAGES[product.name] || defaultFallback);

  const { addToCart } = React.useContext(CartContext);
  const [added, setAdded] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-3xl shadow-soft border border-gray-100/60 overflow-hidden flex flex-col h-full hover:shadow-xl hover:border-green-100 transition-all group"
    >
      <Link to={`/consumer/product/${product.id}`} className="relative aspect-[4/3] block overflow-hidden bg-gray-50 p-2">
        <div className="absolute inset-2 rounded-2xl overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {product.is_organic && (
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-green-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-sm border border-white/50">
              <Leaf className="w-3 h-3 mr-1.5" /> Organic
            </div>
          )}
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md text-gray-800 text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center shadow-sm border border-white/50">
            <Star className="w-3.5 h-3.5 text-yellow-500 mr-1.5 fill-current" />
            {product.rating?.toFixed(1) || '4.5'}
          </div>
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-grow relative">
        <div className="flex justify-between items-start mb-1">
          <div className="w-full">
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-[11px] text-green-600 font-bold uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded-md inline-block">
                {product.category_name || 'Fresh Produce'}
              </p>
              <p className="text-[11px] text-gray-400 font-medium flex items-center">
                <Package className="w-3 h-3 mr-1" /> {product.available_quantity > 0 ? `${product.available_quantity} available` : 'Out of stock'}
              </p>
            </div>

            <Link to={`/consumer/product/${product.id}`}>
              <h3 className="font-extrabold text-gray-900 text-xl font-heading leading-tight hover:text-green-600 transition-colors line-clamp-1">
                {product.name}
              </h3>
            </Link>
          </div>
        </div>

        <p className="text-gray-500 text-sm flex items-center mb-5 font-medium mt-1">
          <MapPin className="w-4 h-4 mr-1 text-gray-400" /> {product.location || 'Local Farm'}
          {product.farmer_name && <span className="mx-2 text-gray-300">•</span>}
          {product.farmer_name && <span className="text-gray-600">{product.farmer_name}</span>}
        </p>

        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-baseline">
            <span className="text-2xl font-extrabold text-gray-900 font-heading">₹{product.price}</span>
            <span className="text-gray-500 text-sm ml-1 font-medium">/{product.unit}</span>
          </div>

          <button
            disabled={product.available_quantity <= 0}
            onClick={(e) => {
              e.preventDefault();
              addToCart(product, 1);
              setAdded(true);
              setTimeout(() => setAdded(false), 2000);
            }}
            className={`
              relative overflow-hidden p-3 rounded-2xl font-bold transition-all flex items-center justify-center min-w-[3rem]
              ${product.available_quantity <= 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : added
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                  : 'bg-green-50 text-green-700 hover:bg-green-500 hover:text-white hover:shadow-lg hover:shadow-green-500/20'
              }
            `}
            title={product.available_quantity <= 0 ? "Out of stock" : "Add to cart"}
          >
            {added ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <CheckCircle className="w-5 h-5" />
              </motion.div>
            ) : (
              <ShoppingCart className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
