/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { AptosClient } from "aptos";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { SellDialog } from '@/components/transactions/TransactionDialogs';

// Add interfaces
interface MarketAsset {
  type: 'stock' | 'crypto';
  symbol: string;
  name: string;
  currentPrice: number;
  price: number;
  change: number;
  changePercentage: number;
  availableAmount?: number;
}

interface PortfolioItem {
  [x: string]: any;
  symbol: string;
  amount?: string;
  displayAmount?: string;
  quantity?: string;
  displayQuantity?: string;
  price?: string;
  displayPrice?: string;
  value?: string;
}

const Portfolio = () => {
  const [userWallet, setUserWallet] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>(null);
  const [marketData, setMarketData] = useState<{
    stocks?: { [key: string]: number }, 
    cryptos?: { [key: string]: number }
  } | null>(null);
  const [adminWalletAddress, setAdminWalletAddress] = useState("0x601093cf230a092efc6706a3198d6fe2c7bbfc3b79eab0393e3a7d4b03eb2154");
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [activeTab, setActiveTab] = useState("crypto");

  const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");

  // Helper function to convert hex to text
  const hexToText = (input) => {
    try {
      // If the input is already plain text, return it
      if (/^[a-zA-Z]+$/.test(input)) {
        return input;
      }

      // Otherwise, treat it as a hexadecimal string
      if (typeof input === 'string' && input.startsWith('0x')) {
        const sanitizedHex = input.slice(2); // Remove '0x' prefix
        const bytes = new Uint8Array(
          sanitizedHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
        );
        return new TextDecoder().decode(bytes);
      }

      console.error(`Unrecognized input format: ${input}`);
      return 'Unknown';
    } catch (error) {
      console.error(`Error converting input to text: ${input}`, error);
      return 'Unknown';
    }
  };

  // Check if a symbol is a stock symbol (add more if needed)
  const isStockSymbol = (symbol: string): boolean => {
    const stockSymbols = ['AAPL', 'GOOGL', 'TSLA', 'AMZN'];
    return stockSymbols.includes(symbol);
  };

  // Check if a symbol is a crypto symbol 
  const isCryptoSymbol = (symbol: string): boolean => {
    const normalizedSymbol = symbol.toUpperCase();
    return normalizedSymbol.includes('BTC') || 
           normalizedSymbol.includes('ETH') || 
           normalizedSymbol.includes('ADA');
  };

  const fetchBalance = async () => {
    if (!userWallet) return;

    try {
      const resources = await client.getAccountResources(userWallet.address);
      const accountResource = resources.find((r) =>
        r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
      );

      if (accountResource) {
        const balance = parseInt(accountResource.data["coin"]["value"]) / 100000000;
        setBalance(balance);
        console.log("Wallet balance:", balance, "APT");
      } else {
        console.error("APT balance resource not found.");
        setBalance(0);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance(0);
    }
  };

  const fetchPortfolio = async () => {
    if (!userWallet) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4002/portfolio?walletAddress=${userWallet.address}`);
      const data = await response.json();
      console.log("Portfolio data:", data);
      
      if (data && data.success && Array.isArray(data.data)) {
        // Normalize the data and keep everything in one portfolio array
        const normalizedData = data.data.map(item => {
          // For items with a hex symbol, convert to text
          const symbolText = item.symbol?.startsWith('0x') 
            ? hexToText(item.symbol) 
            : item.symbol || '';
          
          return {
            symbol: symbolText,
            // Keep original symbol for reference
            originalSymbol: item.symbol,
            // Use quantity field for stocks, amount field for crypto
            amount: parseFloat(item.amount || '0').toString(),
            quantity: parseFloat(item.quantity || item.amount || '0').toString(),
            displayAmount: parseFloat(item.displayAmount || item.amount || '0').toString(),
            displayQuantity: parseFloat(item.displayQuantity || item.quantity || '0').toString(),
            price: parseFloat(item.price || '0').toString(),
            displayPrice: parseFloat(item.displayPrice || item.price || '0').toString(),
            value: parseFloat(item.value || '0').toString()
          };
        });
        
        setPortfolio(normalizedData);
      } else {
        setPortfolio([]);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setPortfolio([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4001/market-data');
      const data = await response.json();
      
      if (data && data.success) {
        setMarketData(data.data);
        localStorage.setItem('lastMarketData', JSON.stringify(data.data));
        localStorage.setItem('lastFetchTime', Date.now().toString());
      } else {
        // Try to get cached data
        const cachedData = localStorage.getItem('lastMarketData');
        if (cachedData) {
          setMarketData(JSON.parse(cachedData));
        }
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
      const cachedData = localStorage.getItem('lastMarketData');
      if (cachedData) {
        setMarketData(JSON.parse(cachedData));
      }
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.aptos) {
        alert('Petra Wallet not installed! Please install it to proceed.');
        return;
      }

      const wallet = window.aptos;
      const response = await wallet.connect();
      const account = {
        address: response.address,
        publicKey: response.publicKey
      };

      setUserWallet(account);
      setConnected(true);
      console.log('Wallet Connected:', account);
      
      await Promise.all([
        fetchBalance(),
        fetchPortfolio()
      ]);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    }
  };

  const disconnectWallet = async () => {
    try {
      if (window.aptos) {
        await window.aptos.disconnect();
      }
      
      setUserWallet(null);
      setConnected(false);
      setBalance(0);
      setPortfolio([]);
      
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      alert('Failed to disconnect wallet');
    }
  };

  // Calculate total portfolio value
  const calculatePortfolioValue = () => {
    if (!marketData) return;
    
    let totalValue = 0;
    
    portfolio.forEach(item => {
      let price = 0;
      let amount = 0;
      const symbol = item.symbol;
      
      if (isStockSymbol(symbol)) {
        // This is a stock
        price = marketData.stocks?.[symbol] || 0;
        amount = parseFloat(item.quantity || '0');
      } else if (isCryptoSymbol(symbol)) {
        // This is a crypto asset
        const cleanSymbol = symbol.replace('-USD', '');
        price = marketData.cryptos?.[`${cleanSymbol}-USD`] || 0;
        amount = parseFloat(item.amount || '0');
      }
      
      if (!isNaN(amount) && !isNaN(price)) {
        totalValue += price * amount;
      }
    });
    
    setPortfolioValue(totalValue);
  };

  // Function to sell assets
  const handleSell = (asset) => {
    if (!connected) {
      alert('Please connect your wallet first');
      return connectWallet();
    }

    setSelectedAsset(asset);
    setShowSellDialog(true);
  };

  const handleSellConfirmation = async (asset, amount) => {
    setLoading(true);
    
    try {
      let endpoint, payload;
      
      console.log("Asset type:", asset.type); // Add this for debugging
      
      if (asset.type === "stock") {
        endpoint = "http://localhost:4002/sell-stock";
        payload = {
          stockSymbol: asset.symbol,
          amountToSell: amount,
          recipientAddress: userWallet.address,
        };
      } else {
        endpoint = "http://localhost:4002/sell";
        payload = {
          coinSymbol: asset.symbol,
          amountToSell: amount,
          recipientAddress: userWallet.address,
        };
      }
      
      console.log(`Sending sell request to ${endpoint}:`, payload);
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Transaction failed");
      }
      
      alert(`Successfully sold ${amount} ${asset.symbol}.`);
      
      // Refresh the data
      await Promise.all([
        fetchBalance(),
        fetchPortfolio(),
        fetchMarketData()
      ]);
      
    } catch (error) {
      console.error("Transaction failed:", error);
      alert(`Transaction failed: ${error.message}`);
    } finally {
      setLoading(false);
      setShowSellDialog(false);
    }
  };

  // Prepare portfolio data for display
  const getDisplayPortfolio = () => {
    // Filter based on active tab
    return portfolio
      .filter(item => {
        if (activeTab === "crypto") {
          return isCryptoSymbol(item.symbol);
        } else {
          return isStockSymbol(item.symbol);
        }
      })
      .map(item => {
        const symbol = item.symbol;
        let price = 0;
        let amount = 0;
        
        if (isStockSymbol(symbol)) {
          // This is a stock
          price = marketData?.stocks?.[symbol] || 0;
          amount = parseFloat(item.quantity || '0');
        } else {
          // This is a crypto asset
          const cleanSymbol = symbol.replace('-USD', '');
          price = marketData?.cryptos?.[`${cleanSymbol}-USD`] || 0;
          amount = parseFloat(item.amount || '0');
        }
        
        if (isNaN(amount)) {
          console.warn(`Invalid amount for ${symbol}:`, activeTab === "crypto" ? item.amount : item.quantity);
          amount = 0;
        }
        
        const value = price * amount;
        
        return {
          type: isStockSymbol(symbol) ? 'stock' : 'crypto',
          symbol: isStockSymbol(symbol) ? symbol : symbol.replace('-USD', ''),
          name: isStockSymbol(symbol) ? getStockName(symbol) : getCryptoName(symbol.replace('-USD', '')),
          amount,
          value,
          price,
          originalSymbol: item.originalSymbol // Keep original symbol for reference
        };
      });
  };
  
  // Helper functions to get asset names
  const getStockName = (symbol: string): string => {
    const stockNames: { [key: string]: string } = {
      AAPL: 'Apple Inc.',
      GOOGL: 'Alphabet Inc.',
      TSLA: 'Tesla Inc.',
      AMZN: 'Amazon.com Inc.'
    };
    return stockNames[symbol] || symbol;
  };

  const getCryptoName = (symbol: string): string => {
    const cryptoNames: { [key: string]: string } = {
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      ADA: 'Cardano'
    };
    return cryptoNames[symbol] || symbol;
  };

  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (window.aptos) {
          const isConnected = await window.aptos.isConnected();
          if (isConnected) {
            const account = await window.aptos.account();
            setUserWallet({
              address: account.address,
              publicKey: account.publicKey
            });
            setConnected(true);
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkConnection();
    fetchMarketData();
  }, []);

  useEffect(() => {
    if (connected) {
      fetchBalance();
      fetchPortfolio();
    }
  }, [connected]);

  useEffect(() => {
    if (marketData && portfolio.length > 0) {
      calculatePortfolioValue();
    }
  }, [marketData, portfolio]);

  const displayPortfolio = getDisplayPortfolio();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-black text-white">
        <h1 className="text-3xl font-bold text-white mb-6">Your Portfolio</h1>
        
        <div className="p-4 rounded-lg border border-white/10 bg-black/30 mb-8">
          {!connected ? (
            <div className="flex flex-col items-center py-8">
              <p className="mb-4 text-lg">Connect your wallet to view your portfolio</p>
              <button onClick={connectWallet} className="px-4 py-2 rounded-lg bg-blue-600 text-white">
                Connect Petra Wallet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg text-gray-400">Wallet Address</h3>
                <p className="font-mono text-sm truncate">{userWallet.address}</p>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg text-gray-400">APT Balance</h3>
                <p className="text-2xl font-bold">{balance.toFixed(4)} APT</p>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg text-gray-400">Portfolio Value</h3>
                <p className="text-2xl font-bold">${portfolioValue.toFixed(2)}</p>
              </div>
              <div className="md:col-span-3">
                <button onClick={disconnectWallet} className="px-4 py-2 rounded-lg bg-gray-700 text-white">
                  Disconnect Wallet
                </button>
              </div>
            </div>
          )}
        </div>

        {connected && (
          <>
            <div className="mb-6">
              <div className="flex space-x-4">
                <button
                  className={`px-4 py-2 rounded-lg ${activeTab === "crypto" ? "bg-blue-600" : "bg-gray-700"} text-white`}
                  onClick={() => setActiveTab("crypto")}
                >
                  Cryptocurrencies
                </button>
                <button
                  className={`px-4 py-2 rounded-lg ${activeTab === "stocks" ? "bg-blue-600" : "bg-gray-700"} text-white`}
                  onClick={() => setActiveTab("stocks")}
                >
                  Stocks
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4">
                  {activeTab === "crypto" ? "Your Cryptocurrencies" : "Your Stocks"}
                </h2>
                
                {displayPortfolio.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="bg-gray-800">
                          <th className="px-4 py-2 text-left">Asset</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                          <th className="px-4 py-2 text-right">Price</th>
                          <th className="px-4 py-2 text-right">Value (USD)</th>
                          <th className="px-4 py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayPortfolio.map((item, index) => (
                          <tr key={`${activeTab}-${index}`} className="border-t border-gray-700">
                            <td className="px-4 py-3">
                              <div>
                                <div className="font-semibold">{item.name}</div>
                                <div className="text-sm text-gray-400">{item.symbol}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {item.amount.toFixed(item.type === 'crypto' ? 6 : 2)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              ${item.price.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">
                              ${item.value.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleSell({
                                  type: item.type,
                                  symbol: item.symbol,
                                  name: item.name,
                                  currentPrice: item.price,
                                  price: item.price,
                                  change: 0,
                                  changePercentage: 0,
                                  availableAmount: item.amount
                                })}
                                className="px-3 py-1 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white"
                                disabled={loading}
                              >
                                Sell
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-400 py-4">
                    {activeTab === "crypto" 
                      ? "You don't have any cryptocurrencies in your portfolio." 
                      : "You don't have any stocks in your portfolio."}
                  </p>
                )}
              </div>
            )}

            <div className="mt-8 bg-gray-900 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Portfolio Allocation</h2>
              {displayPortfolio.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg mb-2">Asset Distribution</h3>
                    <div className="bg-gray-800 rounded-lg p-4 h-64 flex items-center justify-center">
                      {/* Placeholder for pie chart */}
                      <p className="text-gray-400">Asset distribution chart will be rendered here</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg mb-2">Performance History</h3>
                    <div className="bg-gray-800 rounded-lg p-4 h-64 flex items-center justify-center">
                      {/* Placeholder for line chart */}
                      <p className="text-gray-400">Performance history chart will be rendered here</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 py-4">
                  Add assets to your portfolio to view allocation charts
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {showSellDialog && selectedAsset && (
        <SellDialog
          asset={selectedAsset}
          onSell={handleSellConfirmation}
          onClose={() => setShowSellDialog(false)}
          userWalletAddress={userWallet?.address}
          adminWalletAddress={adminWalletAddress}
          availableAmount={selectedAsset.availableAmount || 0}
        />
      )}
    </DashboardLayout>
  );
};

export default Portfolio;