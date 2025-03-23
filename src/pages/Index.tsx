import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Hero from '@/components/hero/Hero';
import StockChart from '@/components/charts/StockChart';
import AIInsights from '@/components/insights/AIInsights';
import MarketStats from '@/components/stats/MarketStats';
import ChatButton from '@/components/chat/ChatButton';

const Index = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    // Function to fetch data from the backend
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:4001/market-data'); // Replace with your API endpoint
        const data = await response.json();

        // Transform the data into the format required by `assets`
        const stocks = Object.entries(data.stocks).map(([symbol, price]) => ({
          type: "stock",
          symbol,
          name: `${symbol} Stock`, // Replace with actual name if available
          currentPrice: price,
          change: Math.random() * 5 - 2.5, // Replace with actual change if available
          changePercentage: (Math.random() * 2 - 1).toFixed(2), // Replace with actual percentage if available
        }));

        const cryptos = Object.entries(data.cryptos).map(([symbol, price]) => ({
          type: "crypto",
          symbol: symbol.split('-')[0], // Extract symbol from BTC-USD
          name: `${symbol.split('-')[0]} Cryptocurrency`, // Replace with actual name if available
          currentPrice: price,
          change: Math.random() * 5 - 2.5, // Replace with actual change if available
          changePercentage: (Math.random() * 2 - 1).toFixed(2), // Replace with actual percentage if available
        }));

        setAssets([...stocks, ...cryptos]);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 10000); // Fetch every 10 seconds

    return () => clearInterval(intervalId);
  }, []);

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
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white"
                >
                  BUY
                </button>
                <button
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white"
                >
                  SELL
                </button>
              </div>
            </div>
          ))}
        </div>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-white">AI Investment Insights</h2>
          <AIInsights />
        </section>
      </div>

      <ChatButton />
    </DashboardLayout>
  );
};

export default Index;
