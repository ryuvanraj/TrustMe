const { AptosClient } = require('aptos');
const express = require('express');
const { execSync } = require('child_process');
const cors = require('cors');
const app = express();

app.use(cors());

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

// Set up periodic updates
setInterval(updateAndFetchMarketData, 20000);
updateAndFetchMarketData();

// Start the server
const PORT = 4003; // Using a different port for update server
app.listen(PORT, () => {
    console.log(`Market data server running on http://localhost:${PORT}`);
});
