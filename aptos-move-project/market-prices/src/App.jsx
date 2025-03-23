import React, { useState, useEffect } from 'react';
import { AptosClient } from "aptos";

const App = () => {
    const [marketData, setMarketData] = useState([]);
    const [userWallet, setUserWallet] = useState(null);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [amountToBuy, setAmountToBuy] = useState(20);
    const [balance, setBalance] = useState(0);
    const [portfolio, setPortfolio] = useState([]);
    const [estimatedCost, setEstimatedCost] = useState(0);
    const [stockMarketData, setStockMarketData] = useState([]);
    const [stockAmountToBuy, setStockAmountToBuy] = useState(10); // Default stock buy amount
    const [stockPortfolio, setStockPortfolio] = useState([]);
    

    const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");

    const fetchBalance = async () => {
        if (!userWallet) return;

        try {
            const resources = await client.getAccountResources(userWallet.address);
            const accountResource = resources.find((r) =>
                r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
            );

            if (accountResource) {
                const balance = parseInt(accountResource.data.coin.value) / 100000000;
                setBalance(balance);
                console.log("Wallet balance:", balance, "APT");
            } else {
                console.error("APT balance resource not found.");
                setBalance(0);
            }
        } catch (error) {
            console.error("Error fetching balance:", error);
            setBalance(0);
        }
    };

    const fetchMarketData = async () => {
    setLoading(true);
    try {
        const response = await fetch('http://localhost:4001/market-data'); // Update to match the correct server port
        const data = await response.json();
        setMarketData(data);
    } catch (error) {
        console.error('Error fetching market data:', error);
        setMarketData([]);
    } finally {
        setLoading(false);
    }
};


    const fetchPortfolio = async () => {
        if (!userWallet) return;
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:4002/portfolio?walletAddress=${userWallet.address}`);
            const data = await response.json();
            if (data && data.success) {
                setPortfolio(data.data);
            } else {
                setPortfolio([]);
            }
        } catch (error) {
            console.error('Error fetching portfolio:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStockPortfolio = async () => {
        if (!userWallet) return;
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:4002/stock-portfolio?walletAddress=${userWallet.address}`);
            const data = await response.json();
            if (data && data.success) {
                setStockPortfolio(data.data);
            } else {
                setStockPortfolio([]);
            }
        } catch (error) {
            console.error('Error fetching stock portfolio:', error);
        } finally {
            setLoading(false);
        }
    };

    const connectWallet = async () => {
        try {
            if (!window.aptos) {
                alert('Petra Wallet not installed! Please install it to proceed.');
                return;
            }

            const wallet = window.aptos;
            const response = await wallet.connect();
            const account = {
                address: response.address,
                publicKey: response.publicKey
            };

            setUserWallet(account);
            setConnected(true);
            console.log('Wallet Connected:', account);
            
            await Promise.all([
                fetchBalance(),
                fetchPortfolio()
            ]);
        } catch (error) {
            console.error('Error connecting wallet:', error);
            alert('Failed to connect wallet');
        }
    };
    const hexToText = (input) => {
        try {
            // If the input is already plain text, return it
            if (/^[a-zA-Z]+$/.test(input)) {
                return input;
            }
    
            // Otherwise, treat it as a hexadecimal string
            if (typeof input === 'string' && input.startsWith('0x')) {
                const sanitizedHex = input.slice(2); // Remove '0x' prefix
                const bytes = new Uint8Array(
                    sanitizedHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
                );
                return new TextDecoder().decode(bytes);
            }
    
            console.error(`Unrecognized input format: ${input}`);
            return 'Unknown';
        } catch (error) {
            console.error(`Error converting input to text: ${input}`, error);
            return 'Unknown';
        }
    };  
    
    
    const disconnectWallet = async () => {
        try {
            if (window.aptos) {
                await window.aptos.disconnect();
            }
            
            setUserWallet(null);
            setConnected(false);
            setBalance(0);
            setPortfolio([]);
            
            console.log('Wallet disconnected');
        } catch (error) {
            console.error('Error disconnecting wallet:', error);
            alert('Failed to disconnect wallet');
        }
    };

    const buyStock_forstock = async (stockIndex) => {
        console.log("Selected stock index:", stockIndex);
        console.log("Amount to Buy:", stockAmountToBuy);
        console.log("Wallet Address:", userWallet?.address);
    
        if (!connected || !userWallet) {
            alert('Please connect wallet first');
            return;
        }
    
        setLoading(true);
        try {
            // Convert to a regular number for safe JSON serialization
            const amountAsNumber = parseFloat(stockAmountToBuy);
            
            const payload = {
                stockIndex,
                amountInUSD: amountAsNumber.toString(), // Convert to string for safe JSON serialization
                walletAddress: userWallet.address
            };
    
            console.log("Payload sent to backend:", payload);
    
            // Get transaction payload from backend
            const response = await fetch('http://localhost:4002/buy-stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
    
            const data = await response.json();
    
            if (!data.success) {
                throw new Error(data.error || 'Transaction failed');
            }
    
            console.log("Received from backend:", data);
            
            // Extract the necessary components for the function string
            if (!data.pendingTransaction?.payload?.value?.module_name?.address?.address ||
                !data.pendingTransaction?.payload?.value?.module_name?.name?.value ||
                !data.pendingTransaction?.payload?.value?.function_name?.value) {
                throw new Error('Missing transaction components in payload');
            }
            
            // Extract address bytes and convert to hex string
            const addressBytes = data.pendingTransaction.payload.value.module_name.address.address;
            const addressHex = '0x' + Object.values(addressBytes)
                .map(byte => byte.toString(16).padStart(2, '0'))
                .join('');
                
            // Get module and function names
            const moduleName = data.pendingTransaction.payload.value.module_name.name.value;
            const functionName = data.pendingTransaction.payload.value.function_name.value;
            
            // Construct the full function string in the format required by Petra wallet
            const fullFunction = `${addressHex}::${moduleName}::${functionName}`;
            
            // Convert byte array arguments to proper format
            const rawArgs = data.pendingTransaction.payload.value.args || [];
            
            // Convert the first argument (stock index) to a number
            const stockIndexArg = parseInt(Object.values(rawArgs[0])[0]);
            
            // Process the second argument (amount) properly - this is critical
            const amountBytes = Object.values(rawArgs[1]);
            
            // Carefully reconstruct the amount value from bytes
            let amountValue = 0;
            for (let i = 0; i < amountBytes.length; i++) {
                // Use multiplication and addition instead of bit shifting
                amountValue = amountValue + (Number(amountBytes[i]) * Math.pow(256, i));
            }
            const amountArg = amountValue.toString();
            
            // Create a properly formatted entry function payload that Petra can understand
            const entryFunctionPayload = {
                type: "entry_function_payload",
                function: fullFunction,
                type_arguments: [],
                arguments: [stockIndexArg, amountArg]
            };
            
            console.log("Entry function payload for Petra:", entryFunctionPayload);
            
            // Submit transaction with the correct format
            const signAndSubmitResult = await window.aptos.signAndSubmitTransaction(entryFunctionPayload);
    
            console.log('Transaction confirmed:', signAndSubmitResult);
            alert(`Successfully purchased stock! You bought approximately ${amountAsNumber} units of stock.`);
    
            // Refresh data
            await Promise.all([
                fetchMarketData(),
                fetchBalance(),
                fetchPortfolio(),
                fetchStockPortfolio() // Make sure to refresh stock portfolio
            ]);
        } catch (error) {
            console.error('Buy failed:', error);
            alert(`Transaction failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    

    const buyStock = async (coinIndex) => {
        console.log("Selected coin index:", coinIndex);
        console.log("Amount to Buy:", amountToBuy);
        console.log("Wallet Address:", userWallet?.address);
    
        if (!connected || !userWallet) {
            alert('Please connect wallet first');
            return;
        }
    
        if (coinIndex < 0 || coinIndex >= marketData.length) {
            alert('Invalid coin index');
            return;
        }
    
        setLoading(true);
        try {
            const payload = {
                coinIndex,
                amountInUSD: Number(amountToBuy),
                walletAddress: userWallet.address
            };
    
            console.log("Payload sent to backend:", payload);
    
            // Get transaction payload from backend
            const response = await fetch('http://localhost:4002/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
    
            const data = await response.json();
    
            if (!data.success) {
                throw new Error(data.error || 'Transaction failed');
            }
    
            console.log("Received from backend:", data);
            
            // Extract the necessary components for the function string
            if (!data.pendingTransaction?.payload?.value?.module_name?.address?.address ||
                !data.pendingTransaction?.payload?.value?.module_name?.name?.value ||
                !data.pendingTransaction?.payload?.value?.function_name?.value) {
                throw new Error('Missing transaction components in payload');
            }
            
            // Extract address bytes and convert to hex string
            const addressBytes = data.pendingTransaction.payload.value.module_name.address.address;
            const addressHex = '0x' + Object.values(addressBytes)
                .map(byte => byte.toString(16).padStart(2, '0'))
                .join('');
                
            // Get module and function names
            const moduleName = data.pendingTransaction.payload.value.module_name.name.value;
            const functionName = data.pendingTransaction.payload.value.function_name.value;
            
            // Construct the full function string in the format required by Petra wallet
            const fullFunction = `${addressHex}::${moduleName}::${functionName}`;
            
            // Convert byte array arguments to proper format
            const rawArgs = data.pendingTransaction.payload.value.args || [];
            
            // Convert the first argument (coin index) to a number
            const coinIndexArg = parseInt(Object.values(rawArgs[0])[0]);
            
            // Convert the second argument (amount) to a string
            // This combines all bytes into a single value
            const amountBytes = Object.values(rawArgs[1]);
            let amountValue = 0;
            for (let i = 0; i < amountBytes.length; i++) {
                amountValue += amountBytes[i] * Math.pow(256, i);
            }
            const amountArg = amountValue.toString();
            
            // Create a properly formatted entry function payload that Petra can understand
            const entryFunctionPayload = {
                type: "entry_function_payload",
                function: fullFunction,
                type_arguments: [],
                arguments: [coinIndexArg, amountArg]
            };
            
            console.log("Entry function payload for Petra:", entryFunctionPayload);
            
            // Submit transaction with the correct format
            const signAndSubmitResult = await window.aptos.signAndSubmitTransaction(entryFunctionPayload);
    
            console.log('Transaction confirmed:', signAndSubmitResult);
            alert(`Successfully purchased ${data.metadata.coin_amount} ${data.metadata.coin_symbol}`);
    
            // Refresh data
            await Promise.all([
                fetchMarketData(),
                fetchBalance(),
                fetchPortfolio()
            ]);
        } catch (error) {
            console.error('Buy failed:', error);
            alert(`Transaction failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    const sellStock = async (index, isStock = false) => {
        if (!connected || !userWallet) {
            alert("Please connect your wallet first.");
            return;
        }
        
        try {
            // Determine which portfolio to use
            const portfolioToUse = isStock ? stockPortfolio : portfolio;
            
            if (index < 0 || index >= portfolioToUse.length) {
                alert("Invalid asset index.");
                return;
            }
            
            // Get the token from the appropriate portfolio
            const token = portfolioToUse[index];
            const tokenSymbol = isStock ? token.symbol : hexToText(token.symbol);
            const availableAmount = isStock ? parseFloat(token.quantity) : parseFloat(token.amount);
            
            // Check if this is one of the stock symbols
            const isStockSymbol = ['AAPL', 'GOOGL', 'TSLA'].includes(tokenSymbol);
            
            // Determine which endpoint to use
            const endpoint = isStockSymbol 
                ? "http://localhost:4002/sell-stock" 
                : "http://localhost:4002/sell";
            
            // Prompt user for amount to sell
            const amountToSell = prompt(`Enter the amount to sell for ${tokenSymbol} (Available: ${availableAmount}):`);
            if (!amountToSell || isNaN(amountToSell) || parseFloat(amountToSell) <= 0 || parseFloat(amountToSell) > availableAmount) {
                alert("Invalid amount entered.");
                return;
            }
            
            setLoading(true);
            
            // Prepare the payload based on endpoint type
            const payload = isStockSymbol
                ? {
                    stockSymbol: tokenSymbol,
                    amountToSell: parseFloat(amountToSell),
                    recipientAddress: userWallet.address,
                  }
                : {
                    coinSymbol: tokenSymbol, // Changed from 'symbol' to 'coinSymbol'
                    amountToSell: parseFloat(amountToSell),
                    recipientAddress: userWallet.address,
                  };
            
            console.log(`Sending sell request to ${endpoint}:`, payload);
            
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || "Transaction failed");
            }
            
            alert(`Successfully sold ${amountToSell} ${tokenSymbol}.`);
            
            // Refresh the appropriate data
            await Promise.all([
                fetchBalance(),
                fetchPortfolio(),
                fetchStockPortfolio()
            ]);
        } catch (error) {
            console.error("Transaction failed:", error);
            alert(`Transaction failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        console.log('Market Data:', marketData); // Log the entire market data array
    }, [marketData]);
    

    useEffect(() => {
        fetchMarketData();

        const checkConnection = async () => {
            try {
                if (window.aptos) {
                    const isConnected = await window.aptos.isConnected();
                    if (isConnected) {
                        const account = await window.aptos.account();
                        setUserWallet({
                            address: account.address,
                            publicKey: account.publicKey
                        });
                        setConnected(true);
                        await Promise.all([
                            fetchBalance(),
                            fetchPortfolio()
                        ]);
                    }
                }
            } catch (error) {
                console.error('Error checking wallet connection:', error);
            }
        };

        checkConnection();
    }, []);
    
    useEffect(() => {
        if (connected) {
            fetchBalance();
            fetchPortfolio();
        }
    }, [connected]);

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Crypto Market</h1>

            <div className="mb-4">
                {!connected ? (
                    <button onClick={connectWallet} className="btn btn-primary">
                        Connect Petra Wallet
                    </button>
                ) : (
                    <div className="card p-3">
                        <p className="mb-2">Connected: {userWallet.address}</p>
                        <p className="mb-2">Balance: {balance.toFixed(4)} APT</p>
                        <button onClick={disconnectWallet} className="btn btn-secondary">
                            Disconnect Wallet
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <>
                 
{marketData.map((item, index) => (
    <div key={index} className="col-md-4 mb-3">
        <div className="card">
            <div className="card-body">
                <h2 className="card-title">{item.symbol}</h2>
                <p className="card-text">
                    Price: ${item.price ? item.price.toFixed(2) : 'N/A'}
                </p>
                <button
onClick={() => {
    if (index < 3) {
        // Coin logic
        buyStock(index);
    } else {
        // Stock logic
        const stockIndex = index - 3; // Adjust stock index
        buyStock_forstock(stockIndex);
    }
}}                    className="btn btn-success me-2"
                    disabled={loading}
                >
                    Buy
                </button>
            </div>
        </div>
    </div>
))}


                    
<h3 className="mt-4">Your Portfolio</h3>
<table className="table table-striped">
    <thead>
        <tr>
            <th>Symbol</th>
            <th>Amount</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>
        {/* Render Crypto Portfolio */}
        {/* Render Crypto Portfolio */}
{portfolio.map((item, index) => (
    <tr key={`crypto-${index}`}>
        <td>{hexToText(item.symbol)}</td>
        <td>{item.amount}</td>
        <td>
            <button
                onClick={() => sellStock(index, false)} // Pass isStock=false for crypto
                className="btn btn-danger"
                disabled={loading}
            >
                Sell
            </button>
        </td>
    </tr>
))}

{/* Render Stock Portfolio */}
{stockPortfolio.map((item, index) => (
    <tr key={`stock-${index}`}>
        <td>{item.symbol}</td>
        <td>{item.quantity || 0}</td>
        <td>
            <button
                onClick={() => sellStock(index, true)} // Pass isStock=true for stocks
                className="btn btn-danger"
                disabled={loading}
            >
                Sell
            </button>
        </td>
    </tr>
))}
    </tbody>
</table>

                    
                </>
            )}
        </div>
    );
};

export default App;
