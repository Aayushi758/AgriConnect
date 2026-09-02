import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI } from '../../services/api';
import { MapPin, Star, ShoppingCart, Leaf, ChevronLeft, ShieldCheck, Clock, Truck, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { CartContext } from '../../context/CartContext';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart } = React.useContext(CartContext);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await productsAPI.getById(Number(id));
        setProduct(res.data);
      } catch (err) {
        console.error("Failed to load product", err);
        // Fallback mock
        setProduct({
          id: Number(id),
          name: 'Fresh Organic Tomatoes',
          price: 40,
          unit: 'kg',
          available_quantity: 100,
          location: 'Pune, Maharashtra',
          is_organic: true,
          description: 'Freshly harvested, hand-picked organic tomatoes directly from our family farm. Grown without any chemical pesticides or synthetic fertilizers. Perfect for salads, curries, and sauces.',
          category: { name: 'Vegetables' },
          farmer: {
            user: { full_name: 'Ramesh Kumar' },
            rating: 4.8,
            years_farming: 12
          },
          images: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 font-heading">Product not found</h2>
        <button onClick={() => navigate('/consumer/marketplace')} className="mt-4 text-green-600 hover:underline">
          Return to Marketplace
        </button>
      </div>
    );
  }

  const imageUrl = product.images?.length > 0 
    ? (product.images[0].image_url.startsWith('http') ? product.images[0].image_url : `/uploads/${product.images[0].image_url}`)
    : 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=800';

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-green-600 font-medium mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" /> Back to results
        </button>
        
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            
            {/* Image Gallery */}
            <div className="lg:w-1/2 p-6 lg:p-10 bg-gray-50 flex items-center justify-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-[4/3] md:aspect-square w-full bg-gray-50 flex items-center justify-center overflow-hidden rounded-2xl"
              >
                <img 
                  src={imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover shadow-lg"
                />
              </motion.div>
            </div>
            
            {/* Details */}
            <div className="lg:w-1/2 p-6 lg:p-10">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  {product.category?.name || 'Produce'}
                </span>
                {product.is_organic && (
                  <span className="text-xs font-bold uppercase tracking-wider text-white bg-green-500 px-3 py-1 rounded-full flex items-center shadow-sm">
                    <Leaf className="w-3 h-3 mr-1" /> Organic
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-heading mb-2">
                {product.name}
              </h1>
              
              <div className="flex items-center text-sm text-gray-500 mb-6">
                <span className="flex items-center mr-4">
                  <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                  <span className="font-medium text-gray-700">{product.farmer?.rating || '4.5'}</span>
                  <span className="ml-1">(120 reviews)</span>
                </span>
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                  {product.location}
                </span>
              </div>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 font-heading">₹{product.price}</span>
                <span className="text-lg text-gray-500 ml-1">/{product.unit}</span>
              </div>
              
              <p className="text-gray-600 leading-relaxed mb-8">
                {product.description || `Freshly harvested ${product.name.toLowerCase()} direct from local farms. 
                Rich in flavor and nutrients, perfectly suitable for your daily cooking needs.`}
              </p>
              
              {/* Order Actions */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                  <div className="mb-4 sm:mb-0">
                    <p className="text-sm font-medium text-gray-700 mb-2">Quantity ({product.unit})</p>
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl w-32">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-2 text-gray-600 hover:text-green-600 font-bold transition-colors"
                      >−</button>
                      <input 
                        type="number" 
                        value={quantity}
                        readOnly
                        className="w-full text-center font-medium bg-transparent focus:outline-none"
                      />
                      <button 
                        onClick={() => setQuantity(Math.min(product.available_quantity, quantity + 1))}
                        className="px-4 py-2 text-gray-600 hover:text-green-600 font-bold transition-colors"
                      >+</button>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Total Price</p>
                    <p className="text-2xl font-bold text-gray-900 font-heading">₹{(product.price * quantity).toFixed(2)}</p>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mb-4 flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                  {product.available_quantity} {product.unit} available in stock
                </p>
                
                <button 
                  onClick={() => {
                    addToCart({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      unit: product.unit,
                      available_quantity: product.available_quantity,
                      location: product.location,
                      is_organic: product.is_organic,
                      category_name: product.category?.name,
                      farmer_name: product.farmer?.user?.full_name,
                      primary_image: product.images?.[0]?.image_url,
                      rating: product.farmer?.rating
                    }, quantity);
                    setAdded(true);
                    setTimeout(() => setAdded(false), 2000);
                  }}
                  className={`w-full py-4 text-lg flex items-center justify-center transition-all ${added ? 'btn-primary bg-green-700' : 'btn-accent'}`}
                >
                  {added ? (
                    <><CheckCircle className="w-5 h-5 mr-2" /> Added to Cart</>
                  ) : (
                    <><ShoppingCart className="w-5 h-5 mr-2" /> Add to Cart</>
                  )}
                </button>
              </div>
              
              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600 mr-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Direct from Farmer</p>
                    <p className="text-xs text-gray-500 mt-0.5">100% genuine source</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-orange-50 p-2 rounded-lg text-orange-600 mr-3">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Fast Delivery</p>
                    <p className="text-xs text-gray-500 mt-0.5">Farm to door tracking</p>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
          
          {/* Farmer Info */}
          <div className="bg-white border-t border-gray-100 p-6 lg:p-10">
            <h3 className="text-xl font-bold text-gray-900 font-heading mb-6">About the Farmer</h3>
            <div className="flex items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-2xl font-bold uppercase mr-4">
                {product.farmer?.user?.full_name?.charAt(0) || 'F'}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">{product.farmer?.user?.full_name || 'Verified Farmer'}</h4>
                <p className="text-gray-500 text-sm mb-1">{product.location}</p>
                <div className="flex items-center text-sm">
                  <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                  <span className="font-medium mr-3">{product.farmer?.rating || '4.5'}</span>
                  <span className="text-gray-400">|</span>
                  <span className="ml-3 text-gray-600">{product.farmer?.years_farming || 5}+ years farming</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
