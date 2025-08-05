import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, RefreshCw, BarChart3 } from 'lucide-react';
import apiService from '../services/api';

const PortfolioChart = ({ portfolioId }) => {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('1mo');

  const periods = [
    { value: '1mo', label: '1M' },
    { value: '3mo', label: '3M' },
    { value: '6mo', label: '6M' },
    { value: '1y', label: '1Y' },
    { value: '2y', label: '2Y' },
    { value: '5y', label: '5Y' }
  ];

  useEffect(() => {
    if (portfolioId) {
      fetchPerformanceData();
    }
  }, [portfolioId, selectedPeriod]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getPortfolioPerformance(portfolioId, selectedPeriod);
      setPerformanceData(data);
    } catch (err) {
      setError('Failed to load performance data');
      console.error('Error fetching portfolio performance:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (percentage) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  const formatTooltipDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="text-sm text-gray-600">{formatTooltipDate(label)}</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Prepare chart data
  const chartData = performanceData ? performanceData.dates.map((date, index) => ({
    date,
    value: performanceData.values[index]
  })) : [];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading performance data...</span>
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
            onClick={fetchPerformanceData}
            className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!performanceData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-gray-600">
          <BarChart3 className="h-8 w-8 mx-auto mb-2" />
          <p>No performance data available</p>
        </div>
      </div>
    );
  }

  const isPositive = performanceData.total_return >= 0;
  const lineColor = isPositive ? '#10b981' : '#ef4444';

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Portfolio Performance</h3>
          </div>
          <button
            onClick={fetchPerformanceData}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Current Value</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(performanceData.current_value)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Initial Value</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(performanceData.initial_value)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Return</p>
            <div className={`flex items-center justify-center text-lg font-semibold ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {formatCurrency(Math.abs(performanceData.total_return))}
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">% Return</p>
            <div className={`text-lg font-semibold ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercentage(performanceData.total_return_percent)}
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center justify-center space-x-1">
          <Calendar className="h-4 w-4 text-gray-500 mr-2" />
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                selectedPeriod === period.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: lineColor }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-50 border-t">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <p>Data from Yahoo Finance • Historical performance</p>
          <p>Period: {periods.find(p => p.value === selectedPeriod)?.label}</p>
        </div>
      </div>
    </div>
  );
};

export default PortfolioChart;