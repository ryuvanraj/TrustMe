import React, { useState } from 'react';

// Buy Dialog Component
export const BuyDialog = ({ asset, onBuy, onClose, userWalletAddress, adminWalletAddress }) => {
  const [amount, setAmount] = useState('20');
  const [showDetails, setShowDetails] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onBuy(asset, parseFloat(amount));
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-blue-500">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Buy {asset.symbol}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300">Current Price:</span>
            <span className="text-white font-medium">${asset.currentPrice?.toFixed(2) || "0.00"}</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">
              Amount to Buy (USD)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-gray-800 text-white rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              step="0.01"
              required
            />
          </div>
          
          <div className="mb-6">
            <button 
              type="button" 
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-400 text-sm hover:text-blue-300 flex items-center"
            >
              {showDetails ? "Hide" : "Show"} Transaction Details
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                <polyline points={showDetails ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
              </svg>
            </button>
            
            {showDetails && (
              <div className="mt-2 p-3 bg-gray-800 rounded-lg text-sm">
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <span className="text-gray-400">From Address:</span>
                  <span className="text-white col-span-2 break-all">{userWalletAddress}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <span className="text-gray-400">To Address:</span>
                  <span className="text-white col-span-2 break-all">{adminWalletAddress}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-1">
                  <span className="text-gray-400">Asset:</span>
                  <span className="text-white col-span-2">{asset.symbol}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-400">Transaction:</span>
                  <span className="text-green-400 col-span-2">Buy</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Confirm Purchase
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Sell Dialog Component
export const SellDialog = ({ asset, onSell, onClose, userWalletAddress, adminWalletAddress, availableAmount }) => {
  const [amount, setAmount] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSell(asset, parseFloat(amount));
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-red-500">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Sell {asset.symbol}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300">Current Price:</span>
            <span className="text-white font-medium">${asset.currentPrice?.toFixed(2) || "0.00"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Available for Sale:</span>
            <span className="text-white font-medium">{availableAmount} {asset.symbol}</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">
              Amount to Sell
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-gray-800 text-white rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
              min="0.01"
              step="0.01"
              max={availableAmount}
              required
              placeholder={`Maximum: ${availableAmount}`}
            />
          </div>
          
          <div className="mb-6">
            <button 
              type="button" 
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-400 text-sm hover:text-blue-300 flex items-center"
            >
              {showDetails ? "Hide" : "Show"} Transaction Details
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                <polyline points={showDetails ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
              </svg>
            </button>
            
            {showDetails && (
              <div className="mt-2 p-3 bg-gray-800 rounded-lg text-sm">
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <span className="text-gray-400">From Address:</span>
                  <span className="text-white col-span-2 break-all">{adminWalletAddress}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <span className="text-gray-400">To Address:</span>
                  <span className="text-white col-span-2 break-all">{userWalletAddress}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-1">
                  <span className="text-gray-400">Asset:</span>
                  <span className="text-white col-span-2">{asset.symbol}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-400">Transaction:</span>
                  <span className="text-red-400 col-span-2">Sell</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Confirm Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};