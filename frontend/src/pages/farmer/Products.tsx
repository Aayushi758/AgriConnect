import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../../services/api';
import { Plus, Edit, Trash2, Package, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async () => {
    try {
      const res = await productsAPI.getMyProducts();
      setProducts(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch products", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(id);
        fetchProducts();
      } catch (error) {
        console.error("Failed to delete product", error);
      }
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8">Loading products...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-heading">My Products</h1>
          <p className="text-gray-500 mt-1">Manage your active listings and inventory</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-green-500 focus:border-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link to="/farmer/products/new" className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md shadow-green-200 flex items-center whitespace-nowrap">
            <Plus className="h-5 w-5 mr-1" /> Add Product
          </Link>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
          <p className="text-gray-500 mb-4">You haven't added any products yet, or none match your search.</p>
          <Link to="/farmer/products/new" className="text-green-600 font-medium hover:text-green-700">
            Add your first product &rarr;
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img className="h-10 w-10 rounded-full object-cover" src={product.images && product.images.length > 0 ? product.images[0].url : 'https://images.unsplash.com/photo-1596199050105-6d9d047cb61c?w=150'} alt="" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{product.price} / {product.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.available_quantity} {product.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.available_quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.available_quantity > 0 ? 'Active' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <Link to={`/farmer/products/edit/${product.id}`} className="text-indigo-600 hover:text-indigo-900">
                          <Edit className="h-5 w-5" />
                        </Link>
                        <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
