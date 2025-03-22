const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const { AptosClient, AptosAccount, HexString, TransactionBuilder, Types } = require('aptos');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const app = express();
app.use(cors());
app.use(express.json());
const { Buffer } = require("buffer");

// Contract and wallet configuration
const contractAddress = '0x8ed1668c895c1228c1cee850f4ce8d1efb462550772be3e7ed1c2896ec4ff56d';
const moduleName = 'mock_coins';
const client = new AptosClient('https://fullnode.devnet.aptoslabs.com/v1');
const COIN_WALLET_ADDRESS = "0x8ed1668c895c1228c1cee850f4ce8d1efb462550772be3e7ed1c2896ec4ff56d";
const MODULE_NAME = "mock_coins";
const FUNCTION_NAME = "sell_coin_v4";
const CONTRACT_ADDRESS = "0x8ed1668c895c1228c1cee850f4ce8d1efb462550772be3e7ed1c2896ec4ff56d";


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
const handleSell = async () => {
    if (amountToSell <= 0 || amountToSell > selectedCoin.amountOwned) {
        alert('Invalid sell amount.');
        return;
    }

    try {
        const response = await fetch('http://localhost:4002/sell', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                coinIndex: marketData.findIndex(c => c.symbol === selectedCoin.symbol),
                amountToSell,
                senderWalletAddress: userWallet.address,
            }),
        });

        const data = await response.json();
        if (data.success) {
            alert('Sell transaction successful!');
            setSelectedCoin(null);
            fetchPortfolio(); // Refresh portfolio
        } else {
            alert(`Sell transaction failed: ${data.error}`);
        }
    } catch (error) {
        console.error('Error processing sell transaction:', error);
        alert('Failed to execute sell transaction.');
    }
};
async function getUserStockPortfolio(walletAddress) {
    try {
        const command = `move view \
            --function-id ${contractAddress}::user_portfolio::get_stock_portfolio \
            --args address:${walletAddress}`;
        
        const result = await executeAptosCommand(command);
        
        if (result && result.Result && Array.isArray(result.Result[0])) {
            return result.Result[0].map(stock => {
                const symbol = Buffer.from(stock.symbol.replace('0x', ''), 'hex').toString('utf8');
                // Fix decimal precision for price and quantity display
                const rawQuantity = Number(stock.quantity);
                const quantity = rawQuantity / 1_000_000; // Convert from contract units
                const rawPrice = Number(stock.price);
                const price = rawPrice / 1_000_000; // Convert from contract units
                
                return {
                    symbol,
                    quantity: quantity.toFixed(6), // Keep full precision
                    price: price.toFixed(6),
                    displayQuantity: quantity.toLocaleString('en-US', {
                        minimumFractionDigits: 6,
                        maximumFractionDigits: 6
                    }),
                    displayPrice: price.toLocaleString('en-US', {
                        minimumFractionDigits: 6,
                        maximumFractionDigits: 6
                    }),
                    value: (quantity * price).toFixed(6)
                };
            });
        }

        // Fallback to using client API if view function fails
        const resources = await client.getAccountResources(walletAddress);
        const stockPortfolioResource = resources.find(r => 
            r.type === `${contractAddress}::user_portfolio::StockPortfolio`
        );

        if (stockPortfolioResource && stockPortfolioResource.data.stocks) {
            return stockPortfolioResource.data.stocks.map(stock => ({
                symbol: Buffer.from(stock.symbol).toString('utf8'),
                quantity: Number(stock.quantity) / 1_000_000,
                price: Number(stock.price) / 1_000_000,
                value: (Number(stock.quantity) * Number(stock.price)) / 1_000_000_000_000
            }));
        }

        return [];
    } catch (error) {
        console.error('Error fetching stock portfolio:', error);
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
  // Add this function to generate a sell transaction
async function prepareSellTransaction(walletAddress, symbol, amount, recipientAddress) {
    try {
        // Get current market data to find coin price
        const marketData = await getMarketData();
        const coin = marketData.find(c => c.symbol === symbol);
        
        if (!coin) {
            throw new Error(`Coin ${symbol} not found in market data`);
        }
        
        // Convert symbol to hex format for the Move function
        const symbolHex = Buffer.from(symbol).toString('hex');
        
        // Convert to contract units (6 decimals)
        const scaledAmount = Math.floor(parseFloat(amount) * 1_000_000);
        
        // Calculate USD value
        const usdAmount = parseFloat(amount) * coin.price;
        
        // Calculate equivalent APT to be transferred
        const aptPrice = await getAptosPrice();
        const aptAmount = usdAmount / aptPrice;
        
        // Create transaction payload
        const payload = {
            function: `${contractAddress}::${moduleName}::sell_coin_v4`,
            type_arguments: [],
            arguments: [
                `hex:0x${symbolHex}`,
                `u128:${scaledAmount}`,
                `address:${recipientAddress}`
            ],
            type: "entry_function_payload"
        };
        
        // Return the payload and metadata
        return {
            payload,
            metadata: {
                apt_amount: aptAmount.toFixed(8),
                coin_amount: amount,
                usd_amount: usdAmount.toFixed(2),
                coin_symbol: symbol
            }
        };
    } catch (error) {
        console.error('Error preparing sell transaction:', error);
        throw error;
    }
}
function getAccountFromPrivateKey(privateKeyHex) {
    const privateKeyBytes = Buffer.from(privateKeyHex, 'hex').slice(0, 32);
    return new AptosAccount(privateKeyBytes);
}

app.post("/execute-sell-backend", async (req, res) => {
    const { coinSymbol, amountToSell, userAddress } = req.body;

    // Input validation
    if (!coinSymbol || typeof coinSymbol !== "string") {
        return res.status(400).json({ success: false, error: "Invalid or missing coinSymbol" });
    }
    if (!amountToSell || isNaN(amountToSell) || amountToSell <= 0) {
        return res.status(400).json({ success: false, error: "Invalid or missing amountToSell" });
    }
    if (!userAddress || typeof userAddress !== "string" || !userAddress.startsWith("0x")) {
        return res.status(400).json({ success: false, error: "Invalid or missing userAddress" });
    }

    try {
        // Convert coinSymbol to bytes
        const symbolBytes = Array.from(Buffer.from(coinSymbol, "utf8"));

        // Scale the amount to match contract units
        const scaledAmount = Math.floor(amountToSell * 1_000_000).toString();

        // Create the transaction payload
        const payload = {
            type: "entry_function_payload",
            function: `${COIN_WALLET_ADDRESS}::${MODULE_NAME}::${FUNCTION_NAME}`,
            type_arguments: [],
            arguments: [symbolBytes, scaledAmount, userAddress],
        };

        console.log("Transaction payload:", payload);

        // Generate transaction
        const rawTxn = await client.generateTransaction(coinWallet.address(), payload);

        // Sign transaction
        const signedTxn = await client.signTransaction(coinWallet, rawTxn);

        // Submit transaction
        const transactionResult = await client.submitTransaction(signedTxn);

        console.log("Transaction result:", transactionResult);

        // Wait for transaction confirmation
        const txnHash = transactionResult.hash;
        await client.waitForTransaction(txnHash);

        // Respond with success
        res.json({ success: true, transactionHash: txnHash });
    } catch (error) {
        console.error("Error executing sell transaction:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add this new endpoint for selling coins
// Add this mock selling logic to the /sell endpoint
app.post("/sell", async (req, res) => {
    const { coinSymbol, amountToSell, recipientAddress } = req.body;

    if (!coinSymbol || typeof coinSymbol !== "string") {
        return res.status(400).json({ success: false, error: "Invalid or missing coinSymbol" });
    }
    if (!amountToSell || isNaN(parseFloat(amountToSell)) || parseFloat(amountToSell) <= 0) {
        return res.status(400).json({ success: false, error: "Invalid amount to sell" });
    }
    if (!recipientAddress || !recipientAddress.startsWith("0x")) {
        return res.status(400).json({ success: false, error: "Invalid recipient address" });
    }

    try {
        const symbolHex = `0x${Buffer.from(coinSymbol, "utf8").toString("hex")}`;
        const scaledAmount = Math.floor(parseFloat(amountToSell) * 1_000_000);

        const command = `aptos move run --function-id '${CONTRACT_ADDRESS}::${MODULE_NAME}::${FUNCTION_NAME}' \
            --args 'hex:${symbolHex}' 'u128:${scaledAmount}' 'address:${recipientAddress}' --assume-yes`;

        console.log("Executing command:", command);

        const output = execSync(command, { encoding: "utf8" });
        console.log("Command output:", output);

        return res.json({ success: true, message: "Sell transaction executed successfully", output });
    } catch (error) {
        console.error("Error executing sell transaction:", error);

        const errorMessage = error.stdout
            ? JSON.parse(error.stdout).Error || "Transaction failed"
            : error.message;

        return res.status(500).json({ success: false, error: errorMessage });
    }
});

// Add this new function to prepare the stock-buying transaction


// Add this new endpoint for buying stocks
// Modify your /buy-stock endpoint to properly handle BigInt values
app.post('/buy-stock', async (req, res) => {
    const { stockIndex, amountInUSD, walletAddress } = req.body;

    if (!walletAddress || !walletAddress.startsWith('0x')) {
        return res.status(400).json({ success: false, error: 'Invalid wallet address' });
    }

    if (!amountInUSD || isNaN(parseFloat(amountInUSD)) || parseFloat(amountInUSD) <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    if (stockIndex === undefined || isNaN(parseInt(stockIndex))) {
        return res.status(400).json({ success: false, error: 'Invalid stock index' });
    }

    try {
        // Convert amountInUSD to proper stock units
        // If $1 = 1 stock in your design, and contract uses 1_000_000 as scaling factor
        const stockAmount = parseFloat(amountInUSD); // Direct 1:1 conversion
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
                amountInUSD: parseFloat(amountInUSD).toFixed(2),
                stockAmount: stockAmount.toFixed(6)
            }
        });
    } catch (error) {
        console.error('Error generating transaction:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

    // Stock portfolio endpoint
app.get('/stock-portfolio', async (req, res) => {
    const { walletAddress } = req.query;
    
    if (!walletAddress) {
        return res.status(400).json({
            success: false,
            error: 'Wallet address is required'
        });
    }

    try {
        const stockPortfolioData = await getUserStockPortfolio(walletAddress);
        res.json({
            success: true,
            data: stockPortfolioData
        });
    } catch (error) {
        console.error('Stock Portfolio error:', error);
        res.status(200).json({
            success: true,
            data: []
        });
    }
});

    // Add this new endpoint for selling stocks
// Add this new endpoint for selling stocks
// Endpoint for selling stocks
app.post("/sell-stock", async (req, res) => {
    const { stockSymbol, amountToSell, recipientAddress } = req.body;

    // Validation
    if (!stockSymbol || typeof stockSymbol !== "string") {
        return res.status(400).json({ success: false, error: "Invalid or missing stockSymbol" });
    }
    if (!amountToSell || isNaN(parseFloat(amountToSell)) || parseFloat(amountToSell) <= 0) {
        return res.status(400).json({ success: false, error: "Invalid amount to sell" });
    }
    if (!recipientAddress || !recipientAddress.startsWith("0x")) {
        return res.status(400).json({ success: false, error: "Invalid recipient address" });
    }

    try {
        // Scale the amount to match contract units (assuming 6 decimal places)
        const scaledAmount = Math.floor(parseFloat(amountToSell) * 1_000_000);

        // Use the correct function ID for selling stocks: sell_stock_v4
        const command = `aptos move run --function-id '${CONTRACT_ADDRESS}::${MODULE_NAME}::sell_stock_v4' \
            --args 'string:${stockSymbol}' 'u128:${scaledAmount}' 'address:${recipientAddress}' --assume-yes`;

        console.log("Executing stock sell command:", command);

        const output = execSync(command, { encoding: "utf8" });
        console.log("Stock sell command output:", output);

        return res.json({ success: true, message: "Sell stock transaction executed successfully", output });
    } catch (error) {
        console.error("Error executing sell stock transaction:", error);

        // Extract error message if available
        const errorMessage = error.stdout
            ? (function() {
                try {
                    return JSON.parse(error.stdout).Error || "Transaction failed";
                } catch (e) {
                    return "Transaction failed";
                }
            })()
            : error.message;

        return res.status(500).json({ success: false, error: errorMessage });
    }
});
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