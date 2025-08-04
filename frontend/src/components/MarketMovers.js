import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, BarChart3 } from 'lucide-react';
import apiService from '../services/api';

const MarketMovers = () => {
  const [marketData, setMarketData] = useState({ gainers: [], losers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('gainers');

  useEffect(() => {
    fetchMarketMovers();
  }, []);

  const fetchMarketMovers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMarketMovers();
      setMarketData(data);
    } catch (err) {
      setError('Failed to load market data');
      console.error('Error fetching market movers:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (percentage) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  const formatVolume = (volume) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toLocaleString();
  };

  const formatMarketCap = (marketCap) => {
    if (marketCap >= 1000000000000) {
      return `${(marketCap / 1000000000000).toFixed(1)}T`;
    } else if (marketCap >= 1000000000) {
      return `${(marketCap / 1000000000).toFixed(1)}B`;
    } else if (marketCap >= 1000000) {
      return `${(marketCap / 1000000).toFixed(1)}M`;
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading market data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-red-600">
          <BarChart3 className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
          <button
            onClick={fetchMarketMovers}
            className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentData = activeTab === 'gainers' ? marketData.gainers : marketData.losers;

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b bg-gradient-to-r from-green-50 to-red-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Market Movers</h3>
          </div>
          <button
            onClick={fetchMarketMovers}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">Top stock gainers and losers</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('gainers')}
          className={`flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
            activeTab === 'gainers'
              ? 'border-green-500 text-green-600 bg-green-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Top Gainers ({marketData.gainers.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('losers')}
          className={`flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
            activeTab === 'losers'
              ? 'border-red-500 text-red-600 bg-red-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center">
            <TrendingDown className="h-4 w-4 mr-2" />
            Top Losers ({marketData.losers.length})
          </div>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Change
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                % Change
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Volume
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Market Cap
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((stock, index) => (
              <tr key={stock.symbol} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-2">
                        {stock.symbol}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        index === 0 
                          ? activeTab === 'gainers' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        #{index + 1}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-32">
                      {stock.name}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <DollarSign className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-900">
                      {formatCurrency(stock.price)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className={`flex items-center text-sm font-medium ${
                    stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stock.change >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {formatCurrency(Math.abs(stock.change))}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className={`text-sm font-bold ${
                    stock.change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(stock.change_percent)}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatVolume(stock.volume)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatMarketCap(stock.market_cap)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-50 border-t">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <p>Data from Yahoo Finance • Updates every 15 minutes</p>
          {marketData.last_updated && (
            <p>
              Last updated: {new Date(marketData.last_updated).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketMovers;