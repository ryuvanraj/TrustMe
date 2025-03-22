
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Hero from '@/components/hero/Hero';
import StockChart from '@/components/charts/StockChart';
import AIInsights from '@/components/insights/AIInsights';
import MarketStats from '@/components/stats/MarketStats';
import ChatButton from '@/components/chat/ChatButton';

const Index = () => {
  function handleFilterChange(arg0: string, p0: string): void {
    throw new Error('Function not implemented.');
  }
  const [activeTab, setActiveTab] = useState("all");

  const assets = [
    { type: "stock", symbol: "AAPL", name: "Apple Inc.", currentPrice: 184.92, change: 2.45, changePercentage: 1.34 },
    { type: "stock", symbol: "GOOGL", name: "Google LLC", currentPrice: 824.18, change: 15.37, changePercentage: 1.9 },
    { type: "stock", symbol: "AMZN", name: "Amazon.com, Inc.", currentPrice: 324.51, change: -23.45, changePercentage: -0.72 },
    { type: "crypto", symbol: "BTC", name: "Bitcoin", currentPrice: 145.71, change: 13.48, changePercentage: 2.14 },
    { type: "crypto", symbol: "ETH", name: "Ethereum", currentPrice: 213.58, change: -1.23, changePercentage: -0.57 },
    { type: "crypto", symbol: "ADA", name: "Cardano", currentPrice: 1.23, change: 0.12, changePercentage: 0.98 },
  ];

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
