import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, RefreshCw, TrendingUp, TrendingDown, Trash2, Edit, Download, BarChart, Upload, DollarSign } from 'lucide-react';
import apiService from '../services/api';
import AddPosition from './AddPosition';
import PortfolioNews from './PortfolioNews';
import PortfolioChart from './PortfolioChart';
import UpdatePosition from './UpdatePosition';
import CSVImportModal from './CSVImportModal';

const PortfolioDetail = ({ portfolioId, onBack }) => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingAnalysis, setRefreshingAnalysis] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [showUpdatePosition, setShowUpdatePosition] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [sellQuantity, setSellQuantity] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [selling, setSelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPortfolio();
  }, [portfolioId]);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPortfolio(portfolioId);
      setPortfolio(data);
    } catch (err) {
      setError('Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPrices = async () => {
    try {
      setRefreshing(true);
      await apiService.refreshPortfolioPrices(portfolioId);
      await loadPortfolio();
    } catch (err) {
      setError('Failed to refresh prices');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshAnalysis = async () => {
    try {
      setRefreshingAnalysis(true);
      const result = await apiService.refreshStockAnalysis();
      await loadPortfolio();
      alert(`Updated analysis data for ${result.updated_stocks.length} stocks!`);
    } catch (err) {
      setError('Failed to refresh analysis data');
      console.error('Error refreshing analysis:', err);
    } finally {
      setRefreshingAnalysis(false);
    }
  };

  const handlePositionAdded = () => {
    setShowAddPosition(false);
    loadPortfolio();
  };

  const handleUpdatePosition = (position) => {
    setSelectedPosition(position);
    setShowUpdatePosition(true);
  };

  const handlePositionUpdated = () => {
    setShowUpdatePosition(false);
    setSelectedPosition(null);
    loadPortfolio();
  };

  const handleImportComplete = (result) => {
    setShowImportModal(false);
    loadPortfolio();
    alert(`Successfully imported ${result.created_positions} position(s)!`);
  };

  const handleDeletePosition = async (positionId) => {
    if (window.confirm('Are you sure you want to delete this position?')) {
      try {
        await apiService.deletePosition(positionId);
        await loadPortfolio();
      } catch (err) {
        setError('Failed to delete position');
      }
    }
  };

  const handleSellPosition = (position) => {
    setSelectedPosition(position);
    setSellQuantity('');
    setSellPrice(position.stock.current_price ? position.stock.current_price.toString() : '');
    setShowSellModal(true);
  };

  const handleConfirmSell = async () => {
    if (!selectedPosition || !sellQuantity) {
      setError('Please enter quantity to sell');
      return;
    }

    const quantity = parseFloat(sellQuantity);
    const price = sellPrice ? parseFloat(sellPrice) : null;

    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (quantity > parseFloat(selectedPosition.quantity)) {
      setError('Cannot sell more shares than owned');
      return;
    }

    try {
      setSelling(true);
      const result = await apiService.sellPosition(selectedPosition.id, quantity, price);
      await loadPortfolio();
      setShowSellModal(false);
      setSelectedPosition(null);
      setSellQuantity('');
      setSellPrice('');
      alert(`Successfully sold ${quantity} shares for ${formatCurrency(result.cash_from_sale)}`);
    } catch (err) {
      setError('Failed to sell position: ' + (err.response?.data?.error || err.message));
    } finally {
      setSelling(false);
    }
  };

  const handleExportCsv = async () => {
    if (!portfolio || !portfolio.positions || portfolio.positions.length === 0) {
      alert('No positions to export');
      return;
    }

    try {
      setExportingCsv(true);
      
      // Portfolio summary information
      const portfolioSummary = [
        ['Portfolio Export'],
        [''],
        ['Portfolio Name', `"${portfolio.name}"`],
        ['Description', `"${portfolio.description || 'No description'}"`],
        ['Export Date', new Date().toLocaleString()],
        ['Total Positions', portfolio.positions.length.toString()],
        ['Total Portfolio Value', formatCurrency(portfolio.total_value || 0).replace('$', '')],
        ['Total Cost Basis', formatCurrency(portfolio.total_cost || 0).replace('$', '')],
        ['Total Gain/Loss', formatCurrency(portfolio.total_gain_loss || 0).replace('$', '')],
        [''],
        ['Position Details:'],
        ['']
      ];

      // CSV headers for positions
      const headers = [
        'Stock Symbol',
        'Stock Name',
        'Quantity',
        'Purchase Price',
        'Current Price',
        'Total Cost',
        'Current Value',
        'Gain/Loss ($)',
        'Gain/Loss (%)',
        'Analyst Recommendation',
        'Analyst Target Price',
        'Put/Call Ratio',
        'Purchase Date'
      ];

      // Convert positions to CSV rows
      const csvRows = portfolio.positions.map(position => {
        const totalCost = parseFloat(position.total_cost || 0);
        const gainLoss = parseFloat(position.gain_loss || 0);
        const gainLossPercentage = totalCost > 0 
          ? ((gainLoss / totalCost) * 100).toFixed(2)
          : '0.00';
        
        return [
          position.stock?.symbol || 'N/A',
          `"${position.stock?.name || position.stock?.symbol || 'Unknown'}"`, // Quoted in case of commas
          parseFloat(position.quantity || 0).toLocaleString(),
          parseFloat(position.purchase_price || 0).toFixed(2),
          position.stock?.current_price ? parseFloat(position.stock.current_price).toFixed(2) : 'N/A',
          totalCost.toFixed(2),
          parseFloat(position.current_value || 0).toFixed(2),
          gainLoss.toFixed(2),
          `${gainLoss >= 0 ? '+' : ''}${gainLossPercentage}%`,
          position.stock?.analyst_recommendation || 'N/A',
          position.stock?.analyst_target_price ? parseFloat(position.stock.analyst_target_price).toFixed(2) : 'N/A',
          position.stock?.put_call_ratio ? parseFloat(position.stock.put_call_ratio).toFixed(2) : 'N/A',
          position.purchase_date || 'N/A'
        ];
      });

      // Combine portfolio summary, headers and rows
      const csvContent = [...portfolioSummary, headers, ...csvRows]
        .map(row => row.join(','))
        .join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        // Generate filename with portfolio name and current date
        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `${portfolio.name.replace(/[^a-z0-9]/gi, '_')}_positions_${currentDate}.csv`;
        link.setAttribute('download', filename);
        
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        const positions = portfolio.positions.length;
        alert(`Successfully exported ${positions} position${positions !== 1 ? 's' : ''} to CSV file!`);
      }
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Failed to export CSV file');
    } finally {
      setExportingCsv(false);
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

  if (!portfolio) {
    return <div>Portfolio not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{portfolio.name}</h1>
            {portfolio.description && (
              <p className="text-gray-600">{portfolio.description}</p>
            )}
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefreshPrices}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Prices
          </button>
          <button
            onClick={handleRefreshAnalysis}
            disabled={refreshingAnalysis}
            className="inline-flex items-center px-3 py-2 border border-purple-300 shadow-sm text-sm leading-4 font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BarChart className={`h-4 w-4 mr-2 ${refreshingAnalysis ? 'animate-pulse' : ''}`} />
            {refreshingAnalysis ? 'Updating...' : 'Refresh Analysis'}
          </button>
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv || !portfolio?.positions?.length}
            className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-300"
          >
            <Download className={`h-4 w-4 mr-2 ${exportingCsv ? 'animate-pulse' : ''}`} />
            {exportingCsv ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center px-3 py-2 border border-orange-300 shadow-sm text-sm leading-4 font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </button>
          <button
            onClick={() => setShowAddPosition(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Position
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(portfolio.total_value)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Cost</p>
              <p className="text-xl text-gray-700">
                {formatCurrency(portfolio.total_cost)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cash Balance</p>
              <p className="text-xl font-bold text-green-700">
                {formatCurrency(portfolio.cash_balance || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Gain/Loss</p>
              <div className="flex items-center space-x-2">
                {portfolio.total_gain_loss >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p
                    className={`text-xl font-bold ${
                      portfolio.total_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(portfolio.total_gain_loss)}
                  </p>
                  <p
                    className={`text-sm ${
                      portfolio.total_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatPercentage(portfolio.total_gain_loss, portfolio.total_cost)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Performance Chart */}
      <PortfolioChart portfolioId={portfolioId} />

      {/* Positions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Positions</h3>
        </div>
        {portfolio.positions.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No positions in this portfolio yet.</p>
            <button
              onClick={() => setShowAddPosition(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Position
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gain/Loss
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Analyst
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P/C Ratio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {portfolio.positions.map((position) => (
                  <tr key={position.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {position.stock.symbol}
                        </div>
                        <div className="text-sm text-gray-500">
                          {position.stock.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {parseFloat(position.quantity).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(position.purchase_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {position.stock.current_price 
                        ? formatCurrency(position.stock.current_price)
                        : 'N/A'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(position.total_cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(position.current_value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        {position.gain_loss >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <div
                            className={`text-sm font-medium ${
                              position.gain_loss >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(position.gain_loss)}
                          </div>
                          <div
                            className={`text-xs ${
                              position.gain_loss >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {formatPercentage(position.gain_loss, position.total_cost)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-center">
                        {position.stock.analyst_recommendation ? (
                          <div>
                            <div className={`text-xs font-medium px-2 py-1 rounded ${
                              position.stock.analyst_recommendation === 'Buy' ? 'bg-green-100 text-green-800' :
                              position.stock.analyst_recommendation === 'Sell' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {position.stock.analyst_recommendation}
                            </div>
                            {position.stock.analyst_target_price && (
                              <div className="text-xs text-gray-500 mt-1">
                                Target: {formatCurrency(position.stock.analyst_target_price)}
                              </div>
                            )}
                            {position.stock.analyst_count && (
                              <div className="text-xs text-gray-400">
                                ({position.stock.analyst_count} analysts)
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-center">
                        {position.stock.put_call_ratio ? (
                          <div>
                            <div className={`text-sm font-medium ${
                              position.stock.put_call_ratio > 1 ? 'text-red-600' : 
                              position.stock.put_call_ratio > 0.7 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {parseFloat(position.stock.put_call_ratio).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {position.stock.put_call_ratio > 1 ? 'Bearish' : 
                               position.stock.put_call_ratio > 0.7 ? 'Cautious' : 'Bullish'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSellPosition(position)}
                          className="text-green-600 hover:text-green-900"
                          title="Sell position"
                        >
                          <DollarSign className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUpdatePosition(position)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Update position"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePosition(position.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete position"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Portfolio News */}
      <PortfolioNews portfolioId={portfolioId} />

      {showAddPosition && (
        <AddPosition
          portfolioId={portfolioId}
          onClose={() => setShowAddPosition(false)}
          onAdded={handlePositionAdded}
        />
      )}

      {showUpdatePosition && selectedPosition && (
        <UpdatePosition
          position={selectedPosition}
          onClose={() => {
            setShowUpdatePosition(false);
            setSelectedPosition(null);
          }}
          onUpdated={handlePositionUpdated}
        />
      )}

      {showImportModal && (
        <CSVImportModal
          portfolioId={portfolioId}
          onClose={() => setShowImportModal(false)}
          onImportComplete={handleImportComplete}
        />
      )}

      {/* Sell Position Modal */}
      {showSellModal && selectedPosition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Sell {selectedPosition.stock.symbol}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                You own {parseFloat(selectedPosition.quantity).toLocaleString()} shares
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Current Price: {selectedPosition.stock.current_price ? formatCurrency(selectedPosition.stock.current_price) : 'N/A'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Sell
                </label>
                <input
                  type="number"
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(e.target.value)}
                  max={selectedPosition.quantity}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sell Price (optional, uses current price if empty)
                </label>
                <input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter sell price"
                />
              </div>

              {sellQuantity && sellPrice && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-700">
                    Total Sale Value: {formatCurrency(parseFloat(sellQuantity) * parseFloat(sellPrice))}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSellModal(false);
                  setSelectedPosition(null);
                  setSellQuantity('');
                  setSellPrice('');
                  setError('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={selling}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSell}
                disabled={selling || !sellQuantity}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selling ? 'Selling...' : 'Sell Position'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioDetail;