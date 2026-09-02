import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { productsAPI } from '../../services/api';
import { ArrowLeft, Save, Upload, Loader2 } from 'lucide-react';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category_id: 1,
    description: '',
    price: '',
    unit: 'kg',
    available_quantity: '',
    min_order_quantity: '0.5',
    harvest_date: '',
    location: '',
    quality_grade: 'A',
    is_organic: false,
  });

  useEffect(() => {
    if (isEdit) {
      const fetchProduct = async () => {
        try {
          const res = await productsAPI.getById(Number(id));
          const p = res.data;
          setFormData({
            name: p.name || '',
            category_id: p.category_id || 1,
            description: p.description || '',
            price: p.price?.toString() || '',
            unit: p.unit || 'kg',
            available_quantity: p.available_quantity?.toString() || '',
            min_order_quantity: p.min_order_quantity?.toString() || '0.5',
            harvest_date: p.harvest_date || '',
            location: p.location || '',
            quality_grade: p.quality_grade || 'A',
            is_organic: p.is_organic || false,
          });
          setLoading(false);
        } catch (err) {
          setError('Failed to load product details');
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        available_quantity: parseFloat(formData.available_quantity),
        min_order_quantity: parseFloat(formData.min_order_quantity),
      };

      if (isEdit) {
        await productsAPI.update(Number(id), payload);
      } else {
        await productsAPI.create(payload);
      }
      navigate('/farmer/products');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/farmer/products" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-green-600 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Products
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 font-heading mb-6">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>

        {error && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                placeholder="e.g. Fresh Organic Tomatoes"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                placeholder="Describe your product..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                name="price"
                step="0.01"
                required
                min="1"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none transition-colors bg-white"
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="piece">Piece / Unit</option>
                <option value="dozen">Dozen</option>
                <option value="liter">Liter</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Available Quantity</label>
              <input
                type="number"
                name="available_quantity"
                step="0.1"
                required
                min="0"
                value={formData.available_quantity}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min. Order Quantity</label>
              <input
                type="number"
                name="min_order_quantity"
                step="0.1"
                min="0.1"
                value={formData.min_order_quantity}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Date</label>
              <input
                type="date"
                name="harvest_date"
                value={formData.harvest_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quality Grade</label>
              <select
                name="quality_grade"
                value={formData.quality_grade}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none transition-colors bg-white"
              >
                <option value="A">Grade A (Premium)</option>
                <option value="B">Grade B (Standard)</option>
                <option value="C">Grade C (Economy)</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-center">
              <input
                type="checkbox"
                id="is_organic"
                name="is_organic"
                checked={formData.is_organic}
                onChange={handleChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="is_organic" className="ml-2 block text-sm text-gray-900">
                This product is organically grown (certified or verified)
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/farmer/products')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md shadow-green-200 flex items-center disabled:opacity-70"
            >
              {saving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
              {isEdit ? 'Save Changes' : 'Publish Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
