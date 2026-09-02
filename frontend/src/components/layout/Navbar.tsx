import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, LogOut, Sprout } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const { totalItems } = useContext(CartContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLink = ({ to, children, icon: Icon, badge }: any) => {
    const isActive = location.pathname.startsWith(to);
    return (
      <Link 
        to={to} 
        className={`relative flex items-center px-1 py-2 text-sm font-medium transition-colors link-underline ${isActive ? 'text-green-600 active' : 'text-gray-600 hover:text-green-600'}`}
        onClick={() => setIsMenuOpen(false)}
      >
        {Icon && <Icon className="w-4 h-4 mr-1.5" />}
        {children}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-3 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full shadow-sm">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  const MobileNavLink = ({ to, children, icon: Icon, badge }: any) => {
    const isActive = location.pathname.startsWith(to);
    return (
      <Link 
        to={to} 
        className={`flex items-center w-full px-4 py-3 text-base font-medium rounded-xl transition-all ${isActive ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50 hover:text-green-600'}`}
        onClick={() => setIsMenuOpen(false)}
      >
        {Icon && <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />}
        <span className="flex-grow">{children}</span>
        {badge !== undefined && badge > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'glass-nav py-2' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl px-4 py-2">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer transform hover:scale-105 transition-transform" onClick={() => navigate(user?.role === 'farmer' ? '/farmer/dashboard' : '/consumer/home')}>
            <div className="bg-gradient-to-br from-green-400 to-green-600 p-1.5 rounded-xl mr-2 shadow-sm shadow-green-500/30">
              <Sprout className="h-6 w-6 text-white" />
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-gray-900">
              Kisan<span className="text-transparent bg-clip-text gradient-primary">Setu</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-6">
            {isAuthenticated && user ? (
              <>
                {user.role === 'consumer' && (
                  <>
                    <NavLink to="/consumer/marketplace">Marketplace</NavLink>
                    <NavLink to="/consumer/orders">Orders</NavLink>
                    <NavLink to="/messages">Messages</NavLink>
                    <NavLink to="/support">Support</NavLink>
                    <NavLink to="/consumer/cart" icon={ShoppingCart} badge={totalItems}>Cart</NavLink>
                  </>
                )}
                {user.role === 'farmer' && (
                  <>
                    <NavLink to="/farmer/dashboard">Dashboard</NavLink>
                    <NavLink to="/farmer/products">Products</NavLink>
                    <NavLink to="/farmer/inventory">Inventory</NavLink>
                    <NavLink to="/farmer/orders">Orders</NavLink>
                    <NavLink to="/farmer/ai-portal">AI Portal</NavLink>
                    <NavLink to="/messages">Messages</NavLink>
                    <NavLink to="/support">Support</NavLink>
                  </>
                )}
                
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                  <div className="flex items-center gap-2 bg-gray-50 py-1.5 px-3 rounded-full border border-gray-100">
                    <User className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm text-gray-700">{user.full_name}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-gray-600 font-medium hover:text-green-600 transition-colors">Log in</Link>
                <Link to="/register" className="btn-accent">
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="text-gray-700 p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6 text-gray-900" /> : <Menu className="h-6 w-6 text-gray-900" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden absolute top-[100%] left-0 w-full px-4 pt-2 pb-4"
          >
            <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-white/50 p-4 flex flex-col space-y-1">
              {isAuthenticated && user ? (
                <>
                  <div className="px-4 py-3 mb-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 flex items-center space-x-3">
                    <div className="bg-white p-2 rounded-full shadow-sm">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{user.role}</p>
                      <p className="font-bold text-gray-900">{user.full_name}</p>
                    </div>
                  </div>
                  
                  {user.role === 'consumer' && (
                    <>
                      <MobileNavLink to="/consumer/marketplace">Marketplace</MobileNavLink>
                      <MobileNavLink to="/consumer/cart" badge={totalItems}>Cart</MobileNavLink>
                      <MobileNavLink to="/consumer/orders">My Orders</MobileNavLink>
                      <MobileNavLink to="/messages">Messages</MobileNavLink>
                      <MobileNavLink to="/support">Support</MobileNavLink>
                    </>
                  )}
                  
                  {user.role === 'farmer' && (
                    <>
                      <MobileNavLink to="/farmer/dashboard">Dashboard</MobileNavLink>
                      <MobileNavLink to="/farmer/products">Products</MobileNavLink>
                      <MobileNavLink to="/farmer/inventory">Inventory</MobileNavLink>
                      <MobileNavLink to="/farmer/orders">Orders</MobileNavLink>
                      <MobileNavLink to="/farmer/ai-portal">AI Portal</MobileNavLink>
                      <MobileNavLink to="/messages">Messages</MobileNavLink>
                      <MobileNavLink to="/support">Support</MobileNavLink>
                    </>
                  )}
                  
                  <div className="pt-2 mt-2 border-t border-gray-100">
                    <button 
                      onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                      className="w-full flex items-center px-4 py-3 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2 pt-2">
                  <Link to="/login" className="block w-full text-center bg-gray-50 text-gray-700 font-medium py-3 rounded-xl" onClick={() => setIsMenuOpen(false)}>Log in</Link>
                  <Link to="/register" className="btn-accent w-full" onClick={() => setIsMenuOpen(false)}>Sign up</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
