import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { execSync } from "child_process";

const app = express();
app.use(cors());

const APTOS_CONTRACT = "0x8ed1668c895c1228c1cee850f4ce8d1efb462550772be3e7ed1c2896ec4ff56d";
const MODULE_NAME = "mock_coins";
const ALPHA_VANTAGE_API_KEY = "HSDYXK8BTKVDLIM5"; // Replace with your actual API key

// Function to extract the *first integer* of a number
const getFirstInteger = (num) => {
  const numStr = Math.floor(num).toString(); // Convert to string, remove decimals
  return parseInt(numStr[0]); // Extract first digit
};

// Function to fetch stock prices from Alpha Vantage
const fetchStockPrices = async (symbols) => {
  try {
    let stockData = {};
    
    for (const symbol of symbols) {
      const url = ⁠ https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY} ⁠;
      const response = await fetch(url);
      const data = await response.json();

      if (!data["Global Quote"] || !data["Global Quote"]["05. price"]) {
        console.error(⁠ Error fetching ${symbol} data: ⁠, data);
        continue;
      }

      const exactPrice = parseFloat(data["Global Quote"]["05. price"]);
      const aptosPrice = getFirstInteger(exactPrice); // ✅ Extract first integer only

      stockData[symbol] = { exact: exactPrice, aptos: aptosPrice };
    }

    return stockData;
  } catch (error) {
    console.error("Error fetching stock prices:", error);
    return {};
  }
};

// Function to fetch crypto prices from CoinGecko
const fetchCryptoPrices = async () => {
  try {
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cardano&vs_currencies=usd";
    const response = await fetch(url);
    const data = await response.json();

    return {
      "BTC-USD": { exact: data.bitcoin.usd, aptos: getFirstInteger(data.bitcoin.usd) },
      "ETH-USD": { exact: data.ethereum.usd, aptos: getFirstInteger(data.ethereum.usd) },
      "ADA-USD": { exact: data.cardano.usd, aptos: getFirstInteger(data.cardano.usd) },
    };
  } catch (error) {
    console.error("Error fetching crypto prices:", error);
    return {};
  }
};

// Function to update Aptos contract with stock & crypto prices
const updateAptosPrices = async () => {
  try {
    const stocks = await fetchStockPrices(["AAPL", "GOOGL", "AMZN"]);
    const cryptos = await fetchCryptoPrices();

    console.log("\n📢 Frontend receives exact values:");
    console.log(JSON.stringify({
      stocks: Object.fromEntries(Object.entries(stocks).map(([k, v]) => [k, v.exact])),
      cryptos: Object.fromEntries(Object.entries(cryptos).map(([k, v]) => [k, v.exact])),
    }, null, 2));

    if (Object.keys(stocks).length === 0) {
      console.error("⚠️ Error: Missing stock prices, skipping Aptos update");
      return;
    }
    if (Object.keys(cryptos).length === 0) {
      console.error("⚠️ Error: Missing crypto prices, skipping Aptos update");
      return;
    }

    console.log("\n🔄 Aptos receives first-integer values:");
    console.log(⁠ Stocks: AAPL=${stocks["AAPL"].aptos}, GOOGL=${stocks["GOOGL"].aptos}, AMZN=${stocks["AMZN"].aptos} ⁠);
    console.log(⁠ Cryptos: BTC=${cryptos["BTC-USD"].aptos}, ETH=${cryptos["ETH-USD"].aptos}, ADA=${cryptos["ADA-USD"].aptos} ⁠);

    execSync(`aptos move run \
        --function-id "${APTOS_CONTRACT}::${MODULE_NAME}::update_prices" \
        --args u128:${cryptos["BTC-USD"].aptos} u128:${cryptos["ETH-USD"].aptos} u128:${cryptos["ADA-USD"].aptos} \
        --assume-yes \
        --profile default`,
      { stdio: "inherit" }
    );

    execSync(`aptos move run \
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

// API to get latest market data (exact values)
app.get("/market-data", async (req, res) => {
  try {
    const stocks = await fetchStockPrices(["AAPL", "GOOGL", "AMZN"]);
    const cryptos = await fetchCryptoPrices();

    res.json({
      stocks: Object.fromEntries(Object.entries(stocks).map(([k, v]) => [k, v.exact])),
      cryptos: Object.fromEntries(Object.entries(cryptos).map(([k, v]) => [k, v.exact])),

    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch market data" });
  }
});

// Update prices every 20 seconds
setInterval(updateAptosPrices, 20000);
updateAptosPrices();

// Start server
const PORT = 4001;
app.listen(PORT, () => {
  console.log(⁠ 🚀 Server running on http://localhost:${PORT} ⁠);
});