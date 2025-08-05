import axios from 'axios';

const API_BASE_URL = '';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(username, password) {
    const response = await this.api.post('/api-token-auth/', {
      username,
      password,
    });
    const { token } = response.data;
    localStorage.setItem('token', token);
    return token;
  }

  async register(userData) {
    const response = await this.api.post('/api/register/', userData);
    const { token } = response.data;
    localStorage.setItem('token', token);
    return response.data;
  }

  logout() {
    localStorage.removeItem('token');
  }

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  // Portfolio endpoints
  async getPortfolios() {
    const response = await this.api.get('/api/portfolios/');
    return response.data;
  }

  async getPortfolio(id) {
    const response = await this.api.get(`/api/portfolios/${id}/`);
    return response.data;
  }

  async createPortfolio(portfolioData) {
    const response = await this.api.post('/api/portfolios/', portfolioData);
    return response.data;
  }

  async updatePortfolio(id, portfolioData) {
    const response = await this.api.put(`/api/portfolios/${id}/`, portfolioData);
    return response.data;
  }

  async deletePortfolio(id) {
    await this.api.delete(`/api/portfolios/${id}/`);
  }

  async addPositionToPortfolio(portfolioId, positionData) {
    const response = await this.api.post(
      `/api/portfolios/${portfolioId}/add_position/`,
      positionData
    );
    return response.data;
  }

  async refreshPortfolioPrices(portfolioId) {
    const response = await this.api.get(`/api/portfolios/${portfolioId}/refresh_prices/`);
    return response.data;
  }

  // Stock endpoints
  async searchStock(symbol) {
    const response = await this.api.post('/api/stocks/search_yahoo/', {
      symbol: symbol.toUpperCase(),
    });
    return response.data;
  }

  async getStocks(params = {}) {
    const response = await this.api.get('/api/stocks/', { params });
    return response.data;
  }

  // Position endpoints
  async getPositions() {
    const response = await this.api.get('/api/positions/');
    return response.data;
  }

  async updatePosition(id, positionData) {
    const response = await this.api.put(`/api/positions/${id}/`, positionData);
    return response.data;
  }

  async deletePosition(id) {
    await this.api.delete(`/api/positions/${id}/`);
  }

  // Public endpoints (no auth required)
  async getTopPortfolios() {
    const response = await this.api.get('/api/top-portfolios/');
    return response.data;
  }

  // News endpoints
  async getPortfolioNews(portfolioId) {
    const response = await this.api.get(`/api/portfolios/${portfolioId}/news/`);
    return response.data;
  }

  // Market data endpoints
  async getMarketMovers() {
    const response = await this.api.get('/api/market-movers/');
    return response.data;
  }

  // Portfolio performance endpoints
  async getPortfolioPerformance(portfolioId, period = '1mo') {
    const response = await this.api.get(`/api/portfolios/${portfolioId}/performance/`, {
      params: { period }
    });
    return response.data;
  }

  // Stock analysis endpoints
  async refreshStockAnalysis() {
    const response = await this.api.post('/api/refresh-stock-analysis/');
    return response.data;
  }

  // CSV Import endpoints
  async importPortfolioCSV(portfolioId, csvFile) {
    const formData = new FormData();
    formData.append('csv_file', csvFile);
    
    const response = await this.api.post(`/api/portfolios/${portfolioId}/import-csv/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async confirmCSVImport(importId) {
    const response = await this.api.post(`/api/imports/${importId}/confirm/`);
    return response.data;
  }

  async getImportStatus(importId) {
    const response = await this.api.get(`/api/imports/${importId}/status/`);
    return response.data;
  }
}

export default new ApiService();