import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, RefreshCw, Eye } from 'lucide-react';
import apiService from '../services/api';

const PortfolioList = ({ onSelectPortfolio, onCreatePortfolio }) => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPortfolios();
      setPortfolios(response.results || []);
    } catch (err) {
      setError('Failed to load portfolios');
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

  const formatPercentage = (gainLoss, totalCost) => {
    if (totalCost <= 0) return '0.00%';
    const percentage = (gainLoss / totalCost) * 100;
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Portfolios</h1>
        <button
          onClick={onCreatePortfolio}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Portfolio
        </button>
      </div>

      {portfolios.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No portfolios</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first portfolio.
          </p>
          <div className="mt-6">
            <button
              onClick={onCreatePortfolio}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Portfolio
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {portfolio.name}
                  </h3>
                  <button
                    onClick={() => onSelectPortfolio(portfolio.id)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
                
                {portfolio.description && (
                  <p className="mt-1 text-sm text-gray-500 truncate">
                    {portfolio.description}
                  </p>
                )}

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total Value</span>
                    <span className="text-lg font-semibold">
                      {formatCurrency(portfolio.total_value)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total Cost</span>
                    <span className="text-sm">
                      {formatCurrency(portfolio.total_cost)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Gain/Loss</span>
                    <div className="flex items-center space-x-1">
                      {portfolio.total_gain_loss >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          portfolio.total_gain_loss >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(portfolio.total_gain_loss)}
                      </span>
                      <span
                        className={`text-xs ${
                          portfolio.total_gain_loss >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        ({formatPercentage(portfolio.total_gain_loss, portfolio.total_cost)})
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{portfolio.position_count} positions</span>
                    <span>
                      Updated {new Date(portfolio.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PortfolioList;