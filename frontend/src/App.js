import { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Navbar from './components/Navbar';
import PortfolioList from './components/PortfolioList';
import PortfolioDetail from './components/PortfolioDetail';
import CreatePortfolio from './components/CreatePortfolio';
import apiService from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null);
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    setIsAuthenticated(apiService.isAuthenticated());
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleRegister = () => {
    setIsAuthenticated(true);
    setShowRegister(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSelectedPortfolioId(null);
    setShowCreatePortfolio(false);
    setShowRegister(false);
  };

  const handleShowRegister = () => {
    setShowRegister(true);
  };

  const handleShowLogin = () => {
    setShowRegister(false);
  };

  const handleSelectPortfolio = (portfolioId) => {
    setSelectedPortfolioId(portfolioId);
  };

  const handleBackToList = () => {
    setSelectedPortfolioId(null);
  };

  const handleCreatePortfolio = () => {
    setShowCreatePortfolio(true);
  };

  const handlePortfolioCreated = () => {
    setShowCreatePortfolio(false);
    // Refresh the portfolio list by resetting selected portfolio
    setSelectedPortfolioId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showRegister) {
      return <Register onRegister={handleRegister} onShowLogin={handleShowLogin} />;
    }
    return <Login onLogin={handleLogin} onShowRegister={handleShowRegister} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {selectedPortfolioId ? (
          <PortfolioDetail
            portfolioId={selectedPortfolioId}
            onBack={handleBackToList}
          />
        ) : (
          <PortfolioList
            onSelectPortfolio={handleSelectPortfolio}
            onCreatePortfolio={handleCreatePortfolio}
          />
        )}
      </main>

      {showCreatePortfolio && (
        <CreatePortfolio
          onClose={() => setShowCreatePortfolio(false)}
          onCreated={handlePortfolioCreated}
        />
      )}
    </div>
  );
}

export default App;
