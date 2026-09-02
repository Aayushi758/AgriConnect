import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { ordersAPI } from '../../services/api';
import { CreditCard, MapPin, Truck, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, subtotal, clearCart } = useContext(CartContext);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    delivery_address: '123 Smart City Road, Pune, Maharashtra 411001',
    payment_method: 'cod',
    notes: ''
  });

  const deliveryFee = subtotal > 0 ? 50 : 0;
  const total = subtotal + deliveryFee;

  // Redirect if cart is empty
  if (cartItems.length === 0 && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Link to="/consumer/marketplace" className="text-green-600 font-medium hover:underline">
          Go back to Marketplace
        </Link>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.delivery_address) {
      setError("Delivery address is required");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.cart_quantity
        })),
        delivery_address: formData.delivery_address,
        payment_method: formData.payment_method,
        notes: formData.notes
      };

      const res = await ordersAPI.create(payload);
      clearCart();
      // Navigate to order tracking page
      navigate(`/consumer/track/${res.data.id}`);
    } catch (err: any) {
      console.error("Order failed", err);
      setError(err.response?.data?.detail || "Failed to place order. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-6">
          <Link to="/consumer/cart" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-green-600 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Cart
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 font-heading mb-8 flex items-center">
          Checkout
        </h1>

        {error && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="flex flex-col lg:flex-row gap-8">
          
          {/* Checkout Details */}
          <div className="lg:w-2/3 space-y-6">
            
            {/* Delivery Address */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 font-heading mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-green-600" /> Delivery Address
              </h3>
              <textarea
                name="delivery_address"
                rows={3}
                required
                value={formData.delivery_address}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                placeholder="Enter your full delivery address..."
              ></textarea>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 font-heading mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-green-600" /> Payment Method
              </h3>
              <div className="space-y-3">
                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${formData.payment_method === 'cod' ? 'border-green-500 bg-green-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="cod"
                    checked={formData.payment_method === 'cod'}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <div className="ml-3 flex flex-col">
                    <span className="font-medium text-gray-900">Cash on Delivery</span>
                    <span className="text-xs text-gray-500">Pay when your order arrives</span>
                  </div>
                </label>
                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${formData.payment_method === 'upi' ? 'border-green-500 bg-green-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="upi"
                    checked={formData.payment_method === 'upi'}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <div className="ml-3 flex flex-col">
                    <span className="font-medium text-gray-900">UPI (GPay, PhonePe, Paytm)</span>
                    <span className="text-xs text-gray-500">Scan QR or enter UPI ID</span>
                  </div>
                </label>
                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${formData.payment_method === 'card' ? 'border-green-500 bg-green-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="card"
                    checked={formData.payment_method === 'card'}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    disabled
                  />
                  <div className="ml-3 flex flex-col opacity-50">
                    <span className="font-medium text-gray-900">Credit / Debit Card (Coming Soon)</span>
                    <span className="text-xs text-gray-500">Currently unavailable</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Delivery Notes */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 font-heading mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-green-600" /> Delivery Instructions
              </h3>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                placeholder="E.g. Leave at the front gate, call upon arrival..."
              />
            </div>

          </div>
          
          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 font-heading mb-6 border-b border-gray-100 pb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700 truncate mr-2">{item.cart_quantity}x {item.name}</span>
                    <span className="font-medium text-gray-900 whitespace-nowrap">₹{(item.price * item.cart_quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mb-6 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
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
                type="submit"
                disabled={loading}
                className="btn-accent w-full mt-6 text-lg disabled:opacity-70 disabled:hover:-translate-y-0 disabled:shadow-none"
              >
                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : `Place Order (₹${total.toFixed(2)})`}
              </button>
              
              <div className="flex items-center justify-center text-sm text-gray-500">
                <ShieldCheck className="w-4 h-4 mr-1 text-green-500" /> Secure and encrypted Checkout
              </div>
            </div>
          </div>
          
        </form>
      </div>
    </div>
  );
};

export default Checkout;
