import React, { useEffect, useState } from 'react';
import { productsAPI, inventoryAPI } from '../../services/api';
import { Package, TrendingUp, AlertTriangle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const Inventory = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddStock, setShowAddStock] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [addQty, setAddQty] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchInventory = async () => {
    try {
      const res = await productsAPI.getMyProducts();
      setProducts(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !addQty) return;
    
    setAdding(true);
    try {
      await inventoryAPI.addStock(selectedProductId, {
        quantity: parseFloat(addQty),
        notes: addNotes || 'Manual addition'
      });
      setShowAddStock(false);
      setAddQty('');
      setAddNotes('');
      setSelectedProductId(null);
      fetchInventory();
    } catch (error) {
      console.error("Failed to add stock", error);
    } finally {
      setAdding(false);
    }
  };

  const openAddStock = (id: number) => {
    setSelectedProductId(id);
    setShowAddStock(true);
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8">Loading inventory...</div>;
  }

  const lowStockCount = products.filter(p => p.available_quantity < 10).length;
  const outOfStockCount = products.filter(p => p.available_quantity === 0).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-heading">Inventory Management</h1>
          <p className="text-gray-500 mt-1">Track and update your product stock levels</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Products</p>
            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="bg-yellow-100 p-3 rounded-full mr-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Low Stock Items</p>
            <p className="text-2xl font-bold text-gray-900">{lowStockCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="bg-red-100 p-3 rounded-full mr-4">
            <TrendingUp className="h-6 w-6 text-red-600 transform rotate-180" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Out of Stock</p>
            <p className="text-2xl font-bold text-gray-900">{outOfStockCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU / ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img className="h-10 w-10 rounded-full object-cover" src={product.images && product.images.length > 0 ? product.images[0].url : 'https://images.unsplash.com/photo-1596199050105-6d9d047cb61c?w=150'} alt="" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500">₹{product.price} / {product.unit}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    PRD-{product.id.toString().padStart(4, '0')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.available_quantity} {product.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.available_quantity === 0 ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Out of Stock
                      </span>
                    ) : product.available_quantity < 10 ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => openAddStock(product.id)}
                      className="text-green-600 hover:text-green-900 flex items-center justify-end w-full"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stock Modal */}
      {showAddStock && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowAddStock(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAddStock}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                      <Plus className="h-6 w-6 text-green-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        Add Stock
                      </h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            required
                            value={addQty}
                            onChange={(e) => setAddQty(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g. 50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                          <input
                            type="text"
                            value={addNotes}
                            onChange={(e) => setAddNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g. Fresh harvest from East field"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={adding}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-70"
                  >
                    {adding ? 'Adding...' : 'Add Stock'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddStock(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
