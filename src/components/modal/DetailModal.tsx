import React from 'react';

const DetailModal = ({ isOpen, onClose, asset }) => {
  if (!isOpen || !asset) return null;

  // Format monetary values
  const formatCurrency = (value) => {
    if (typeof value === 'string' && value.startsWith('$')) {
      return value;
    }
    return `$${parseFloat(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Sample AI insight data based on the provided JSON
  const getAIInsights = (symbol) => {
    const insights = {
      amazon: {
        AllocatedFunds: "$3333.33",
        CompanyName: "amazon",
        ConfidenceLevel: "Low",
        InvestmentDecision: "SELL",
        MarketAnalysis: {
          Sentiment: "Bullish (Positive), Insight: Negative Sharpe Ratio! Poor risk-adjusted return, indicating high volatility or losses.",
          SharpeRatio: -1.55
        },
        NextDayPredictedPrice: 199.10
      },
      ethereum: {
        AllocatedFunds: "$3333.33",
        CompanyName: "ethereum",
        ConfidenceLevel: "Low",
        InvestmentDecision: "SELL",
        MarketAnalysis: {
          Sentiment: "Bullish (Positive), Insight: Negative Sharpe Ratio! Poor risk-adjusted return, indicating high volatility or losses.",
          SharpeRatio: -0.83
        },
        NextDayPredictedPrice: 17.75
      },
      google: {
        AllocatedFunds: "$3333.33",
        CompanyName: "google",
        ConfidenceLevel: "Low",
        InvestmentDecision: "SELL",
        MarketAnalysis: {
          Sentiment: "Bullish (Positive), Insight: Negative Sharpe Ratio! Poor risk-adjusted return, indicating high volatility or losses.",
          SharpeRatio: -1.25
        },
        NextDayPredictedPrice: 170.13
      },
      tesla: {
        AllocatedFunds: "$3333.33",
        CompanyName: "tesla",
        ConfidenceLevel: "Low",
        InvestmentDecision: "SELL",
        MarketAnalysis: {
          Sentiment: "Bullish (Positive), Insight: Negative Sharpe Ratio! Poor risk-adjusted return, indicating high volatility or losses.",
          SharpeRatio: -0.53
        },
        NextDayPredictedPrice: 275.54
      }
    };

    // Map the asset symbol to the proper key in the insights object
    let key = symbol.toLowerCase();
    if (key === 'aapl') key = 'apple';
    if (key === 'googl') key = 'google';
    if (key === 'tsla') key = 'tesla';
    if (key === 'amzn') key = 'amazon';
    if (key === 'eth') key = 'ethereum';
    if (key === 'btc') key = 'bitcoin';

    return insights[key] || null;
  };

  const aiData = getAIInsights(asset.symbol);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred background overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal content */}
      <div className="relative bg-gray-900 border border-white/10 rounded-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{asset.name}</h2>
              <p className="text-lg text-gray-400">{asset.symbol}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left column - Asset price info */}
            <div className="flex-1">
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Current Price</span>
                  <span className="text-xl font-bold text-white">
                    {formatCurrency(asset.currentPrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-400">Change</span>
                  <span className={`${asset.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)} ({asset.changePercentage.toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* Chart - Use the chart from asset if available */}
              <div className="bg-gray-800 rounded-lg p-4 h-48">
                {asset.chart ? (
                  asset.chart
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-400">Chart visualization</p>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    // You can add your buy logic here or call the parent's buy function
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg"
                >
                  BUY
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    // You can add your sell logic here or call the parent's sell function
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
                >
                  SELL
                </button>
              </div>
            </div>

            {/* Right column - AI insights */}
            <div className="flex-1 bg-gray-800/50 p-4 rounded-lg">
              <h3 className="text-xl font-bold mb-4 text-white">AI Investment Insights</h3>
              
              {aiData ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-400">Allocated Funds:</span>
                    <span className="ml-2 text-white font-medium">{aiData.AllocatedFunds}</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-400">Confidence Level:</span>
                    <span className={`ml-2 font-medium ${
                      aiData.ConfidenceLevel === 'High' ? 'text-green-500' :
                      aiData.ConfidenceLevel === 'Medium' ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {aiData.ConfidenceLevel}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-gray-400">Investment Decision:</span>
                    <span className={`ml-2 font-bold ${
                      aiData.InvestmentDecision === 'BUY' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {aiData.InvestmentDecision}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-gray-400">Next Day Predicted Price:</span>
                    <span className="ml-2 text-white font-medium">
                      {formatCurrency(aiData.NextDayPredictedPrice)}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium mb-1">Market Analysis</h4>
                    <div className="bg-gray-900 p-3 rounded">
                      <div className="mb-2">
                        <span className="text-gray-400">Sharpe Ratio:</span>
                        <span className={`ml-2 font-medium ${aiData.MarketAnalysis.SharpeRatio >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {aiData.MarketAnalysis.SharpeRatio.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{aiData.MarketAnalysis.Sentiment}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">No AI insights available for this asset.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;