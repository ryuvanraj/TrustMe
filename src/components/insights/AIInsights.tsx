
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui-components/Card';
import { Button } from '@/components/ui-components/Button';
import { AlertCircle, ArrowRight, BarChart2, Lightbulb, TrendingUp } from 'lucide-react';

// Mock recommendations data
const mockInsights = [
  {
    id: 1,
    type: 'stock',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    action: 'buy',
    reason: 'Strong Q4 earnings and upcoming product launches indicate potential growth.',
    confidence: 0.87,
    priceTarget: 210.50,
  },
  {
    id: 2,
    type: 'crypto',
    symbol: 'ETH',
    name: 'Ethereum',
    action: 'hold',
    reason: 'Market volatility expected due to upcoming protocol changes.',
    confidence: 0.72,
    priceTarget: 3900,
  },
  {
    id: 3,
    type: 'stock',
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    action: 'buy',
    reason: 'Increased demand in AI chip market and strong sector performance.',
    confidence: 0.91,
    priceTarget: 880,
  },
  {
    id: 4,
    type: 'crypto',
    symbol: 'SOL',
    name: 'Solana',
    action: 'buy',
    reason: 'Increased network adoption and improved technical performance.',
    confidence: 0.78,
    priceTarget: 145.75,
  },
  {
    id: 5,
    type: 'stock',
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    action: 'buy',
    reason: 'Strong cloud services growth and AI integration across product lines.',
    confidence: 0.85,
    priceTarget: 440,
  },
];

interface AIInsightsProps {
  className?: string;
}

const AIInsights: React.FC<AIInsightsProps> = ({ className }) => {
  const [insights, setInsights] = useState(mockInsights);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'stocks' | 'crypto'>('all');
  
  const filteredInsights = insights.filter(insight => {
    if (activeTab === 'all') return true;
    if (activeTab === 'stocks') return insight.type === 'stock';
    if (activeTab === 'crypto') return insight.type === 'crypto';
    return true;
  });
  
  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      // Shuffle the insights a bit to simulate new data
      setInsights([...mockInsights].sort(() => Math.random() - 0.5));
      setIsLoading(false);
    }, 1200);
  };
  
  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy':
        return 'bg-green-100 text-green-800';
      case 'sell':
        return 'bg-red-100 text-red-800';
      case 'hold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'text-green-600';
    if (confidence > 0.6) return 'text-blue-600';
    return 'text-amber-600';
  };
  
  return (
    <Card className={className} variant="glass">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-primary" />
            <CardTitle>AI Investment Insights</CardTitle>
          </div>
          <div className="flex space-x-2">
            <div className="flex rounded-lg bg-secondary p-1">
              <button
                className={`rounded-md px-3 py-1 text-sm font-medium transition-all ${
                  activeTab === 'all' 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('all')}
              >
                All
              </button>
              <button
                className={`rounded-md px-3 py-1 text-sm font-medium transition-all ${
                  activeTab === 'stocks' 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('stocks')}
              >
                Stocks
              </button>
              <button
                className={`rounded-md px-3 py-1 text-sm font-medium transition-all ${
                  activeTab === 'crypto' 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('crypto')}
              >
                Crypto
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={isLoading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-4">
        <div className="space-y-3">
          {isLoading ? (
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="h-24 rounded-lg bg-gray-100 loading-wave"></div>
            ))
          ) : (
            filteredInsights.slice(0, 3).map((insight) => (
              <div 
                key={insight.id} 
                className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-md"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="relative z-10 flex items-start justify-between">
                  <div>
                    <div className="flex items-center">
                      <span className="mr-2 font-semibold">{insight.symbol}</span>
                      <span className="text-sm text-muted-foreground">{insight.name}</span>
                      <span className={`ml-2 rounded px-2 py-0.5 text-xs font-medium ${getActionColor(insight.action)}`}>
                        {insight.action.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{insight.reason}</p>
                    <div className="mt-2 flex items-center">
                      <div className="flex items-center">
                        <AlertCircle className="mr-1 h-3 w-3 text-muted-foreground" />
                        <span className={`text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                          {(insight.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      <div className="ml-3 flex items-center">
                        <TrendingUp className="mr-1 h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium">
                          Target: ${insight.priceTarget.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      
      <CardFooter className="justify-center pt-2">
        <Button variant="ghost" size="sm" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
          View All Insights
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AIInsights;
