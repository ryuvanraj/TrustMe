import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { execSync } from "child_process";

const app = express();
app.use(cors());

const APTOS_CONTRACT = "0x8ed1668c895c1228c1cee850f4ce8d1efb462550772be3e7ed1c2896ec4ff56d";
const MODULE_NAME = "mock_coins";
const ALPHA_VANTAGE_API_KEY = "6SQ7SDS25674KW5G"; // Replace with your actual API key

// Add mock data constants
const MOCK_STOCKS = {
  AAPL: { exact: 175.25, aptos: 1 },
  GOOGL: { exact: 142.65, aptos: 1 },
  AMZN: { exact: 178.35, aptos: 1 }
};

const MOCK_CRYPTOS = {
  "BTC-USD": { exact: 52150.75, aptos: 5 },
  "ETH-USD": { exact: 3275.50, aptos: 3 },
  "ADA-USD": { exact: 0.65, aptos: 1 }
};

// Add cache variables
let cachedStocks = { ...MOCK_STOCKS };
let cachedCryptos = { ...MOCK_CRYPTOS };

// Function to extract the *first integer* of a number
const getFirstInteger = (num) => {
  const numStr = Math.floor(num).toString(); // Convert to string, remove decimals
  return parseInt(numStr[0]); // Extract first digit
};

// Modify the fetchStockPrices function
const fetchStockPrices = async (symbols) => {
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      let stockData = {};
      
      for (const symbol of symbols) {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data["Global Quote"] || !data["Global Quote"]["05. price"]) {
          console.error(`Attempt ${retryCount + 1}: Error fetching ${symbol} data`);
          throw new Error(`Failed to fetch ${symbol} data`);
        }

        const exactPrice = parseFloat(data["Global Quote"]["05. price"]);
        const aptosPrice = getFirstInteger(exactPrice);

        stockData[symbol] = { exact: exactPrice, aptos: aptosPrice };
      }

      // Update cache on successful fetch
      cachedStocks = { ...stockData };
      return stockData;
      
    } catch (error) {
      console.error(`Attempt ${retryCount + 1} failed:`, error);
      retryCount++;
      
      if (retryCount === maxRetries) {
        console.log("Using mock stock data after all retries failed");
        return MOCK_STOCKS;
      }
      
      // Wait 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

// Modify the fetchCryptoPrices function
const fetchCryptoPrices = async () => {
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cardano&vs_currencies=usd";
      const response = await fetch(url);
      const data = await response.json();

      const cryptoData = {
        "BTC-USD": { exact: data.bitcoin.usd, aptos: getFirstInteger(data.bitcoin.usd) },
        "ETH-USD": { exact: data.ethereum.usd, aptos: getFirstInteger(data.ethereum.usd) },
        "ADA-USD": { exact: data.cardano.usd, aptos: getFirstInteger(data.cardano.usd) }
      };

      // Update cache on successful fetch
      cachedCryptos = { ...cryptoData };
      return cryptoData;

    } catch (error) {
      console.error(`Attempt ${retryCount + 1} failed:`, error);
      retryCount++;
      
      if (retryCount === maxRetries) {
        console.log("Using mock crypto data after all retries failed");
        return MOCK_CRYPTOS;
      }
      
      // Wait 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

// Function to update Aptos contract with stock & crypto prices
const updateAptosPrices = async () => {
  try {
    const stocks = await fetchStockPrices(["AAPL", "GOOGL","AMZN"]);
    const cryptos = await fetchCryptoPrices();

    console.log("\n📢 Frontend receives exact values:");
    console.log(
      JSON.stringify(
        {
          stocks: Object.fromEntries(Object.entries(stocks).map(([k, v]) => [k, v.exact])),
          cryptos: Object.fromEntries(Object.entries(cryptos).map(([k, v]) => [k, v.exact])),
        },
        null,
        2
      )
    );

    if (Object.keys(stocks).length === 0) {
      console.error("⚠️ Error: Missing stock prices, skipping Aptos update");
      return;
    }
    if (Object.keys(cryptos).length === 0) {
      console.error("⚠️ Error: Missing crypto prices, skipping Aptos update");
      return;
    }

    console.log("\n🔄 Aptos receives first-integer values:");
    console.log(
      `Stocks: AAPL=${stocks["AAPL"].aptos}, GOOGL=${stocks["GOOGL"].aptos}, AMZN=${stocks["AMZN"].aptos}`
    );
    console.log(
      `Cryptos: BTC=${cryptos["BTC-USD"].aptos}, ETH=${cryptos["ETH-USD"].aptos}, ADA=${cryptos["ADA-USD"].aptos}`
    );

    execSync(
      `aptos move run \
        --function-id "${APTOS_CONTRACT}::${MODULE_NAME}::update_prices" \
        --args u128:${cryptos["BTC-USD"].aptos} u128:${cryptos["ETH-USD"].aptos} u128:${cryptos["ADA-USD"].aptos} \
        --assume-yes \
        --profile default`,
      { stdio: "inherit" }
    );

    execSync(
      `aptos move run \
        --function-id "${APTOS_CONTRACT}::${MODULE_NAME}::update_stock_prices" \
        --args u128:${stocks["AAPL"].aptos} u128:${stocks["GOOGL"].aptos} u128:${stocks["AMZN"].aptos} \
        --assume-yes \
        --profile default`,
      { stdio: "inherit" }
    );

    console.log("\n✅ Stock & Crypto Prices Updated on Aptos");
  } catch (error) {
    console.error("\n❌ Error updating prices on Aptos:", error.message);
  }
};

// Modify the market-data endpoint to include status
app.get("/market-data", async (req, res) => {
  try {
    const stocks = await fetchStockPrices(["AAPL", "GOOGL", "AMZN"]);
    const cryptos = await fetchCryptoPrices();

    res.json({
      success: true,
      data: {
        stocks: Object.fromEntries(Object.entries(stocks).map(([k, v]) => [k, v.exact])),
        cryptos: Object.fromEntries(Object.entries(cryptos).map(([k, v]) => [k, v.exact])),
      },
      isCached: stocks === cachedStocks || cryptos === cachedCryptos
    });
  } catch (error) {
    res.status(200).json({
      success: false,
      data: {
        stocks: Object.fromEntries(Object.entries(cachedStocks).map(([k, v]) => [k, v.exact])),
        cryptos: Object.fromEntries(Object.entries(cachedCryptos).map(([k, v]) => [k, v.exact])),
      },
      isCached: true
    });
  }
});

// Update prices every 20 seconds
setInterval(updateAptosPrices, 200000);
updateAptosPrices();

// Start server
const PORT = 4001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
