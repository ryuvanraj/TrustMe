/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui-components/Card";
import { Button } from "@/components/ui-components/Button";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface TimeFilter {
  label: string;
  value: string;
}

interface StockChartProps {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercentage: number;
  trend?: "up" | "down" | "volatile";
  timeFilters?: TimeFilter[];
  className?: string;
}

const defaultTimeFilters: TimeFilter[] = [
  { label: "1H", value: "1h" },
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
  { label: "1M", value: "1m" },
  { label: "All", value: "all" },
];

const fetchStockData = async (symbol: string, interval: string) => {
  const apiKey = "cXfo8JJCnKvxpptPu9oHEdgDKqCR3l2p"; // Replace with your API key
  const intervalMap: Record<string, { multiplier: number; timespan: string }> = {
    "1h": { multiplier: 1, timespan: "minute" },
    "1d": { multiplier: 5, timespan: "minute" },
    "1w": { multiplier: 30, timespan: "minute" },
    "1m": { multiplier: 1, timespan: "day" },
    all: { multiplier: 1, timespan: "day" },
  };

  const { multiplier, timespan } = intervalMap[interval];
  const now = new Date();
  const endDate = now.toISOString().split("T")[0];
  const startDate = new Date(now.setDate(now.getDate() - 30)).toISOString().split("T")[0];

  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${startDate}/${endDate}?adjusted=true&sort=asc&apiKey=${apiKey}`;

  try {
    const response = await axios.get(url);
    const results = response.data.results || [];

    return results.map((item: { t: number; o: number }) => ({
      timestamp: new Date(item.t).toISOString(),
      value: item.o,
    }));
  } catch (error) {
    console.error("Error fetching stock data:", error);
    throw error;
  }
};

const isValidNumber = (value: any): value is number => {
  return typeof value === "number" && !isNaN(value);
};

const StockChart: React.FC<StockChartProps> = ({
  symbol,
  name,
  currentPrice,
  change,
  changePercentage,
  trend = "up",
  timeFilters = defaultTimeFilters,
  className,
}) => {
  const percentage = isValidNumber(changePercentage) ? changePercentage : 0;
  const [activeFilter, setActiveFilter] = useState("1d");
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilterChange = async (filter: string) => {
    setIsLoading(true);
    setError(null);
    setActiveFilter(filter);

    try {
      const stockData = await fetchStockData(symbol, filter);
      setData(stockData);
    } catch (error) {
      setError("Failed to fetch stock data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleFilterChange(activeFilter);
  }, []);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    if (activeFilter === "1h" || activeFilter === "1d") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (activeFilter === "1w") {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const isPositive = change >= 0;
  const chartColor = isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)";

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
        <div
          className={`ml-2 flex items-center ${
            change >= 0 ? "text-finance-positive" : "text-finance-negative"
          }`}
        >
          {change >= 0 ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
          <span className="ml-1 text-sm font-medium">
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)} ({change >= 0 ? "+" : ""}
            {percentage.toFixed(2)}%)
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
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
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
                  axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
                />
                <YAxis
                  domain={["dataMin - 10", "dataMax + 10"]}
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, "Price"]}
                  labelFormatter={(label) => formatDate(label as string)}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    border: "none",
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
                  animationDuration={800}
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
