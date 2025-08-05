import React, { useState } from 'react';
import { X, Edit, Save } from 'lucide-react';
import apiService from '../services/api';

const UpdatePosition = ({ position, onClose, onUpdated }) => {
  const [formData, setFormData] = useState({
    quantity: position.quantity,
    purchase_price: position.purchase_price,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare the data for the API
      const updateData = {
        quantity: parseFloat(formData.quantity),
        purchase_price: parseFloat(formData.purchase_price),
      };

      await apiService.updatePosition(position.id, updateData);
      onUpdated();
    } catch (err) {
      console.error('Error updating position:', err);
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === 'object') {
          const errorMessages = Object.entries(errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          setError(errorMessages);
        } else {
          setError('Failed to update position. Please try again.');
        }
      } else {
        setError('Failed to update position. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Edit className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Update Position</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stock Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-900">{position.stock.symbol}</div>
          <div className="text-xs text-gray-500">{position.stock.name}</div>
          <div className="text-xs text-gray-600 mt-1">
            Current Value: {formatCurrency(position.current_value)}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm whitespace-pre-line">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              step="0.00001"
              min="0"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Number of shares"
              value={formData.quantity}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="purchase_price" className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Price
            </label>
            <input
              id="purchase_price"
              name="purchase_price"
              type="number"
              step="0.01"
              min="0"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Price per share"
              value={formData.purchase_price}
              onChange={handleChange}
            />
          </div>

          {/* Summary */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-2">Updated Position Summary</div>
            <div className="space-y-1 text-xs text-blue-800">
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span>{parseFloat(formData.quantity || 0).toLocaleString()} shares</span>
              </div>
              <div className="flex justify-between">
                <span>Purchase Price:</span>
                <span>{formatCurrency(parseFloat(formData.purchase_price || 0))}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total Cost:</span>
                <span>{formatCurrency((parseFloat(formData.quantity || 0)) * (parseFloat(formData.purchase_price || 0)))}</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Position
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePosition;