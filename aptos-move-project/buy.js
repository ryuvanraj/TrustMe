const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const { AptosClient, AptosAccount, HexString, TransactionBuilder, Types } = require('aptos');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const app = express();
app.use(cors());
app.use(express.json());

// Contract and wallet configuration
const contractAddress = '0x8ed1668c895c1228c1cee850f4ce8d1efb462550772be3e7ed1c2896ec4ff56d';
const moduleName = 'mock_coins';
const client = new AptosClient('https://fullnode.devnet.aptoslabs.com/v1');

// Execute Aptos CLI commands with proper authentication
async function executeAptosCommand(command) {
    try {
        // Remove network flag for view commands
        const fullCommand = `aptos ${command} --profile default --assume-yes`;
        const output = execSync(fullCommand, { encoding: 'utf8' });
        console.log('Command output:', output);
        try {
            return JSON.parse(output);
        } catch (parseError) {
            console.error('Error parsing command output:', parseError);
            return { Error: 'Failed to parse command output' };
        }
    } catch (error) {
        console.error('Command execution error:', error);
        throw error;
    }
}

// Function to fetch market data
async function getMarketData() {
    try {
        const resource = await client.getAccountResource(
            contractAddress,
            `${contractAddress}::${moduleName}::Market`
        );
        if (resource && resource.data) {
            return resource.data.coins.map((coin) => ({
                symbol: Buffer.from(coin.symbol).toString('utf8'),
                price: Number(coin.current_value) / 1_000_000,
                lastUpdate: new Date(Number(coin.last_update) / 1000).toLocaleString(),
            }));
        }
        return [];
    } catch (error) {
        console.error('Error fetching market data:', error);
        return [];
    }
}

// Function to fetch user portfolio
async function getUserPortfolio(walletAddress) {
    try {
        const command = `move view \
            --function-id ${contractAddress}::user_portfolio::get_portfolio \
            --args address:${walletAddress}`;

        const result = await executeAptosCommand(command);
        
        if (result && result.Result && Array.isArray(result.Result[0])) {
            return result.Result[0].map(coin => {
                const symbol = Buffer.from(coin.symbol.replace('0x', ''), 'hex').toString('utf8');
                // Fix decimal precision for amount display
                const rawAmount = Number(coin.amount);
                const amount = rawAmount / 1_000_000; // Convert from contract units
                return {
                    symbol,
                    amount: amount.toFixed(6), // Keep full precision
                    displayAmount: amount.toLocaleString('en-US', {
                        minimumFractionDigits: 6,
                        maximumFractionDigits: 6
                    })
                };
            });
        }

        // Fallback to using client API if view function fails
        const resources = await client.getAccountResources(walletAddress);
        const portfolioResource = resources.find(r => 
            r.type === `${contractAddress}::user_portfolio::Portfolio`
        );

        if (portfolioResource && portfolioResource.data.coins) {
            return portfolioResource.data.coins.map(coin => ({
                symbol: Buffer.from(coin.symbol).toString('utf8'),
                amount: Number(coin.amount) / 1_000_000
            }));
        }

        return [];
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        return [];
    }
}

// Add new function to get APT price in USD
async function getAptosPrice() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=aptos&vs_currencies=usd');
        const data = await response.json();
        return data.aptos.usd;
    } catch (error) {
        console.error('Error fetching APT price:', error);
        return 0;
    }
}

// Modified transaction function to generate unsigned transaction
async function generateTransaction(walletAddress, payload) {
    try {
        const pendingTxn = await client.generateTransaction(walletAddress, payload);
        return pendingTxn;
    } catch (error) {
        console.error('Error generating transaction:', error);
        throw error;
    }
}

// Modify executeBuyTransaction function to return the transaction
async function prepareBuyTransaction(walletAddress, coinIndex, amountInUSD) {
    try {
        // Get current APT price
        const aptPrice = await getAptosPrice();
        if (!aptPrice) {
            throw new Error('Could not fetch APT price');
        }

        const coin = (await getMarketData())[coinIndex];
        if (!coin) {
            throw new Error('Invalid coin index');
        }

        // Calculate coins to receive based on USD amount and coin price
        const coinsToReceive = (parseFloat(amountInUSD) / coin.price);
        
        // Convert to contract units (6 decimals)
        const scaledCoins = Math.floor(coinsToReceive * 1_000_000);

        // Calculate APT amount needed
        const aptAmount = parseFloat(amountInUSD) / aptPrice;

        // Log the coin index and the transaction details
        console.log("Coin index:", coinIndex);  // Log coinIndex
        console.log("Selected coin:", coin);  // Log the selected coin
        console.log("Transaction payload:", {
            function: `${contractAddress}::${moduleName}::buy_coin`,
            type_arguments: [],
            arguments: [
                coinIndex, // Coin index
                scaledCoins.toString() // Scaled coins
            ],
            type: "entry_function_payload"
        });  // Log the payload
        
        // Create proper transaction payload
        const payload = {
            function: `${contractAddress}::${moduleName}::buy_coin`,
            type_arguments: [],
            arguments: [
                parseInt(coinIndex),  // coinIndex as integer
                scaledCoins.toString()  // scaledCoins as string to match the expected type
            ],
            type: "entry_function_payload"
        };

        // Generate an unsigned transaction
        const pendingTxn = await generateTransaction(walletAddress, payload);

        // Return the transaction and metadata
        return {
            pendingTransaction: pendingTxn,
            metadata: {
                apt_amount: aptAmount.toFixed(8),
                coin_amount: coinsToReceive.toFixed(6),
                usd_amount: amountInUSD,
                coin_symbol: coin.symbol
            }
        };
    } catch (error) {
        console.error('Transaction generation error:', error);
        throw error;
    }
}

// Buy endpoint - modified to return unsigned transaction
// Add this custom serializer at the top of your file after the imports
const BigIntSerializer = {
    replacer: (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString(); // Convert BigInt to string
      }
      return value;
    },
    
    // Helper function to replace BigInt values with strings in an object
    serializeObject: (obj) => {
      return JSON.parse(JSON.stringify(obj, BigIntSerializer.replacer));
    }
  };
  
  // Then modify your /buy endpoint to use this serializer
  app.post('/buy', async (req, res) => {
      const { coinIndex, amountInUSD, walletAddress } = req.body;
  
      // Input validation
      if (!walletAddress || walletAddress === '0' || !walletAddress.startsWith('0x')) {
          return res.status(400).json({
              success: false,
              error: 'Invalid wallet address format'
          });
      }
  
      if (!amountInUSD || isNaN(parseFloat(amountInUSD)) || parseFloat(amountInUSD) <= 0) {
          return res.status(400).json({
              success: false,
              error: 'Invalid amount'
          });
      }
  
      if (coinIndex === undefined || isNaN(parseInt(coinIndex))) {
          return res.status(400).json({
              success: false,
              error: 'Invalid coin index'
          });
      }
  
      try {
          const marketData = await getMarketData();
          console.log("Market data:", marketData);
          
          if (!marketData || parseInt(coinIndex) >= marketData.length) {
              return res.status(400).json({
                  success: false,
                  error: 'Invalid coin index'
              });
          }
  
          const result = await prepareBuyTransaction(
              walletAddress,
              parseInt(coinIndex),
              parseFloat(amountInUSD)
          );
  
          if (result && result.pendingTransaction) {
              const coin = marketData[parseInt(coinIndex)];
              
              // Serialize the pending transaction to handle BigInt values
              const serializedTxn = BigIntSerializer.serializeObject(result.pendingTransaction);
              
              return res.json({
                  success: true,
                  pendingTransaction: serializedTxn,
                  metadata: {
                      coin: coin.symbol,
                      amountUSD: parseFloat(amountInUSD).toFixed(2),
                      amountAPT: result.metadata.apt_amount,
                      coin_amount: result.metadata.coin_amount,
                      coin_symbol: result.metadata.coin_symbol
                  }
              });
          }
  
          throw new Error('Failed to generate transaction');
      } catch (error) {
          console.error('Buy error:', error);
          
          res.status(500).json({
              success: false,
              error: error.message || 'Transaction failed'
          });
      }
  });

// Portfolio endpoint
app.get('/portfolio', async (req, res) => {
    const { walletAddress } = req.query;
    
    if (!walletAddress) {
        return res.status(400).json({
            success: false,
            error: 'Wallet address is required'
        });
    }

    try {
        const portfolioData = await getUserPortfolio(walletAddress);
        res.json({
            success: true,
            data: portfolioData
        });
    } catch (error) {
        console.error('Portfolio error:', error);
        res.status(200).json({
            success: true,
            data: []
        });
    }
});

// Market data endpoint
app.get('/market-data', async (req, res) => {
    try {
        const marketData = await getMarketData();
        res.json({ success: true, data: marketData });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

const PORT = 4002;
app.listen(PORT, () => {
    console.log(`Buy server running on http://localhost:${PORT}`);
    console.log('Contract Address:', contractAddress);
    console.log('Module:', moduleName);
});