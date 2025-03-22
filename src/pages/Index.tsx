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

const Index = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [assets, setAssets] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [userWallet, setUserWallet] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amountToBuy, setAmountToBuy] = useState(20);
  const [stockAmountToBuy, setStockAmountToBuy] = useState(10);
  const [balance, setBalance] = useState(0);
  const [portfolio, setPortfolio] = useState([]);
  const [stockPortfolio, setStockPortfolio] = useState([]);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
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

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4001/market-data');
      const data = await response.json();
      
      if (data && data.success) {
        setMarketData(data.data);
      } else {
        // Transform the data for older API format
        const stocks = Object.entries(data.stocks || {}).map(([symbol, price]) => ({
          type: "stock",
          symbol,
          name: `${symbol} Stock`,
          currentPrice: price,
          price: price,
          change: Math.random() * 5 - 2.5,
          changePercentage: (Math.random() * 2 - 1).toFixed(2),
        }));

        const cryptos = Object.entries(data.cryptos || {}).map(([symbol, price]) => ({
          type: "crypto",
          symbol: symbol.split('-')[0],
          name: `${symbol.split('-')[0]} Cryptocurrency`,
          currentPrice: price,
          price: price,
          change: Math.random() * 5 - 2.5,
          changePercentage: (Math.random() * 2 - 1).toFixed(2),
        }));

        setAssets([...stocks, ...cryptos]);
        setMarketData([...stocks, ...cryptos]);
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
      setMarketData([]);
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
      
      // Extract the necessary components for the function string
      if (!data.pendingTransaction?.payload?.value?.module_name?.address?.address ||
          !data.pendingTransaction?.payload?.value?.module_name?.name?.value ||
          !data.pendingTransaction?.payload?.value?.function_name?.value) {
        throw new Error('Missing transaction components in payload');
      }
      
      // Extract address bytes and convert to hex string
      const addressBytes = data.pendingTransaction.payload.value.module_name.address.address;
      const addressHex = '0x' + Object.values(addressBytes)
        .map(byte => String(byte).padStart(2, '0'))
        .join('');
          
      // Get module and function names
      const moduleName = data.pendingTransaction.payload.value.module_name.name.value;
      const functionName = data.pendingTransaction.payload.value.function_name.value;
      
      // Construct the full function string in the format required by Petra wallet
      const fullFunction = `${addressHex}::${moduleName}::${functionName}`;
      
      // Convert byte array arguments to proper format
      const rawArgs = data.pendingTransaction.payload.value.args || [];
      
      // Convert the first argument (stock index) to a number
      const stockIndexArg = parseInt(String(Object.values(rawArgs[0])[0]));
      
      // Process the second argument (amount) properly - this is critical
      const amountBytes = Object.values(rawArgs[1]);
      
      // Carefully reconstruct the amount value from bytes
      let amountValue = 0;
      for (let i = 0; i < amountBytes.length; i++) {
        // Use multiplication and addition instead of bit shifting
        amountValue = amountValue + (Number(amountBytes[i]) * Math.pow(256, i));
      }
      const amountArg = amountValue.toString();
      
      // Create a properly formatted entry function payload that Petra can understand
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: fullFunction,
        type_arguments: [],
        arguments: [stockIndexArg, amountArg]
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
  const buyStock = async (coinIndex) => {
    console.log("Selected coin index:", coinIndex);
    console.log("Amount to Buy:", amountToBuy);
    console.log("Wallet Address:", userWallet?.address);

    if (!connected || !userWallet) {
      alert('Please connect wallet first');
      return;
    }

    if (coinIndex < 0 || coinIndex >= marketData.length) {
      alert('Invalid coin index');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        coinIndex,
        amountInUSD: Number(amountToBuy),
        walletAddress: userWallet.address
      };

      console.log("Payload sent to backend:", payload);

      // Get transaction payload from backend
      const response = await fetch('http://localhost:4002/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Transaction failed');
      }

      console.log("Received from backend:", data);
      
      // Extract the necessary components for the function string
      if (!data.pendingTransaction?.payload?.value?.module_name?.address?.address ||
          !data.pendingTransaction?.payload?.value?.module_name?.name?.value ||
          !data.pendingTransaction?.payload?.value?.function_name?.value) {
        throw new Error('Missing transaction components in payload');
      }
      
      // Extract address bytes and convert to hex string
      const addressBytes = data.pendingTransaction.payload.value.module_name.address.address;
      const addressHex = '0x' + Object.values(addressBytes)
        .map(byte => byte.toString())
        .join('');
          
      // Get module and function names
      const moduleName = data.pendingTransaction.payload.value.module_name.name.value;
      const functionName = data.pendingTransaction.payload.value.function_name.value;
      
      // Construct the full function string in the format required by Petra wallet
      const fullFunction = `${addressHex}::${moduleName}::${functionName}`;
      
      // Convert byte array arguments to proper format
      const rawArgs = data.pendingTransaction.payload.value.args || [];
      
      // Convert the first argument (coin index) to a number
      const coinIndexArg = parseInt(String(Object.values(rawArgs[0])[0]));
      
      // Convert the second argument (amount) to a string
      // This combines all bytes into a single value
      const amountBytes = Object.values(rawArgs[1]);
      let amountValue: number = 0;
      for (let i = 0; i < amountBytes.length; i++) {
        amountValue += Number(amountBytes[i]) * Math.pow(256, i);
      }
      const amountArg = amountValue.toString();
      
      // Create a properly formatted entry function payload that Petra can understand
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: fullFunction,
        type_arguments: [],
        arguments: [coinIndexArg, amountArg]
      };
      
      console.log("Entry function payload for Petra:", entryFunctionPayload);
      
      // Submit transaction with the correct format
      const signAndSubmitResult = await window.aptos.signAndSubmitTransaction(entryFunctionPayload);

      console.log('Transaction confirmed:', signAndSubmitResult);
      alert(`Successfully purchased ${data.metadata.coin_amount} ${data.metadata.coin_symbol}`);

      // Refresh data
      await Promise.all([
        fetchMarketData(),
        fetchBalance(),
        fetchPortfolio()
      ]);
    } catch (error) {
      console.error('Buy failed:', error);
      alert(`Transaction failed: ${error.message}`);
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

    // Find the asset in the appropriate portfolio
    let availableAmount = 0;
    
    if (asset.type === "stock") {
      const portfolioItem = stockPortfolio.find(item => item.symbol === asset.symbol);
      if (portfolioItem) {
        availableAmount = parseFloat(portfolioItem.quantity || 0);
        setSelectedAsset({...asset, availableAmount});
        setShowSellDialog(true);
      } else {
        alert('You do not own this stock');
      }
    } else {
      const portfolioItem = portfolio.find(item => hexToText(item.symbol) === asset.symbol);
      if (portfolioItem) {
        availableAmount = parseFloat(portfolioItem.amount || 0);
        setSelectedAsset({...asset, availableAmount});
        setShowSellDialog(true);
      } else {
        alert('You do not own this cryptocurrency');
      }
    }
  };

  const handleBuyConfirmation = (asset, amount) => {
    const assetIndex = marketData.findIndex(item => item.symbol === asset.symbol);
    if (assetIndex === -1) {
      alert('Asset not found in market data');
      return;
    }

    if (asset.type === "stock") {
      setStockAmountToBuy(amount);
      buyStock_forstock(assetIndex);
    } else {
      setAmountToBuy(amount);
      buyStock(assetIndex);
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
    const intervalId = setInterval(fetchMarketData, 10000); // Fetch every 10 seconds

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

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-black text-white">
        <Hero className="mb-8 rounded-xl border border-white/10 bg-black/50" />

        <div className="mb-4">
          {!connected ? (
            <button onClick={connectWallet} className="px-4 py-2 rounded-lg bg-blue-600 text-white">
              Connect Petra Wallet
            </button>
          ) : (
            <div className="p-3 rounded-lg border border-white/10 bg-black/30">
              <p className="mb-2">Connected: {userWallet.address}</p>
              <p className="mb-2">Balance: {balance.toFixed(4)} APT</p>
              <button onClick={disconnectWallet} className="px-4 py-2 rounded-lg bg-gray-700 text-white">
                Disconnect Wallet
              </button>
            </div>
          )}
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

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredAssets.map((asset) => (
              <div key={asset.symbol} className="bg-gray-900 p-4 rounded-lg shadow-lg">
                <StockChart
                  symbol={asset.symbol}
                  name={asset.name}
                  currentPrice={asset.currentPrice}
                  change={asset.change}
                  changePercentage={asset.changePercentage}
                />
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => handleBuy(asset)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white"
                    disabled={loading}
                  >
                    BUY
                  </button>
                  <button
                    onClick={() => handleSell(asset)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white"
                    disabled={loading}
                  >
                    SELL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <section className="mt-8">
          <h2 className="mb-4 text-2xl font-bold text-white">Your Portfolio</h2>
          {connected ? (
            <div className="bg-gray-900 p-4 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4">Cryptocurrencies</h3>
              {portfolio.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-gray-800">
                        <th className="px-4 py-2 text-left">Symbol</th>
                        <th className="px-4 py-2 text-left">Amount</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.map((item, index) => (
                        <tr key={`crypto-${index}`} className="border-t border-gray-700">
                          <td className="px-4 py-2">{hexToText(item.symbol)}</td>
                          <td className="px-4 py-2">{item.displayAmount || item.amount}</td>
                          <td className="px-4 py-2 text-right">
                            <button
                              onClick={() => sellStock(index, false)}
                              className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white"
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
                <p className="text-gray-400">No cryptocurrencies in your portfolio.</p>
              )}

              <h3 className="text-xl font-bold mb-4 mt-6">Stocks</h3>
              {stockPortfolio.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-gray-800">
                        <th className="px-4 py-2 text-left">Symbol</th>
                        <th className="px-4 py-2 text-left">Quantity</th>
                        <th className="px-4 py-2 text-left">Price</th>
                        <th className="px-4 py-2 text-left">Value</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockPortfolio.map((item, index) => (
                        <tr key={`stock-${index}`} className="border-t border-gray-700">
                          <td className="px-4 py-2">{item.symbol}</td>
                          <td className="px-4 py-2">{item.displayQuantity || item.quantity}</td>
                          <td className="px-4 py-2">${item.displayPrice || item.price}</td>
                          <td className="px-4 py-2">${item.value}</td>
                          <td className="px-4 py-2 text-right">
                            <button
                              onClick={() => sellStock(index, true)}
                              className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white"
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
                <p className="text-gray-400">No stocks in your portfolio.</p>
              )}
            </div>
          ) : (
            <p className="text-gray-400">Connect your wallet to view your portfolio.</p>
          )}
        </section>

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