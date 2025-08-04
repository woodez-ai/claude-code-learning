import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Users } from 'lucide-react';
import apiService from '../services/api';

const TopPortfolios = () => {
  const [topPortfolios, setTopPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTopPortfolios();
  }, []);

  const fetchTopPortfolios = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTopPortfolios();
      setTopPortfolios(data);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Error fetching top portfolios:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-red-600">
          <TrendingDown className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (topPortfolios.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-gray-500">
          <Users className="h-8 w-8 mx-auto mb-2" />
          <p>No portfolios to display yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-3 border-b bg-gradient-to-r from-yellow-50 to-orange-50">
        <div className="flex items-center">
          <Trophy className="h-4 w-4 text-yellow-600 mr-2" />
          <h3 className="text-base font-semibold text-gray-900">Best Performing Portfolios</h3>
        </div>
        <p className="text-xs text-gray-600 mt-1">Leading portfolios by % gains</p>
      </div>
      
      <div className="divide-y divide-gray-100">
        {topPortfolios.slice(0, 5).map((portfolio, index) => (
          <div 
            key={portfolio.id} 
            className={`p-3 hover:bg-gray-50 transition-colors ${
              index === 0 ? 'bg-gradient-to-r from-yellow-50 to-amber-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`flex-shrink-0 ${index === 0 ? 'relative' : ''}`}>
                  {index === 0 ? (
                    <div className="relative">
                      <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                        <Trophy className="h-3 w-3 text-white" />
                      </div>
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">#{index + 1}</span>
                    </div>
                  )}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {portfolio.name}
                    </p>
                    {index === 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        🏆
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 flex items-center">
                    <Users className="h-2.5 w-2.5 mr-1" />
                    @{portfolio.username}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`flex items-center text-xs font-semibold ${
                  portfolio.percentage_gain >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {portfolio.percentage_gain >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                  )}
                  {formatPercentage(portfolio.percentage_gain)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-2 bg-gray-50 border-t">
        <p className="text-xs text-gray-500 text-center">
          Live % rankings • Join the competition
        </p>
      </div>
    </div>
  );
};

export default TopPortfolios;