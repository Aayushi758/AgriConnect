import React, { useEffect, useState } from 'react';
import { ordersAPI } from '../../services/api';
import { ShoppingBag, Search, Clock, CheckCircle, Package, Truck, XCircle, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const FarmerOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchOrders = async () => {
    try {
      const res = await ordersAPI.getFarmerOrders();
      setOrders(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch orders", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      await ordersAPI.updateStatus(orderId, { status });
      fetchOrders();
    } catch (error) {
      console.error("Failed to update order status", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed': return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'preparing': return <Package className="h-5 w-5 text-indigo-500" />;
      case 'ready_for_pickup': return <Package className="h-5 w-5 text-orange-500" />;
      case 'out_for_delivery': return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.order_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || o.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8">Loading orders...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-heading">Order Management</h1>
          <p className="text-gray-500 mt-1">View and process your incoming orders</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by Order ID..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-green-500 focus:border-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {['all', 'pending', 'confirmed', 'preparing', 'ready_for_pickup', 'delivered', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap capitalize transition-colors ${
                  filter === status 
                    ? 'bg-green-600 text-white shadow-md shadow-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
          <p className="text-gray-500">You don't have any orders matching the current filter.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-4 bg-gray-50/50">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-gray-900 text-lg">{order.order_number}</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold capitalize flex items-center gap-1 bg-white border shadow-sm">
                      {getStatusIcon(order.status)}
                      <span className="ml-1 text-gray-700">{order.status.replace(/_/g, ' ')}</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Placed on {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right mr-4">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-bold text-xl text-green-700">₹{order.total}</p>
                  </div>
                  
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      Update Status <ChevronDown className="h-4 w-4" />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-2">
                      <button onClick={() => handleUpdateStatus(order.id, 'confirmed')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Mark Confirmed</button>
                      <button onClick={() => handleUpdateStatus(order.id, 'preparing')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Mark Preparing</button>
                      <button onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Mark Ready for Pickup</button>
                      <button onClick={() => handleUpdateStatus(order.id, 'cancelled')} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Cancel Order</button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-4">
                    <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="font-medium text-gray-800">{item.product_name}</p>
                          <p className="text-sm text-gray-500">{item.quantity} {item.unit} × ₹{item.unit_price}</p>
                        </div>
                        <p className="font-semibold text-gray-900">₹{item.total_price}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 h-full">
                    <h4 className="font-medium text-gray-900 mb-3">Delivery Information</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {order.delivery_address || "Customer will pick up"}
                    </p>
                    {order.notes && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Customer Notes</p>
                        <p className="text-sm text-gray-700 italic">"{order.notes}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmerOrders;
