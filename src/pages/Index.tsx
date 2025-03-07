
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Hero from '@/components/hero/Hero';
import StockChart from '@/components/charts/StockChart';
import AIInsights from '@/components/insights/AIInsights';
import MarketStats from '@/components/stats/MarketStats';
import ChatButton from '@/components/chat/ChatButton';

const Index = () => {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Hero className="mb-8 rounded-xl border" />
        
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Market Statistics</h2>
          <MarketStats />
        </section>
        
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Trading Insights</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <StockChart
              symbol="AAPL"
              name="Apple Inc."
              currentPrice={184.92}
              change={2.45}
              changePercentage={1.34}
              trend="up"
            />
            <StockChart
              symbol="NVDA"
              name="NVIDIA Corporation"
              currentPrice={824.18}
              change={15.37}
              changePercentage={1.9}
              trend="up"
            />
          </div>
        </section>
        
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">AI Investment Insights</h2>
          <AIInsights />
        </section>
        
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Market Analysis</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <StockChart
              symbol="TSLA"
              name="Tesla, Inc."
              currentPrice={217.58}
              change={-4.23}
              changePercentage={-1.91}
              trend="down"
            />
            <StockChart
              symbol="BTC"
              name="Bitcoin"
              currentPrice={62845.71}
              change={1321.48}
              changePercentage={2.14}
              trend="volatile"
            />
          </div>
        </section>
      </div>
      
      <ChatButton />
    </DashboardLayout>
  );
};

export default Index;
