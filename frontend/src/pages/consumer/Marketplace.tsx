import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, Loader2, X } from 'lucide-react';
import { productsAPI } from '../../services/api';
import ProductCard, { Product } from '../../components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';

const Marketplace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || '');
  const [isOrganic, setIsOrganic] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await productsAPI.getCategories();
        setCategories(res.data);

        // If category was in URL by name, try to match it
        if (initialCategory && isNaN(Number(initialCategory))) {
          const match = res.data.find((c: any) => c.name.toLowerCase() === initialCategory.toLowerCase());
          if (match) {
            setSelectedCategory(match.id.toString());
          }
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategories();
  }, [initialCategory]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (search) params.search = search;
        if (selectedCategory && !isNaN(Number(selectedCategory))) params.category_id = selectedCategory;
        if (isOrganic) params.is_organic = true;

        const res = await productsAPI.getMarketplace(params);
        setProducts(res.data);
      } catch (err) {
        console.error("Failed to load products", err);
        // Fallback mock data if API fails
        setProducts([
          { id: 1, name: 'Fresh Organic Tomatoes', price: 40, unit: 'kg', available_quantity: 100, location: 'Pune, MH', is_organic: true, category_name: 'Vegetables', farmer_name: 'Ramesh K.' },
          { id: 2, name: 'Premium Potatoes', price: 25, unit: 'kg', available_quantity: 500, location: 'Nashik, MH', is_organic: false, category_name: 'Vegetables', farmer_name: 'Suresh P.' },
          { id: 3, name: 'Alphonso Mangoes', price: 600, unit: 'dozen', available_quantity: 50, location: 'Ratnagiri, MH', is_organic: true, category_name: 'Fruits', farmer_name: 'Vijay M.' },
          { id: 4, name: 'Red Onions', price: 35, unit: 'kg', available_quantity: 300, location: 'Lasalgaon, MH', is_organic: false, category_name: 'Vegetables', farmer_name: 'Dinesh S.' },
          { id: 5, name: 'Basmati Rice', price: 120, unit: 'kg', available_quantity: 1000, location: 'Karnal, HR', is_organic: true, category_name: 'Grains & Pulses', farmer_name: 'Harpreet Singh' },
          { id: 6, name: 'Green Chillies', price: 60, unit: 'kg', available_quantity: 40, location: 'Guntur, AP', is_organic: false, category_name: 'Vegetables', farmer_name: 'Rao G.' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(() => {
      fetchProducts();
    }, 500);

    return () => clearTimeout(timer);
  }, [search, selectedCategory, isOrganic]);

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header & Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-heading">Marketplace</h1>
            <p className="text-gray-500 mt-1">Direct from farms to your doorstep.</p>
          </div>

          <div className="w-full md:w-auto flex items-center gap-2">
            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search crops, vegetables, fruits..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none shadow-sm transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl border transition-colors flex items-center justify-center ${showFilters ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Filters Sidebar */}
          <AnimatePresence>
            {(showFilters || window.innerWidth >= 1024) && (
              <motion.div
                initial={{ opacity: 0, width: 0, x: -20 }}
                animate={{ opacity: 1, width: 'auto', x: 0 }}
                exit={{ opacity: 0, width: 0, x: -20 }}
                className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}
              >
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                  <div className="flex justify-between items-center mb-6 lg:hidden">
                    <h3 className="font-bold text-gray-900 font-heading">Filters</h3>
                    <button onClick={() => setShowFilters(false)}><X className="h-5 w-5 text-gray-400" /></button>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-bold text-gray-900 font-heading mb-3 flex items-center">
                      <Filter className="h-4 w-4 mr-2 text-green-600" /> Categories
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === ''}
                          onChange={() => setSelectedCategory('')}
                          className="text-green-600 focus:ring-green-500 rounded-full border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">All Products</span>
                      </label>
                      {categories.map((cat) => (
                        <label key={cat.id} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="category"
                            checked={selectedCategory === cat.id.toString()}
                            onChange={() => setSelectedCategory(cat.id.toString())}
                            className="text-green-600 focus:ring-green-500 rounded-full border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6 pt-6 border-t border-gray-100">
                    <h4 className="font-bold text-gray-900 font-heading mb-3">Preferences</h4>
                    <label className="flex items-center cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={isOrganic}
                          onChange={(e) => setIsOrganic(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${isOrganic ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isOrganic ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors">Organic Only</span>
                    </label>
                  </div>

                  {(selectedCategory || isOrganic || search) && (
                    <div className="pt-6 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setSearch('');
                          setSelectedCategory('');
                          setIsOrganic(false);
                        }}
                        className="w-full text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 py-2 rounded-lg transition-colors"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Product Grid */}
          <div className="flex-grow">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-8 w-8 text-green-500 animate-spin mb-4" />
                <p className="text-gray-500">Fetching fresh produce...</p>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}

                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 font-heading mb-2">No products found</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  We couldn't find any products matching your current filters. Try adjusting your search criteria or clearing filters.
                </p>
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('');
                    setIsOrganic(false);
                  }}
                  className="mt-6 text-green-600 font-medium hover:text-green-700 bg-green-50 px-6 py-2 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Marketplace;
