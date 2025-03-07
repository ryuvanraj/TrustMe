
import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui-components/Card';
import { Button } from '@/components/ui-components/Button';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

// Mock data
const generateMockData = (trend: 'up' | 'down' | 'volatile', points = 30) => {
  const data = [];
  let baseValue = 150;
  const volatility = trend === 'volatile' ? 20 : 8;
  const trendFactor = trend === 'up' ? 2 : trend === 'down' ? -2 : 0;
  
  for (let i = 0; i < points; i++) {
    const randomFactor = (Math.random() - 0.5) * volatility;
    baseValue = Math.max(50, baseValue + trendFactor + randomFactor);
    
    data.push({
      timestamp: new Date(Date.now() - (points - i) * 3600000).toISOString(),
      value: baseValue,
    });
  }
  
  return data;
};

// Time filter options
const timeFilters = [
  { label: '1H', value: '1h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: 'All', value: 'all' },
];

interface StockChartProps {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercentage: number;
  trend?: 'up' | 'down' | 'volatile';
  className?: string;
}

const StockChart: React.FC<StockChartProps> = ({
  symbol,
  name,
  currentPrice,
  change,
  changePercentage,
  trend = 'up',
  className,
}) => {
  const [activeFilter, setActiveFilter] = useState('1d');
  const [data, setData] = useState(generateMockData(trend));
  const [isLoading, setIsLoading] = useState(false);
  
  const handleFilterChange = (filter: string) => {
    setIsLoading(true);
    setActiveFilter(filter);
    
    // Simulate loading data
    setTimeout(() => {
      setData(generateMockData(trend, 
        filter === '1h' ? 12 : 
        filter === '1d' ? 24 : 
        filter === '1w' ? 28 : 
        filter === '1m' ? 30 : 40
      ));
      setIsLoading(false);
    }, 500);
  };
  
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    if (activeFilter === '1h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (activeFilter === '1d') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (activeFilter === '1w') {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  const isPositive = change >= 0;
  const chartColor = isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
  
  return (
    <Card className={className} variant="glass">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <div className="flex items-center">
            <CardTitle className="text-lg font-bold">{symbol}</CardTitle>
            <span className="ml-2 text-sm text-muted-foreground">{name}</span>
          </div>
          <div className="mt-1 flex items-center">
            <span className="text-2xl font-semibold">${currentPrice.toFixed(2)}</span>
            <div className={`ml-2 flex items-center ${isPositive ? 'text-finance-positive' : 'text-finance-negative'}`}>
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span className="ml-1 text-sm font-medium">
                {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercentage.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-1">
          {timeFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={activeFilter === filter.value ? "primary" : "outline"}
              size="sm"
              onClick={() => handleFilterChange(filter.value)}
              className="transition-all duration-200"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="h-[240px] w-full">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={`colorGradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatDate} 
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                />
                <YAxis 
                  domain={['dataMin - 10', 'dataMax + 10']} 
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
                  labelFormatter={(label) => formatDate(label as string)}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: 'none',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={chartColor} 
                  strokeWidth={2} 
                  fillOpacity={1}
                  fill={`url(#colorGradient-${symbol})`}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  animationDuration={750}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StockChart;
