
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui-components/Card';
import { BarChart2, TrendingUp, TrendingDown, DollarSign, BriefcaseBusiness } from 'lucide-react';

// Mock market data
const marketData = [
  {
    id: 'sp500',
    name: 'S&P 500',
    value: '4,890.97',
    change: '+0.57%',
    isPositive: true,
  },
  {
    id: 'nasdaq',
    name: 'NASDAQ',
    value: '15,628.04',
    change: '+0.75%',
    isPositive: true,
  },
  {
    id: 'dowjones',
    name: 'Dow Jones',
    value: '38,214.78',
    change: '-0.32%',
    isPositive: false,
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    value: '$62,845.71',
    change: '+2.14%',
    isPositive: true,
  },
  {
    id: 'usd',
    name: 'USD Index',
    value: '102.43',
    change: '-0.08%',
    isPositive: false,
  },
  {
    id: 'vix',
    name: 'VIX',
    value: '18.25',
    change: '-4.12%',
    isPositive: false, // For VIX, down is actually positive for the market
  },
];

interface MarketStatsProps {
  className?: string;
}

const MarketStats: React.FC<MarketStatsProps> = ({ className }) => {
  return (
    <Card variant="glass" className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <BarChart2 className="mr-2 h-5 w-5 text-primary" />
          <CardTitle>Market Stats</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {marketData.map((item) => (
            <div 
              key={item.id} 
              className="group rounded-lg border border-border bg-background p-3 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
            >
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">{item.name}</div>
                <div className="text-lg font-semibold tracking-tight">{item.value}</div>
                <div className={`flex items-center text-sm font-medium ${item.isPositive ? 'text-finance-positive' : 'text-finance-negative'}`}>
                  {item.isPositive ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  {item.change}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketStats;
