import React from 'react';

const WoodezLogo = ({ size = 'medium', className = '', showSubtitle = true }) => {
  const sizeClasses = {
    small: { width: '120px', height: '80px', fontSize: '12px' },
    medium: { width: '180px', height: '120px', fontSize: '16px' },
    large: { width: '240px', height: '160px', fontSize: '20px' },
    xlarge: { width: '300px', height: '200px', fontSize: '24px' }
  };

  const logoSize = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center ${className}`} style={{ width: logoSize.width }}>
      {/* Logo SVG */}
      <div className="mb-4" style={{ width: logoSize.width, height: logoSize.height }}>
        <svg
          width={logoSize.width}
          height={logoSize.height}
          viewBox="0 0 240 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Diamond shape parts */}
          {/* Top orange part */}
          <path
            d="M120 20 L80 60 L120 80 L160 60 Z"
            fill="#D2691E"
            stroke="none"
          />
          
          {/* Right orange part */}
          <path
            d="M120 80 L160 60 L180 100 L120 100 Z"
            fill="#B8860B"
            stroke="none"
          />
          
          {/* Bottom light gray part */}
          <path
            d="M120 80 L80 100 L120 120 L160 100 Z"
            fill="#E5E5E5"
            stroke="none"
          />
          
          {/* Left dark gray part */}
          <path
            d="M80 60 L60 100 L80 100 L120 80 Z"
            fill="#708090"
            stroke="none"
          />
          
          {/* Small center white diamond */}
          <path
            d="M120 70 L110 80 L120 90 L130 80 Z"
            fill="#FFFFFF"
            stroke="none"
          />
        </svg>
      </div>
      
      {/* Text below logo with proper spacing */}
      <div 
        className="text-center font-bold text-gray-800 tracking-wider"
        style={{ fontSize: logoSize.fontSize }}
      >
        <div className="mb-1">WOODEZ</div>
        {showSubtitle && (
          <div 
            className="text-gray-600 font-normal tracking-wide"
            style={{ fontSize: `${parseInt(logoSize.fontSize) * 0.6}px` }}
          >
            INDUSTRIES
          </div>
        )}
      </div>
    </div>
  );
};

export default WoodezLogo;