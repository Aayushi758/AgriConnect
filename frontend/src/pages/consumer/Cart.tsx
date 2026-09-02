import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext } from '../../context/CartContext';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, subtotal, clearCart } = useContext(CartContext);

  const deliveryFee = subtotal > 0 ? 50 : 0;
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    navigate('/consumer/checkout');
  };

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <h1 className="text-3xl font-bold text-gray-900 font-heading mb-8 flex items-center">
          <ShoppingBag className="w-8 h-8 mr-3 text-green-600" /> Your Cart
        </h1>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 font-heading mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Looks like you haven't added any fresh produce to your cart yet. Discover what local farmers are offering!
            </p>
            <Link 
              to="/consumer/marketplace" 
              className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-green-500/30 transition-all"
            >
              Start Shopping <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Cart Items */}
            <div className="lg:w-2/3">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 hidden sm:grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                
                <ul className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {cartItems.map((item) => (
                      <motion.li 
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-6"
                      >
                        <div className="flex flex-col sm:grid sm:grid-cols-12 gap-4 items-center">
                          
                          {/* Product Info */}
                          <div className="col-span-12 sm:col-span-6 flex items-center w-full">
                            <img src={item.primary_image ? (item.primary_image.startsWith('http') ? item.primary_image : `/uploads/${item.primary_image}`) : 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=400'} alt={item.name} className="w-20 h-20 object-cover rounded-xl shadow-sm" />
                            <div className="ml-4 flex-grow">
                              <Link to={`/consumer/product/${item.id}`} className="font-bold text-gray-900 hover:text-green-600 transition-colors line-clamp-2">
                                {item.name}
                              </Link>
                              <div className="text-sm text-gray-500 mt-1 flex items-center">
                                <span className="font-medium mr-2">{item.farmer_name || 'Farmer'}</span>
                                <span className="flex items-center text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                                  <MapPin className="w-3 h-3 mr-1" /> {item.location}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Quantity (Mobile layout adjustment) */}
                          <div className="col-span-12 sm:col-span-2 flex justify-between sm:justify-center items-center w-full mt-4 sm:mt-0">
                            <span className="sm:hidden text-sm font-medium text-gray-500">Quantity:</span>
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg">
                              <button 
                                onClick={() => updateQuantity(item.id, item.cart_quantity - 1)}
                                className="px-3 py-1 text-gray-600 hover:text-green-600 font-bold transition-colors"
                              >−</button>
                              <span className="px-2 w-8 text-center text-sm font-medium">{item.cart_quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, item.cart_quantity + 1)}
                                className="px-3 py-1 text-gray-600 hover:text-green-600 font-bold transition-colors"
                              >+</button>
                            </div>
                          </div>
                          
                          {/* Price */}
                          <div className="col-span-12 sm:col-span-2 flex justify-between sm:justify-center items-center w-full">
                            <span className="sm:hidden text-sm font-medium text-gray-500">Price:</span>
                            <span className="text-sm font-medium text-gray-900">₹{item.price}/{item.unit}</span>
                          </div>
                          
                          {/* Total & Remove */}
                          <div className="col-span-12 sm:col-span-2 flex justify-between sm:justify-end items-center w-full border-t sm:border-0 border-gray-100 pt-4 sm:pt-0 mt-2 sm:mt-0">
                            <span className="font-bold text-gray-900">₹{(item.price * item.cart_quantity).toFixed(2)}</span>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="lg:w-1/3">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 font-heading mb-6 border-b border-gray-100 pb-4">Order Summary</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal ({cartItems.length} items)</span>
                    <span className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span className="font-medium text-gray-900">₹{deliveryFee.toFixed(2)}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100 flex justify-between">
                    <span className="font-bold text-gray-900 text-lg">Total</span>
                    <span className="font-bold text-green-600 text-xl">₹{total.toFixed(2)}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate('/consumer/checkout')}
                  className="btn-accent w-full"
                >
                  Proceed to Checkout
                </button>
                
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <ShieldCheck className="w-4 h-4 mr-1 text-green-500" /> Secure payment processing
                </div>
              </div>
            </div>
            
          </div>
        )}
        
      </div>
    </div>
  );
};

export default Cart;
