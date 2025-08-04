import React from 'react';
import './Logo.css';

const Logo = ({ size = 'medium', className = '', showSubtitle = true }) => {
  const sizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl',
    xlarge: 'text-6xl'
  };

  return (
    <div className={`logo-container ${className}`}>
      <div className={`logo-text ${sizeClasses[size]}`}>
        <span className="letter letter-w">W</span>
        <span className="letter letter-o">o</span>
        <span className="letter letter-o2">o</span>
        <span className="letter letter-d">d</span>
        <span className="letter letter-e">e</span>
        <span className="letter letter-z">z</span>
        <span className="letter letter-f">f</span>
        <span className="letter letter-i">i</span>
      </div>
      {showSubtitle && (
        <div className="logo-subtitle">
          Portfolio Manager
        </div>
      )}
    </div>
  );
};

export default Logo;