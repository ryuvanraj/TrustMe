#!/bin/bash

# Your account address
ACCOUNT="0x8ed1668c895c1228c1cee850f4ce8d1efb462550772be3e7ed1c2896ec4ff56d"

# View market data
aptos move run \
    --function-id "${ACCOUNT}::mock_coins::view_market_data" \
    --profile default

# Fetch events (last 100 events)
echo "Fetching price update events..."
aptos account list-events \
    --account-address $ACCOUNT \
    --struct-name Market \
    --field price_events \
    --profile default \
    --limit 100