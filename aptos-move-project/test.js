const { AptosClient, AptosAccount, FaucetClient, HexString, Types } = require('aptos');

// Test configuration
const NODE_URL = 'https://fullnode.devnet.aptoslabs.com/v1';
const FAUCET_URL = 'https://faucet.devnet.aptoslabs.com';
const CONTRACT_ADDRESS = '0x8ed1668c895c1228c1cee850f4ce8d1efb462550772be3e7ed1c2896ec4ff56d';
const MODULE_NAME = 'mock_coins';

// Helper function for JSON stringification
const customStringify = (obj) => {
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'bigint') {
            return value.toString();
        }
        if (value instanceof Uint8Array) {
            return Array.from(value);
        }
        return value;
    }, 2);
};

async function testContract() {
    try {
        const client = new AptosClient(NODE_URL);
        const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

        // Create a test account
        const account = new AptosAccount();
        const accountAddress = account.address().hex();
        console.log('\n📝 Created test account:', accountAddress);

        // Fund the account with significantly more APT
        await faucetClient.fundAccount(account.address(), 500_000_000);
        console.log('💰 Funded test account with APT');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Fetch market data first
        console.log('\n📊 Fetching market data...');
        const marketData = await client.getAccountResource(
            CONTRACT_ADDRESS,
            `${CONTRACT_ADDRESS}::${MODULE_NAME}::Market`
        );
        
        const coins = marketData.data.coins;
        console.log('Available coins:', customStringify(coins));

        // Calculate amount based on current price
        const btcPrice = BigInt(coins[0].current_value);
        const amountInUSD = BigInt(20_000_000); // 20 USD with 6 decimals
        const coinsToBuy = amountInUSD / btcPrice;

        console.log('\n🔄 Testing buy_coin...');
        const buyPayload = {
            type: "entry_function_payload",
            function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::buy_coin`,
            type_arguments: [],
            arguments: [
                "0",  // BTC index
                amountInUSD.toString()
            ]
        };

        // Generate and submit transaction with higher gas
        const txnOptions = {
            max_gas_amount: "1000000",
            gas_unit_price: "100",
        };

        console.log('Submitting buy transaction...');
        const rawTxn = await client.generateTransaction(accountAddress, buyPayload, txnOptions);
        const signedTxn = await client.signTransaction(account, rawTxn);
        const pendingTxn = await client.submitTransaction(signedTxn);
        
        console.log('Waiting for transaction confirmation...');
        const result = await client.waitForTransactionWithResult(
            pendingTxn.hash,
            { timeoutSecs: 30, checkSuccess: true }
        );
        
        console.log('\nTransaction Result:', customStringify({
            hash: result.hash,
            success: result.success,
            version: result.version,
            gasUsed: result.gas_used,
            events: result.events
        }));

        // Check portfolio
        if (result.success) {
            console.log('\n📊 Checking portfolio...');
            try {
                const portfolio = await client.getAccountResource(
                    accountAddress,
                    `${CONTRACT_ADDRESS}::user_portfolio::Portfolio`
                );
                console.log('Portfolio data:', customStringify(portfolio.data));
            } catch (e) {
                console.log('Portfolio not found. Error:', e.message);
            }
        }

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response?.data) {
            console.error('Error details:', customStringify(error.response.data));
        }
    }
}

console.log('🚀 Starting contract tests...');
testContract();