import React, { useContext } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// Layouts
import Navbar from './components/layout/Navbar';
import AIAssistant from './components/AIAssistant';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import FarmerDashboard from './pages/farmer/Dashboard';
import FarmerProducts from './pages/farmer/Products';
import FarmerProductForm from './pages/farmer/ProductForm';
import FarmerInventory from './pages/farmer/Inventory';
import FarmerOrders from './pages/farmer/Orders';
import FarmerAIPortal from './pages/farmer/AIPortal';
import Messages from './pages/Messages';
import ConsumerHome from './pages/consumer/Home';
import Marketplace from './pages/consumer/Marketplace';
import ProductDetails from './pages/consumer/ProductDetails';
import Cart from './pages/consumer/Cart';
import Checkout from './pages/consumer/Checkout';
import ConsumerOrders from './pages/consumer/Orders';
import OrderTracking from './pages/consumer/OrderTracking';
import Support from './pages/Support';

const ProtectedRoute = ({ role }: { role?: 'farmer' | 'consumer' }) => {
  const { isAuthenticated, isLoading, user } = useContext(AuthContext);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'farmer' ? '/farmer/dashboard' : '/consumer/home'} replace />;
  }

  return <Outlet />;
};

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        <Outlet />
      </main>
      <AIAssistant />
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Protected Routes */}
      <Route element={<Layout />}>
        {/* Shared Protected Routes (Both Farmer & Consumer) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/support" element={<Support />} />
          <Route path="/messages" element={<Messages />} />
        </Route>

        {/* Farmer Routes */}
        <Route element={<ProtectedRoute role="farmer" />}>
          <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
          <Route path="/farmer/products" element={<FarmerProducts />} />
          <Route path="/farmer/products/new" element={<FarmerProductForm />} />
          <Route path="/farmer/products/edit/:id" element={<FarmerProductForm />} />
          <Route path="/farmer/inventory" element={<FarmerInventory />} />
          <Route path="/farmer/orders" element={<FarmerOrders />} />
          <Route path="/farmer/ai-portal" element={<FarmerAIPortal />} />
        </Route>

        {/* Consumer Routes */}
        <Route element={<ProtectedRoute role="consumer" />}>
          <Route path="/consumer/home" element={<ConsumerHome />} />
          <Route path="/consumer/marketplace" element={<Marketplace />} />
          <Route path="/consumer/product/:id" element={<ProductDetails />} />
          <Route path="/consumer/cart" element={<Cart />} />
          <Route path="/consumer/checkout" element={<Checkout />} />
          <Route path="/consumer/orders" element={<ConsumerOrders />} />
          <Route path="/consumer/track/:id" element={<OrderTracking />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
