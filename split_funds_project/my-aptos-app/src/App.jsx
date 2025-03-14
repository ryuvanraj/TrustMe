// App.jsx
import { useState, useEffect } from 'react';
import { AptosClient } from 'aptos';
import './App.css';

// Set up the Aptos client (for reading chain data, etc.)
const CLIENT = new AptosClient("https://fullnode.devnet.aptoslabs.com");

function App() {
  // Existing wallet and transaction states...
  const [account, setAccount] = useState(null);
  const [receiver1, setReceiver1] = useState("");
  const [receiver2, setReceiver2] = useState("");
  const [txStatus, setTxStatus] = useState(null);

  // New state for stock values
  const [stocks, setStocks] = useState([]);

  // Function to connect wallet (existing code)
  const connectWallet = async () => {
    if (window.aptos && window.aptos.connect) {
      try {
        const response = await window.aptos.connect();
        setAccount(response.address);
      } catch (error) {
        console.error("Wallet connection failed:", error);
      }
    } else {
      alert("Please install a supported Aptos wallet (e.g., Petra).");
    }
  };

  // Function to send transaction (existing code)
  const sendTransaction = async () => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    if (!receiver1 || !receiver2) {
      alert("Please enter both receiver addresses.");
      return;
    }
    const totalOctas = "414000000";
    const payload = {
      type: "entry_function_payload",
      function: "0xb4c854f4b2c05d748afdde0777ff7a87aa114bf16a098fb131b516d03d0d1740::split_funds::split_funds",
      type_arguments: [],
      arguments: [receiver1, receiver2, totalOctas],
    };

    try {
      const txnResponse = await window.aptos.signAndSubmitTransaction(payload);
      console.log("Transaction submitted:", txnResponse);
      setTxStatus(`Transaction submitted: ${txnResponse.hash}`);
    } catch (error) {
      console.error("Transaction failed:", error);
      setTxStatus("Transaction failed");
    }
  };

  // New effect: Poll the stock API every 5 seconds.
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await fetch('http://localhost:3001/stocks');
        const data = await response.json();
        setStocks(data);
      } catch (error) {
        console.error("Failed to fetch stocks:", error);
      }
    };

    // Fetch immediately and then poll every 5 seconds.
    fetchStocks();
    const interval = setInterval(fetchStocks, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <h1>Aptos Split Funds DApp</h1>
      
      {/* Existing wallet and transaction UI */}
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected: {account}</p>
          <div>
            <label>
              Receiver 1 Address:
              <input
                type="text"
                value={receiver1}
                onChange={(e) => setReceiver1(e.target.value)}
                placeholder="Enter first receiver address"
              />
            </label>
          </div>
          <div>
            <label>
              Receiver 2 Address:
              <input
                type="text"
                value={receiver2}
                onChange={(e) => setReceiver2(e.target.value)}
                placeholder="Enter second receiver address"
              />
            </label>
          </div>
          <button onClick={sendTransaction}>Send $10 Split Funds</button>
          {txStatus && <p>{txStatus}</p>}
        </div>
      )}

      {/* New section: Display Company Stock Values */}
      <div className="stocks">
        <h2>Company Stock Values</h2>
        {stocks.length > 0 ? (
          <ul>
            {stocks.map((company, index) => (
              <li key={index}>
                <strong>{company.name}</strong> (Wallet: {company.wallet}) – Stock Value: {company.stock}
              </li>
            ))}
          </ul>
        ) : (
          <p>Loading stock values...</p>
        )}
      </div>
    </div>
  );
}

export default App;