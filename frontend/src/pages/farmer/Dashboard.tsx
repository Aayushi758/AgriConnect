import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';
import { 
  TrendingUp, Package, ShoppingBag, IndianRupee, 
  ArrowUpRight, ArrowDownRight, Clock, Plus, BarChart2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { DollarSign } from 'lucide-react';

const StatCard = ({ title, value, icon, trend, color, iconBg, delay = 0 }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`p-6 rounded-3xl ${color} card-hover transition-all`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`${iconBg || 'bg-white/20'} p-3 rounded-2xl`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-sm font-medium ${color.includes('text-white') ? 'text-green-100' : trend.includes('+') ? 'text-green-600' : 'text-amber-600'}`}>
            {trend}
          </span>
        )}
      </div>
      <h3 className={`text-sm font-medium mb-1 ${color.includes('text-white') ? 'text-green-50' : 'text-gray-500'}`}>{title}</h3>
      <p className="text-3xl font-extrabold font-heading tracking-tight">{value}</p>
    </motion.div>
  );
};

const FarmerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardAPI.getFarmerDashboard();
        setData(res.data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-gray-200 rounded-2xl animate-pulse"></div>
          <div className="h-96 bg-gray-200 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-gray-900 font-heading"
          >
            Welcome back, {user?.full_name?.split(' ')[0] || 'Farmer'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 mt-1"
          >
            Here's what's happening with your farm today.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Link to="/farmer/products/new" className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md shadow-green-200 flex items-center">
            <Plus className="h-5 w-5 mr-1" /> Add Product
          </Link>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Revenue" 
          value={`₹${(data?.overview?.total_revenue || 0).toLocaleString()}`} 
          icon={<DollarSign className="h-6 w-6 text-white" />}
          trend="+12.5%"
          color="bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-green-500/30 text-white"
        />
        <StatCard 
          title="Active Orders" 
          value={( (data?.order_statuses?.pending || 0) + (data?.order_statuses?.confirmed || 0) ).toString()} 
          icon={<ShoppingBag className="h-6 w-6 text-emerald-600" />}
          trend="+5.2%"
          color="bg-white border border-gray-100 shadow-sm text-gray-900"
          iconBg="bg-emerald-50"
        />
        <StatCard 
          title="Total Products" 
          value={(data?.overview?.total_products || 0).toString()} 
          icon={<Package className="h-6 w-6 text-blue-600" />}
          color="bg-white border border-gray-100 shadow-sm text-gray-900"
          iconBg="bg-blue-50"
        />
        <StatCard 
          title="Low Stock Items" 
          value={(data?.overview?.out_of_stock || 0).toString()} 
          icon={<TrendingUp className="h-6 w-6 text-amber-600 transform rotate-180" />}
          trend={(data?.overview?.out_of_stock || 0) > 0 ? "Needs attention" : "All good"}
          color="bg-white border border-gray-100 shadow-sm text-gray-900"
          iconBg="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 font-heading flex items-center">
              <BarChart2 className="h-5 w-5 mr-2 text-green-600" /> Revenue Overview
            </h3>
            <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2 outline-none">
              <option>Last 6 months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.sales_trend?.map((item: any) => ({ name: item.date, value: item.revenue })) || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: any) => [`₹${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-900 font-heading mb-6">Top Performing Crops</h3>
          <div className="space-y-6">
            {(data?.product_inventory || []).slice(0, 5).map((product: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                    {idx + 1}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{product.product_name}</p>
                    <p className="text-xs text-gray-500">{product.total_sold} {product.unit} sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">₹{(product.total_revenue || 0).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <Link to="/farmer/products" className="text-green-600 text-sm font-medium hover:text-green-700 flex items-center justify-center w-full">
              View all products <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 font-heading">Recent Orders</h3>
          <Link to="/farmer/orders" className="text-sm font-medium text-green-600 hover:text-green-700">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-sm text-gray-500">
                <th className="px-6 py-3 font-medium text-left">Order ID</th>
                <th className="px-6 py-3 font-medium text-left">Customer</th>
                <th className="px-6 py-3 font-medium text-left">Date</th>
                <th className="px-6 py-3 font-medium text-left">Amount</th>
                <th className="px-6 py-3 font-medium text-left">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(data?.recent_orders || []).map((order: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-gray-400" /> {order.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{order.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
              {(!data?.recent_orders || data.recent_orders.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    No recent orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default FarmerDashboard;
