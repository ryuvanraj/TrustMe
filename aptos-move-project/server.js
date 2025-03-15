// updateServer.js
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

// Cached market data
let marketData = [];

// Function to generate random number between min and max
function getRandomPrice(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min) * 1_000_000;
}

async function updateAndFetchMarketData() {
    try {
        // Generate random prices between 10-40
        const btcPrice = getRandomPrice(10, 40);
        const ethPrice = getRandomPrice(10, 40);
        const adaPrice = getRandomPrice(10, 40);

        // Update prices using aptos CLI with automatic confirmation
        console.log('Updating prices...');
        execSync(`aptos move run \
            --function-id "${contractAddress}::${moduleName}::update_prices" \
            --args u128:${btcPrice} u128:${ethPrice} u128:${adaPrice} \
            --assume-yes \
            --profile default`,
            { stdio: 'inherit' }
        );

        // Fetch resource data for display
        const resource = await client.getAccountResource(
            contractAddress,
            `${contractAddress}::${moduleName}::Market`
        );

        if (resource && resource.data) {
            const { coins } = resource.data;
            marketData = coins.map(coin => ({
                symbol: Buffer.from(coin.symbol).toString('utf8'),
                price: Number(coin.current_value) / 1_000_000,
                lastUpdate: new Date(Number(coin.last_update || Date.now()) / 1000).toLocaleString(),
            }));

            console.clear();
            console.log('\n=== Current Market Prices ===');
            console.log('Timestamp:', new Date().toLocaleString());
            console.log('--------------------------------');

            marketData.forEach(coin => {
                console.log(`${coin.symbol}:`);
                console.log(`  Price: $${coin.price}`);
                console.log(`  Last Update: ${coin.lastUpdate}`);
                console.log('--------------------------------');
            });
        }
    } catch (error) {
        console.error('Error:', error.message);
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
const PORT = 4001; // Using a different port for update server
app.listen(PORT, () => {
    console.log(`Market data server running on http://localhost:${PORT}`);
});
