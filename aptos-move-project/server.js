import { AptosClient } from 'aptos';
import express from 'express';
import { execSync } from 'child_process';
import cors from 'cors';

const app = express();

app.use(cors());
// Add express.json() middleware
app.use(express.json());

// Initialize Aptos client for devnet
const client = new AptosClient('https://fullnode.devnet.aptoslabs.com/v1');

// Contract configuration
const contractAddress = '0x8ed1668c895c1228c1cee850f4ce8d1efb462550772be3e7ed1c2896ec4ff56d';
const moduleName = 'mock_coins';

// Cached data for market
let marketData = [];

// Function to generate random number between min and max
function getRandomPrice(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min) * 1_000_000;
}

// Add BigIntSerializer to handle BigInt values in transactions
const BigIntSerializer = {
  serializeObject: (obj) => {
    return JSON.parse(JSON.stringify(obj, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    ));
  }
};

async function updateAndFetchMarketData() {
    try {
        // Update cryptocurrency prices
        const btcPrice = getRandomPrice(10, 40);
        const ethPrice = getRandomPrice(10, 40);
        const adaPrice = getRandomPrice(10, 40);

        execSync(`aptos move run \
            --function-id "${contractAddress}::${moduleName}::update_prices" \
            --args u128:${btcPrice} u128:${ethPrice} u128:${adaPrice} \
            --assume-yes \
            --profile default`,
            { stdio: 'inherit' }
        );

        // Update stock prices
        const stock1Price = getRandomPrice(1, 10);
        const stock2Price = getRandomPrice(1, 10);
        const stock3Price = getRandomPrice(1, 10);

        execSync(`aptos move run \
            --function-id "${contractAddress}::${moduleName}::update_stock_prices" \
            --args u128:${stock1Price} u128:${stock2Price} u128:${stock3Price} \
            --assume-yes \
            --profile default`,
            { stdio: 'inherit' }
        );

        // Update market data cache
        marketData = [
            { type: 'crypto', symbol: 'BTC', price: btcPrice / 1_000_000 },
            { type: 'crypto', symbol: 'ETH', price: ethPrice / 1_000_000 },
            { type: 'crypto', symbol: 'ADA', price: adaPrice / 1_000_000 },
            { type: 'stock', symbol: 'Stock 1', price: stock1Price / 1_000_000 },
            { type: 'stock', symbol: 'Stock 2', price: stock2Price / 1_000_000 },
            { type: 'stock', symbol: 'Stock 3', price: stock3Price / 1_000_000 },
        ];
    } catch (error) {
        console.error('Error updating market data:', error.message);
    }
}

// API endpoint to fetch market data
app.get('/market-data', (req, res) => {
    res.json(marketData);
});

// API endpoint to buy stock
app.post('/buy-stock', async (req, res) => {
  const { stockIndex, amountInUSD, walletAddress } = req.body;
  
  if (!walletAddress || !walletAddress.startsWith('0x')) {
    return res.status(400).json({ success: false, error: 'Invalid wallet address' });
  }
  
  // Scale down the amount by dividing by 100
  const scaledAmountInUSD = parseFloat(amountInUSD) / 100;
  
  if (!amountInUSD || isNaN(scaledAmountInUSD) || scaledAmountInUSD <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid amount' });
  }
  
  if (stockIndex === undefined || isNaN(parseInt(stockIndex))) {
    return res.status(400).json({ success: false, error: 'Invalid stock index' });
  }
  
  try {
    // Convert scaledAmountInUSD to proper stock units
    // If $1 = 1 stock in your design, and contract uses 1_000_000 as scaling factor
    const stockAmount = scaledAmountInUSD; // Direct 1:1 conversion
    
    // Scale for the contract's decimal precision (assuming 6 decimals)
    const scaledAmount = Math.floor(stockAmount * 1_000_000);
    
    const payload = {
      function: `${contractAddress}::${moduleName}::buy_stock`,
      type_arguments: [],
      arguments: [parseInt(stockIndex), scaledAmount.toString()],
      type: 'entry_function_payload',
    };
    
    const rawTransaction = await client.generateTransaction(walletAddress, payload);
    
    // Use the BigIntSerializer to handle BigInt values
    const serializedTxn = BigIntSerializer.serializeObject(rawTransaction);
    
    res.json({
      success: true,
      pendingTransaction: serializedTxn,
      metadata: {
        stockIndex: parseInt(stockIndex),
        amountInUSD: scaledAmountInUSD.toFixed(2),
        stockAmount: stockAmount.toFixed(6)
      }
    });
  } catch (error) {
    console.error('Error generating transaction:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Set up periodic updates
setInterval(updateAndFetchMarketData, 20000);
updateAndFetchMarketData();

// Start the server
const PORT = 4003; // Using a different port for update server
app.listen(PORT, () => {
    console.log(`Market data server running on http://localhost:${PORT}`);
});
