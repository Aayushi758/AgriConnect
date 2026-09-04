import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle, Sprout, Loader2, Tractor, ShoppingBag } from 'lucide-react';
import { authAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'farmer' as 'farmer' | 'consumer',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authAPI.register(formData);
      login(response.data.access_token, response.data.user);
      
      if (response.data.user.role === 'farmer') {
        navigate('/farmer/dashboard');
      } else {
        navigate('/consumer/home');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm z-0"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 glass bg-white/90 p-10 rounded-2xl shadow-2xl relative z-10"
      >
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <Sprout className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900 font-heading">
            Join AgriConnect
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-green-600 hover:text-green-500 transition-colors">
              Log in here
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start"
            >
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div 
              className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
                formData.role === 'farmer' 
                  ? 'border-green-500 bg-green-50 text-green-700' 
                  : 'border-gray-200 bg-white text-gray-500 hover:border-green-300'
              }`}
              onClick={() => setFormData({ ...formData, role: 'farmer' })}
            >
              <Tractor className={`h-8 w-8 mb-2 ${formData.role === 'farmer' ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="font-medium">I'm a Farmer</span>
            </div>
            <div 
              className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
                formData.role === 'consumer' 
                  ? 'border-green-500 bg-green-50 text-green-700' 
                  : 'border-gray-200 bg-white text-gray-500 hover:border-green-300'
              }`}
              onClick={() => setFormData({ ...formData, role: 'consumer' })}
            >
              <ShoppingBag className={`h-8 w-8 mb-2 ${formData.role === 'consumer' ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="font-medium">I'm a Consumer</span>
            </div>
          </div>

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
                  placeholder="Ramesh Kumar"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
                  placeholder="ramesh@example.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white gradient-primary hover:shadow-lg hover:shadow-green-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
