import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../../services/api';
import { Package, Clock, CheckCircle, Truck, MapPin, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const ConsumerOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await ordersAPI.getMyOrders();
      setOrders(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch orders", error);
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed': return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'preparing': return <Package className="h-5 w-5 text-indigo-500" />;
      case 'out_for_delivery': return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center">Loading your orders...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <h1 className="text-3xl font-bold text-gray-900 font-heading mb-8 flex items-center">
          <Package className="w-8 h-8 mr-3 text-green-600" /> My Orders
        </h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 font-heading mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              You haven't placed any orders yet. Discover fresh produce directly from local farmers!
            </p>
            <Link 
              to="/consumer/marketplace" 
              className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-green-500/30 transition-all"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-5 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Order #{order.order_number}</p>
                    <p className="text-sm text-gray-700 font-medium">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Total</p>
                      <p className="text-sm font-bold text-gray-900">₹{order.total.toFixed(2)}</p>
                    </div>
                    <Link 
                      to={`/consumer/track/${order.id}`}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-green-600 hover:bg-green-50 transition-colors shadow-sm"
                    >
                      Track Order
                    </Link>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-2/3">
                      <h4 className="font-medium text-gray-900 mb-4">Items</h4>
                      <div className="space-y-4">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl mr-4">
                                🥬
                              </div>
                              <div>
                                <Link to={`/consumer/product/${item.product_id}`} className="font-bold text-gray-900 hover:text-green-600 transition-colors">
                                  {item.product_name}
                                </Link>
                                <p className="text-sm text-gray-500">Qty: {item.quantity} {item.unit}</p>
                              </div>
                            </div>
                            <div className="font-medium text-gray-900">
                              ₹{item.total_price.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="md:w-1/3 bg-gray-50 rounded-xl p-5 border border-gray-100">
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Order Status</p>
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-full border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-2 text-sm font-semibold capitalize">{order.status.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Delivery To</p>
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                            {order.delivery_address || 'Address not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumerOrders;
