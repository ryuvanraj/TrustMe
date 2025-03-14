const { exec } = require("child_process");

function updatePrices() {
  // Generate new prices (mock values)
  // For instance, random fluctuations around a base price:
  const new_btc = Math.floor(50000 + (Math.random() - 0.5) * 1000);
  const new_eth = Math.floor(4000 + (Math.random() - 0.5) * 200);
  const new_ada = Math.floor(2 + (Math.random() - 0.5) * 0.2);

  const command = `aptos move run --profile devnet --function-id 0xb4c854f4b2c05d748afdde0777ff7a87aa114bf16a098fb131b516d03d0d1740::crypto_market::update_prices --args "u64:${new_btc}" "u64:${new_eth}" "u64:${new_ada}"`;
  console.log("Updating prices:", new_btc, new_eth, new_ada);
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error updating prices: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error: ${stderr}`);
      return;
    }
    console.log(`Output: ${stdout}`);
  });
}

// Update prices every 20 seconds
setInterval(updatePrices, 20000);
