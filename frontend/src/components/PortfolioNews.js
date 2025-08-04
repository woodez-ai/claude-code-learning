import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Clock, TrendingUp } from 'lucide-react';
import apiService from '../services/api';

const PortfolioNews = ({ portfolioId }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (portfolioId) {
      fetchNews();
    }
  }, [portfolioId]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPortfolioNews(portfolioId);
      setNews(data);
    } catch (err) {
      setError('Failed to load news');
      console.error('Error fetching portfolio news:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now() / 1000;
    const diffInSeconds = now - timestamp;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays}d ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours}h ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading news...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-red-600">
          <Newspaper className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-gray-500">
          <Newspaper className="h-8 w-8 mx-auto mb-2" />
          <p>No news available for your portfolio stocks</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center">
          <Newspaper className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Portfolio News</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">Latest financial news for your stocks</p>
      </div>
      
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {news.map((article, index) => (
          <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start space-x-3">
              {article.image && (
                <img 
                  src={article.image} 
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {article.ticker}
                  </span>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTimeAgo(article.published)}
                  </div>
                  {article.publisher && (
                    <span className="text-xs text-gray-500">• {article.publisher}</span>
                  )}
                </div>
                
                <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                  {article.title}
                </h4>
                
                {article.summary && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {article.summary}
                  </p>
                )}
                
                {article.url && (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Read more
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 bg-gray-50 border-t">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Powered by Yahoo Finance
          </p>
          <button
            onClick={fetchNews}
            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortfolioNews;