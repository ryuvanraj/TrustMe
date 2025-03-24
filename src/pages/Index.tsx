/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { AptosClient } from "aptos";
import DashboardLayout from '@/components/layout/DashboardLayout';
import Hero from '@/components/hero/Hero';
import StockChart from '@/components/charts/StockChart';
import AIInsights from '@/components/insights/AIInsights';
import MarketStats from '@/components/stats/MarketStats';
import ChatButton from '@/components/chat/ChatButton';
import { BuyDialog, SellDialog } from '@/components/transactions/TransactionDialogs';
import DetailModal from '@/components/modal/DetailModal';
import Portfolio from '@/pages/Portfolio';
// Add interfaces near the top of your file
interface MarketAsset {
  type: 'stock' | 'crypto';
  symbol: string;
  name: string;
  currentPrice: number;
  price: number;
  change: number;
  changePercentage: number;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [assets, setAssets] = useState([]);
  const [marketData, setMarketData] = useState<{
    [x: string]: any; stocks: { [key: string]: number }, cryptos: { [key: string]: number } 
} | null>(null);
  const [userWallet, setUserWallet] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amountToBuy, setAmountToBuy] = useState(20);
  const [stockAmountToBuy, setStockAmountToBuy] = useState(10);
  const [riskType, setRiskType] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
  const [balance, setBalance] = useState(0);
  const [portfolio, setPortfolio] = useState([]);
  const [selectedModalAsset, setSelectedModalAsset] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [stockPortfolio, setStockPortfolio] = useState([]);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  // Add this state variable at the top of your component, along with your other useState declarations
const [expandedAsset, setExpandedAsset] = useState<MarketAsset | null>(null);
  const [adminWalletAddress, setAdminWalletAddress] = useState("0x601093cf230a092efc6706a3198d6fe2c7bbfc3b79eab0393e3a7d4b03eb2154"); // Replace with your admin wallet

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

  const MOCK_MARKET_DATA = {
    stocks: {
      AAPL: 175.25,
      GOOGL: 142.65,
      AMZN: 178.35
    },
    cryptos: {
      "BTC-USD": 52150.75,
      "ETH-USD": 3275.50,
      "ADA-USD": 0.65
    }
  };

  // Add this function to transform market data into assets
  const transformMarketData = (marketData: any): MarketAsset[] => {
    const assets: MarketAsset[] = [];

    // Transform stocks
    if (marketData?.stocks) {
      Object.entries(marketData.stocks).forEach(([symbol, price]: [string, any]) => {
        const prevPrice = price * (1 - (Math.random() * 0.1)); // Simulate previous price
        const change = price - prevPrice;
        assets.push({
          type: 'stock',
          symbol,
          name: getStockName(symbol),
          currentPrice: price,
          price,
          change,
          changePercentage: (change / prevPrice) * 100
        });
      });
    }

    // Transform cryptos
    if (marketData?.cryptos) {
      Object.entries(marketData.cryptos).forEach(([symbol, price]: [string, any]) => {
        const cleanSymbol = symbol.replace('-USD', '');
        const prevPrice = price * (1 - (Math.random() * 0.1)); // Simulate previous price
        const change = price - prevPrice;
        assets.push({
          type: 'crypto',
          symbol: cleanSymbol,
          name: getCryptoName(cleanSymbol),
          currentPrice: price,
          price,
          change,
          changePercentage: (change / prevPrice) * 100
        });
      });
    }

    return assets;
  };

  // Helper functions to get asset names
  const getStockName = (symbol: string): string => {
    const stockNames: { [key: string]: string } = {
      AAPL: 'Apple Inc.',
      GOOGL: 'Alphabet Inc.',
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

  // Modify your fetchMarketData function
  const fetchMarketData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4001/market-data');
      const data = await response.json();
      
      if (data && data.success) {
        setMarketData(data.data);
        const transformedAssets = transformMarketData(data.data);
        setAssets(transformedAssets);
        
        // Cache the successful response
        localStorage.setItem('lastMarketData', JSON.stringify(data.data));
        localStorage.setItem('lastFetchTime', Date.now().toString());
      } else {
        // Try to get cached data
        const cachedData = localStorage.getItem('lastMarketData');
        const lastFetchTime = localStorage.getItem('lastFetchTime');
        const fiveMinutes = 5 * 60 * 1000;

        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          setMarketData(parsedData);
          const transformedAssets = transformMarketData(parsedData);
          setAssets(transformedAssets);
          console.log('Using cached market data');

          // If last fetch was more than 5 minutes ago, schedule a retry
          if (lastFetchTime && Date.now() - parseInt(lastFetchTime) > fiveMinutes) {
            setTimeout(fetchMarketData, 5000); // Retry after 5 seconds
          }
        } else {
          // If no cached data, use mock data
          setMarketData(MOCK_MARKET_DATA);
          const transformedAssets = transformMarketData(MOCK_MARKET_DATA);
          setAssets(transformedAssets);
          console.log('Using mock market data');
        }
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
      // Use cached or mock data as fallback
      const cachedData = localStorage.getItem('lastMarketData');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setMarketData(parsedData);
        const transformedAssets = transformMarketData(parsedData);
        setAssets(transformedAssets);
      } else {
        setMarketData(MOCK_MARKET_DATA);
        const transformedAssets = transformMarketData(MOCK_MARKET_DATA);
        setAssets(transformedAssets);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolio = async () => {
    if (!userWallet) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4002/portfolio?walletAddress=${userWallet.address}`);
      const data = await response.json();
      if (data && data.success) {
        setPortfolio(data.data);
      } else {
        setPortfolio([]);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockPortfolio = async () => {
    if (!userWallet) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4002/stock-portfolio?walletAddress=${userWallet.address}`);
      const data = await response.json();
      if (data && data.success) {
        setStockPortfolio(data.data);
      } else {
        setStockPortfolio([]);
      }
    } catch (error) {
      console.error('Error fetching stock portfolio:', error);
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
        fetchPortfolio(),
        fetchStockPortfolio()
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
      setStockPortfolio([]);
      
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      alert('Failed to disconnect wallet');
    }
  };

  // Function to buy stocks
  const buyStock_forstock = async (stockIndex) => {
    console.log("Selected stock index:", stockIndex);
    console.log("Amount to Buy:", stockAmountToBuy);
    console.log("Wallet Address:", userWallet?.address);
  
    if (!connected || !userWallet) {
      alert('Please connect wallet first');
      return;
    }
  
    setLoading(true);
    try {
      // Convert to a regular number for safe JSON serialization
      const amountAsNumber = parseFloat(stockAmountToBuy.toString());
      
      const payload = {
        stockIndex,
        amountInUSD: amountAsNumber.toString(), // Convert to string for safe JSON serialization
        walletAddress: userWallet.address
      };
  
      console.log("Payload sent to backend:", payload);
  
      // Get transaction payload from backend
      const response = await fetch('http://localhost:4002/buy-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  
      const data = await response.json();
  
      if (!data.success) {
        throw new Error(data.error || 'Transaction failed');
      }
  
      console.log("Received from backend:", data);
      
      // Instead of trying to extract and reconstruct the function identifier from the response,
      // directly use the known correct function identifier
      const moduleAddress = '0x8ed1668c895c1228c1cee850f4ce8d1efb462550772be3e7ed1c2896ec4ff56d';
      const moduleName = 'mock_coins'; // Adjust if needed
      const functionName = 'buy_stock'; // Adjust if needed
      
      // Construct the full function string in the format required by Petra wallet
      const fullFunction = `${moduleAddress}::${moduleName}::${functionName}`;
      
      // Create a properly formatted entry function payload that Petra can understand
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: fullFunction,
        type_arguments: [],
        arguments: [stockIndex, amountAsNumber.toString()]
      };
      
      console.log("Entry function payload for Petra:", entryFunctionPayload);
      
      // Submit transaction with the correct format
      const signAndSubmitResult = await window.aptos.signAndSubmitTransaction(entryFunctionPayload);
  
      console.log('Transaction confirmed:', signAndSubmitResult);
      alert(`Successfully purchased stock! You bought approximately ${amountAsNumber} units of stock.`);
  
      // Refresh data
      await Promise.all([
        fetchMarketData(),
        fetchBalance(),
        fetchPortfolio(),
        fetchStockPortfolio()
      ]);
    } catch (error) {
      console.error('Buy failed:', error);
      alert(`Transaction failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to buy cryptocurrencies
  // Function to buy cryptocurrencies - revised version
const buyStock = async (cryptoIndex, amountInUSD, walletAddress) => {
  if (!connected || !userWallet) {
    alert('Please connect wallet first');
    return;
  }

  setLoading(true);
  try {
    console.log('Buying crypto:', cryptoIndex, amountInUSD, walletAddress);
    const response = await fetch('http://localhost:4002/buy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coinIndex: cryptoIndex,
        amountInUSD,
        walletAddress,
      }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Transaction failed');
    }
    
    console.log('Transaction generated:', data.pendingTransaction);
    
    // Construct a properly formatted entry function payload for Petra
    const moduleAddress = '0x8ed1668c895c1228c1cee850f4ce8d1efb462550772be3e7ed1c2896ec4ff56d';
    const moduleName = 'mock_coins'; // Adjust if your module name is different
    const functionName = 'buy_coin'; // Adjust based on your module's function name
    
    const entryFunctionPayload = {
      type: "entry_function_payload",
      function: `${moduleAddress}::${moduleName}::${functionName}`,
      type_arguments: [],
      arguments: [cryptoIndex, amountInUSD.toString()]
    };
    
    console.log("Entry function payload for Petra:", entryFunctionPayload);
    
    // Submit transaction to Petra wallet
    const signAndSubmitResult = await window.aptos.signAndSubmitTransaction(entryFunctionPayload);
    
    console.log('Transaction confirmed:', signAndSubmitResult);
    alert(`Successfully purchased cryptocurrency! You bought approximately ${amountInUSD} USD worth of crypto.`);
    
    // Refresh data
    await Promise.all([
      fetchMarketData(),
      fetchBalance(),
      fetchPortfolio()
    ]);
    
    return data;
  } catch (error) {
    console.error('Error buying crypto:', error);
    alert(`Transaction failed: ${error.message}`);
    throw error;
  } finally {
    setLoading(false);
  }
};

  // Function to sell assets (both crypto and stocks)
  const sellStock = async (index, isStock = false) => {
    if (!connected || !userWallet) {
      alert("Please connect your wallet first.");
      return;
    }
    
    try {
      // Determine which portfolio to use
      const portfolioToUse = isStock ? stockPortfolio : portfolio;
      
      if (index < 0 || index >= portfolioToUse.length) {
        alert("Invalid asset index.");
        return;
      }
      
      // Get the token from the appropriate portfolio
      const token = portfolioToUse[index];
      const tokenSymbol = isStock ? token.symbol : hexToText(token.symbol);
      const availableAmount = isStock ? parseFloat(token.quantity) : parseFloat(token.amount);
      
      // Check if this is one of the stock symbols
      const isStockSymbol = ['AAPL', 'GOOGL', 'AMZN'].includes(tokenSymbol);
      
      // Determine which endpoint to use
      const endpoint = isStockSymbol 
        ? "http://localhost:4002/sell-stock" 
        : "http://localhost:4002/sell";
      
      // Prompt user for amount to sell
      const amountToSell = prompt(`Enter the amount to sell for ${tokenSymbol} (Available: ${availableAmount}):`);
      const amountToSellNumber = parseFloat(amountToSell);
      if (!amountToSell || isNaN(amountToSellNumber) || amountToSellNumber <= 0 || amountToSellNumber > availableAmount) {
        alert("Invalid amount entered.");
        return;
      }
      
      setLoading(true);
      
      // Prepare the payload based on endpoint type
      const payload = isStockSymbol
        ? {
            stockSymbol: tokenSymbol,
            amountToSell: parseFloat(amountToSell),
            recipientAddress: userWallet.address,
          }
        : {
            coinSymbol: tokenSymbol,
            amountToSell: parseFloat(amountToSell),
            recipientAddress: userWallet.address,
          };
      
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
      
      alert(`Successfully sold ${amountToSell} ${tokenSymbol}.`);
      
      // Refresh the appropriate data
      await Promise.all([
        fetchBalance(),
        fetchPortfolio(),
        fetchStockPortfolio()
      ]);
    } catch (error) {
      console.error("Transaction failed:", error);
      alert(`Transaction failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const handleCardClick = (asset: MarketAsset) => {
    // If the clicked asset is already expanded, collapse it, otherwise expand it
    setExpandedAsset(expandedAsset?.symbol === asset.symbol ? null : asset);
  };
  // Function to handle purchasing based on asset type
  const handleBuy = (asset) => {
    if (!connected) {
      alert('Please connect your wallet first');
      return connectWallet();
    }
    
    setSelectedAsset(asset);
    setShowBuyDialog(true);
  };

  // Function to handle selling assets from portfolio
  const handleSell = (asset) => {
    if (!connected) {
      alert('Please connect your wallet first');
      return connectWallet();
    }
    
    console.log("Portfolio data:", portfolio); // Debug log to see portfolio structure
    console.log("Stock portfolio data:", stockPortfolio); // Debug log to see stock portfolio structure
    
    // Find the asset in the portfolio - regardless of type, since it all comes from the same endpoint
    const portfolioItem = portfolio.find(item => {
      const itemSymbol = item.symbol || "";
      // Check if the symbol matches either directly or after hexToText conversion
      return itemSymbol === asset.symbol || hexToText(itemSymbol) === asset.symbol;
    });
    
    console.log("Found portfolio item for", asset.symbol, ":", portfolioItem); // Debug log
    
    if (portfolioItem) {
      // Try to extract amount from various possible fields
      let availableAmount = parseFloat(
        portfolioItem.quantity || // Try quantity field first
        portfolioItem.amount || // Then try amount field
        portfolioItem.balance || // Then try balance field
        0 // Default to 0 if none found
      );
      
      console.log("Available amount for", asset.symbol, ":", availableAmount); // Debug log
      
      // Make sure availableAmount is a valid number
      if (isNaN(availableAmount)) {
        availableAmount = 0;
      }
      
      setSelectedAsset({...asset, availableAmount});
      setShowSellDialog(true);
    } else {
      alert(`You do not own ${asset.symbol}`);
    }
  };

  const handleBuyConfirmation = (asset, amount) => {
    // Since marketData is not an array but an object, we need to find the corresponding index
    
    if (asset.type === "stock") {
      // Map the stock symbol to a stock index (0 for AAPL, 1 for GOOGL, 2 for AMZN, etc.)
      // This mapping should match what your backend expects
      const stockMapping = {
        'AAPL': 0,
        'GOOGL': 1,
        'AMZN': 2
        // Add other stocks as needed
      };
      
      const stockIndex = stockMapping[asset.symbol];
      
      if (stockIndex !== undefined) {
        setStockAmountToBuy(amount);
        buyStock_forstock(stockIndex);
      } else {
        alert('Stock not found in market data');
        return;
      }
    } else {
      // For crypto, similar hardcoded mapping approach
      const cryptoMapping = {
        'BTC': 0,
        'ETH': 1,
        'ADA': 2
        // Add other cryptos as needed
      };
      
      const cryptoIndex = cryptoMapping[asset.symbol];
      
      if (cryptoIndex !== undefined) {
        setAmountToBuy(amount);
        buyStock(cryptoIndex, amount, userWallet.address);
      } else {
        alert('Cryptocurrency not found in market data');
        return;
      }
    }
  };

  const handleSellConfirmation = (asset, amount) => {
    // Find the asset in the appropriate portfolio
    if (asset.type === "stock") {
      const portfolioIndex = stockPortfolio.findIndex(item => item.symbol === asset.symbol);
      if (portfolioIndex !== -1) {
        // Modified to use the amount from dialog instead of prompting
        const amountToSellNumber = amount;
        const payload = {
          stockSymbol: asset.symbol,
          amountToSell: amountToSellNumber,
          recipientAddress: userWallet.address,
        };
        
        sellWithPayload(payload, "http://localhost:4002/sell-stock", asset.symbol, amountToSellNumber);
      }
    } else {
      const portfolioIndex = portfolio.findIndex(item => hexToText(item.symbol) === asset.symbol);
      if (portfolioIndex !== -1) {
        // Modified to use the amount from dialog instead of prompting
        const amountToSellNumber = amount;
        const payload = {
          coinSymbol: asset.symbol,
          amountToSell: amountToSellNumber,
          recipientAddress: userWallet.address,
        };
        
        sellWithPayload(payload, "http://localhost:4002/sell", asset.symbol, amountToSellNumber);
      }
    }
  };

  const sellWithPayload = async (payload, endpoint, symbol, amount) => {
    setLoading(true);
    
    try {
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
      
      alert(`Successfully sold ${amount} ${symbol}.`);
      
      // Refresh the appropriate data
      await Promise.all([
        fetchBalance(),
        fetchPortfolio(),
        fetchStockPortfolio()
      ]);
    } catch (error) {
      console.error("Transaction failed:", error);
      alert(`Transaction failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();

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
            await Promise.all([
              fetchBalance(),
              fetchPortfolio(),
              fetchStockPortfolio()
            ]);
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkConnection();
    const intervalId = setInterval(fetchMarketData, 300000); // Fetch every 5 minutes

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (connected) {
      fetchBalance();
      fetchPortfolio();
      fetchStockPortfolio();
    }
  }, [connected]);

  const filteredAssets = assets.filter((asset) => {
    if (activeTab === "all") return true;
    if (activeTab === "stocks") return asset.type === "stock";
    if (activeTab === "crypto") return asset.type === "crypto";
    return asset.symbol === activeTab;
  });

  useEffect(() => {
    const storedRiskType = localStorage.getItem("riskType");
    if (storedRiskType) {
      setRiskType(storedRiskType);
    }
  }, []);

  // Function to handle risk type selection
  const handleRiskTypeClick = (type: string) => {
    setRiskType(type); // Update the state
    localStorage.setItem("riskType", type); // Save to local storage
    setIsDropdownOpen(false); // Close the dropdown
  };

  const openDetailModal = (asset) => {
    setSelectedModalAsset(asset);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedModalAsset(null);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-black text-white">
        <Hero className="mb-8 rounded-xl border border-white/10 bg-black/50" />
        <div className="p-3 rounded-lg border border-white/10 bg-black/30">
  <div className="mb-4 flex items-center gap-4">
    {/* Connect Wallet Section */}
    {!connected ? (
      <button onClick={connectWallet} className="px-4 py-2 rounded-lg bg-blue-600 text-white">
        Connect Petra Wallet
      </button>
    ) : (
      <div>
        <p className="mb-1 text-white">Connected: {userWallet.address}</p>
        <p className="mb-1 text-white">Balance: {balance.toFixed(4)} APT</p>
        <button onClick={disconnectWallet} className="px-4 py-2 rounded-lg bg-gray-700 text-white">
          Disconnect Wallet
        </button>
      </div>
    )}

    {/* Risk Type Dropdown */}
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="px-4 py-2 rounded-lg bg-blue-500 text-white"
      >
        Risk Type: {riskType || "Select"}
      </button>

      {isDropdownOpen && (
        <div className="absolute mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <button
            onClick={() => handleRiskTypeClick("Low Risk")}
            className={`block w-full text-left px-4 py-2 ${
              riskType === "Low Risk" ? "bg-green-500 text-white" : "hover:bg-gray-100"
            }`}
          >
            Low Risk
          </button>
          <button
            onClick={() => handleRiskTypeClick("High Risk")}
            className={`block w-full text-left px-4 py-2 ${
              riskType === "High Risk" ? "bg-red-500 text-white" : "hover:bg-gray-100"
            }`}
          >
            High Risk
          </button>
        </div>
      )}
    </div>
  </div>
</div>
<div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-white">Market Overview</h2>
          <div className="flex space-x-4">
            <button
              className={`px-4 py-2 rounded-lg ${activeTab === "all" ? "bg-blue-600" : "bg-gray-700"} text-white`}
              onClick={() => setActiveTab("all")}
            >
              All
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${activeTab === "stocks" ? "bg-blue-600" : "bg-gray-700"} text-white`}
              onClick={() => setActiveTab("stocks")}
            >
              Stocks
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${activeTab === "crypto" ? "bg-blue-600" : "bg-gray-700"} text-white`}
              onClick={() => setActiveTab("crypto")}
            >
              Crypto
            </button>
          </div>
        </div>


        
<div className="relative">
      {/* Blur overlay that appears when a card is expanded */}
      {expandedAsset && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-10"
          onClick={() => setExpandedAsset(null)}
        />
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredAssets.map((asset) => (
            <div 
              key={asset.symbol} 
              className={`
                bg-gray-900 rounded-lg shadow-lg transition-all duration-300
                ${expandedAsset?.symbol === asset.symbol 
                  ? "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 h-5/6 z-20 overflow-auto p-6" 
                  : "p-4 cursor-pointer"}
              `}
              onClick={() => handleCardClick(asset)}
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold">{asset.name}</h3>
                  <p className="text-gray-400">{asset.symbol}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">${asset.currentPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}</p>
                  <p className={`text-sm ${asset.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)} ({asset.changePercentage.toFixed(2)}%)
                  </p>
                </div>
              </div>
              
              <StockChart
                symbol={asset.symbol}
                name={asset.name}
                currentPrice={asset.currentPrice}
                change={asset.change}
                changePercentage={asset.changePercentage}
              />
              
              {/* More detailed information shown only when expanded */}
              {expandedAsset?.symbol === asset.symbol && (
                <div className="mt-6 border-t border-gray-700 pt-4">
                  <h4 className="text-lg font-semibold mb-2">Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400">Market Cap</p>
                      <p className="font-medium">${(asset.currentPrice * 1000000).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">24h Volume</p>
                      <p className="font-medium">${(asset.currentPrice * 100000).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">52-Week High</p>
                      <p className="font-medium">${(asset.currentPrice * 1.5).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">52-Week Low</p>
                      <p className="font-medium">${(asset.currentPrice * 0.7).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className={`${expandedAsset?.symbol === asset.symbol ? "mt-6" : "mt-4"} flex justify-between`}>
                {/* Stop propagation to prevent closing the expanded view when clicking buttons */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBuy(asset);
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white"
                  disabled={loading}
                >
                  BUY
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSell(asset);
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white"
                  disabled={loading}
                >
                  SELL
                </button>
              </div>
              
              {/* Close button only visible in expanded view */}
              {expandedAsset?.symbol === asset.symbol && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedAsset(null);
                  }}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700"
                >
                  <span className="text-lg">&times;</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>


        <section className="mt-8 mb-8">
          <h2 className="mb-4 text-2xl font-bold text-white">AI Investment Insights</h2>
          <AIInsights />
        </section>
      </div>

      {showBuyDialog && selectedAsset && (
        <BuyDialog
          asset={selectedAsset}
          onBuy={handleBuyConfirmation}
          onClose={() => setShowBuyDialog(false)}
          userWalletAddress={userWallet?.address}
          adminWalletAddress={adminWalletAddress}
        />
      )}

      {showSellDialog && selectedAsset && (
        <SellDialog
          asset={selectedAsset}
          onSell={handleSellConfirmation}
          onClose={() => setShowSellDialog(false)}
          userWalletAddress={userWallet?.address}
          adminWalletAddress={adminWalletAddress}
          availableAmount={selectedAsset.availableAmount}
        />
      )}

      <ChatButton />
    </DashboardLayout>
  );
};

export default Index;