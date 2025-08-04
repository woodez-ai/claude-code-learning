import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import apiService from '../services/api';

const AddPosition = ({ portfolioId, onClose, onAdded }) => {
  const [formData, setFormData] = useState({
    stock_symbol: '',
    quantity: '',
    purchase_price: '',
    purchase_date: new Date().toISOString().split('T')[0],
  });
  const [stockInfo, setStockInfo] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stockError, setStockError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleStockSearch = async () => {
    if (!formData.stock_symbol.trim()) return;

    try {
      setSearchLoading(true);
      setStockError('');
      const stock = await apiService.searchStock(formData.stock_symbol);
      setStockInfo(stock);
      
      // Auto-fill purchase price with current price if available
      if (stock.current_price && !formData.purchase_price) {
        setFormData(prev => ({
          ...prev,
          purchase_price: stock.current_price
        }));
      }
    } catch (err) {
      setStockError('Stock not found. Please check the symbol.');
      setStockInfo(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSymbolKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleStockSearch();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiService.addPositionToPortfolio(portfolioId, formData);
      onAdded();
    } catch (err) {
      setError('Failed to add position');
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Add New Position
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Stock Symbol Search */}
          <div>
            <label htmlFor="stock_symbol" className="block text-sm font-medium text-gray-700">
              Stock Symbol *
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                id="stock_symbol"
                name="stock_symbol"
                required
                className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm uppercase"
                placeholder="e.g., AAPL, GOOGL, MSFT"
                value={formData.stock_symbol}
                onChange={handleChange}
                onKeyPress={handleSymbolKeyPress}
              />
              <button
                type="button"
                onClick={handleStockSearch}
                disabled={searchLoading || !formData.stock_symbol.trim()}
                className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                <Search className={`h-4 w-4 ${searchLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {stockError && (
              <p className="mt-1 text-sm text-red-600">{stockError}</p>
            )}
            {stockInfo && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      {stockInfo.symbol} - {stockInfo.name}
                    </p>
                    {stockInfo.exchange && (
                      <p className="text-xs text-green-700">
                        Exchange: {stockInfo.exchange}
                      </p>
                    )}
                  </div>
                  {stockInfo.current_price && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-900">
                        {formatCurrency(stockInfo.current_price)}
                      </p>
                      <p className="text-xs text-green-700">Current Price</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
              Quantity *
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              required
              min="0"
              step="0.0001"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Number of shares"
              value={formData.quantity}
              onChange={handleChange}
            />
          </div>

          {/* Purchase Price */}
          <div>
            <label htmlFor="purchase_price" className="block text-sm font-medium text-gray-700">
              Purchase Price *
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="purchase_price"
                name="purchase_price"
                required
                min="0"
                step="0.01"
                className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="0.00"
                value={formData.purchase_price}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Purchase Date */}
          <div>
            <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700">
              Purchase Date *
            </label>
            <input
              type="date"
              id="purchase_date"
              name="purchase_date"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.purchase_date}
              onChange={handleChange}
            />
          </div>

          {/* Position Summary */}
          {formData.quantity && formData.purchase_price && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Position Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Shares:</span>
                  <span>{parseFloat(formData.quantity).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price per share:</span>
                  <span>{formatCurrency(formData.purchase_price)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-gray-900">Total Cost:</span>
                  <span>{formatCurrency(formData.quantity * formData.purchase_price)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.stock_symbol.trim() || !formData.quantity || !formData.purchase_price}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Position'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPosition;