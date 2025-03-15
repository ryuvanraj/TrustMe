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
            const response = await fetch('http://localhost:4002/market-data');
            const data = await response.json();
            if (data && data.data) {
                setMarketData(data.data);
            } else {
                setMarketData([]);
            }
        } catch (error) {
            console.error('Error fetching market data:', error);
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

    const buyStock = async (coinIndex) => {
      if (!connected || !userWallet) {
          alert('Please connect wallet first');
          return;
      }
  
      setLoading(true);
      try {
          const response = await fetch('http://localhost:4002/buy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  coinIndex,
                  amountInUSD: Number(amountToBuy),
                  walletAddress: userWallet.address
              })
          });
  
          const data = await response.json();
          
          if (!data.success) {
              throw new Error(data.error || 'Transaction failed');
          }
  
          console.log('Transaction confirmed:', data.transaction.hash);
          alert(`Successfully purchased coin at index ${coinIndex}`);
          
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

    const handleAmountChange = (event) => {
        const value = parseFloat(event.target.value);
        setAmountToBuy(isNaN(value) ? 0 : value);
    };

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

            {connected && (
                <div className="mb-4">
                    <label className="form-label">Amount to Buy (USD)</label>
                    <input
                        type="number"
                        className="form-control"
                        value={amountToBuy}
                        onChange={handleAmountChange}
                        placeholder="Amount in USD"
                        min="0"
                    />
                </div>
            )}

            {loading ? (
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <>
                    <h3>Market Data</h3>
                    {!marketData || marketData.length === 0 ? (
                        <p>No market data available.</p>
                    ) : (
                        <div className="row">
                            {marketData.map((coin, index) => (
                                <div key={index} className="col-md-4 mb-3">
                                    <div className="card">
                                        <div className="card-body">
                                            <h2 className="card-title">{coin.symbol}</h2>
                                            <p className="card-text">
                                                Price: ${coin.price ? coin.price.toFixed(2) : 'N/A'}
                                            </p>
                                            <button
                                                onClick={() => buyStock(index)}
                                                className="btn btn-success me-2"
                                                disabled={loading}
                                            >
                                                Buy
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <h3>Your Portfolio</h3>
                    {!portfolio || portfolio.length === 0 ? (
                        <p>No tokens in your portfolio.</p>
                    ) : (
                        <ul>
                            {portfolio.map((token, index) => (
                                <li key={index}>
                                    {token.symbol}: {token.amount}
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
};

export default App;
