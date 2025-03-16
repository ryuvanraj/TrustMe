module mock_coins_addr::mock_coins {
    use 0x8ed1668c895c1228c1cee850f4ce8d1efb462550772be3e7ed1c2896ec4ff56d::user_portfolio;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::account;
    use std::vector;
    use std::signer;
    use aptos_framework::coin::{Self};
    use aptos_framework::aptos_coin::AptosCoin;

    struct Coin has copy, drop, store {
        symbol: vector<u8>,
        fixed_cap: u64,          
        current_value: u128,     
        last_update: u64,
    }

    struct Market has key {
        coins: vector<Coin>,
        price_events: event::EventHandle<MarketPriceUpdatedEvent>,
    }

    struct CoinData has copy, drop, store {
        symbol: vector<u8>,
        fixed_cap: u64,
        current_value: u128,
        last_update: u64,
    }

    struct MarketPriceUpdatedEvent has copy, drop, store {
        symbol: vector<u8>,
        new_price: u128,
        timestamp: u64,
    }

    const MAX_U64_VALUE: u128 = 18446744073709551615;
    const E_MARKET_NOT_INITIALIZED: u64 = 1;
    const E_MARKET_ALREADY_EXISTS: u64 = 2;
    const E_INSUFFICIENT_COINS: u64 = 3;
    const E_AMOUNT_TOO_LARGE: u64 = 4;

    public entry fun initialize(account: &signer) {
        let signer_addr = signer::address_of(account);
        assert!(!exists<Market>(signer_addr), E_MARKET_ALREADY_EXISTS);

        let now = timestamp::now_microseconds();
        let coins = vector[
            Coin {
                symbol: b"BTC",
                fixed_cap: 21000000,        
                current_value: 50000000000, 
                last_update: now
            },
            Coin {
                symbol: b"ETH",
                fixed_cap: 115000000,       
                current_value: 4000000000,  
                last_update: now
            },
            Coin {
                symbol: b"ADA",
                fixed_cap: 45000000000,     
                current_value: 2000000,     
                last_update: now
            }
        ];

        move_to(account, Market {
            coins,
            price_events: account::new_event_handle(account)
        });
    }

    public fun get_market_info(account: &signer): vector<CoinData> acquires Market {
        let market = borrow_global<Market>(signer::address_of(account));
        let coins = &market.coins;
        let coin_data = vector::empty<CoinData>();

        let len = vector::length(coins);
        let i = 0;
        while (i < len) {
            let coin = vector::borrow(coins, i);
            vector::push_back(
                &mut coin_data,
                CoinData {
                    symbol: *&coin.symbol,
                    fixed_cap: coin.fixed_cap,
                    current_value: coin.current_value,
                    last_update: coin.last_update,
                },
            );
            i = i + 1;
        };

        coin_data
    }

    public entry fun view_market_data(account: &signer) acquires Market {
        let market = borrow_global_mut<Market>(signer::address_of(account));
        let coins = &market.coins;
        
        let i = 0;
        let len = vector::length(coins);
        while (i < len) {
            let coin = vector::borrow(coins, i);
            event::emit_event(
                &mut market.price_events,
                MarketPriceUpdatedEvent {
                    symbol: *&coin.symbol,
                    new_price: coin.current_value,
                    timestamp: coin.last_update
                }
            );
            i = i + 1;
        };
    }

    public entry fun update_prices(
        account: &signer,
        new_btc: u128,
        new_eth: u128,
        new_ada: u128
    ) acquires Market {
        let market = borrow_global_mut<Market>(signer::address_of(account));
        let now = timestamp::now_microseconds();
        let coins = &mut market.coins;

        vector::borrow_mut(coins, 0).current_value = new_btc;
        vector::borrow_mut(coins, 0).last_update = now;
        vector::borrow_mut(coins, 1).current_value = new_eth;
        vector::borrow_mut(coins, 1).last_update = now;
        vector::borrow_mut(coins, 2).current_value = new_ada;
        vector::borrow_mut(coins, 2).last_update = now;
    }

    public entry fun emit_price_update_event(
        account: &signer,
        coin_index: u64,
        new_price: u128
    ) acquires Market {
        let market = borrow_global_mut<Market>(signer::address_of(account));
        let coin = vector::borrow_mut(&mut market.coins, coin_index);
        coin.current_value = new_price;
        coin.last_update = timestamp::now_microseconds();

        event::emit_event(
            &mut market.price_events,
            MarketPriceUpdatedEvent {
                symbol: *&coin.symbol,
                new_price: new_price,
                timestamp: coin.last_update
            }
        );
    }
    public fun get_total_available(account: &signer): vector<u64> acquires Market {
        let market = borrow_global<Market>(signer::address_of(account));
        let coins = &market.coins;
        let total_available = vector::empty<u64>();

        let len = vector::length(coins);
        let i = 0;
        while (i < len) {
            let coin = vector::borrow(coins, i);
            vector::push_back(&mut total_available, coin.fixed_cap);
            i = i + 1;
        };

        total_available
    }
    
    public entry fun buy_coin(
        account: &signer,  // This can be any user's account
        coin_index: u64, 
        amount_in_usd: u128
    ) acquires Market {
        let buyer_addr = signer::address_of(account);
        
        // Get market data from the contract address
        let market = borrow_global_mut<Market>(@mock_coins_addr);
        let coin = vector::borrow_mut(&mut market.coins, coin_index);
    
        // Calculate coins to transfer (USD amount / price per coin)
        // Both values are scaled by 10^6, so we need to adjust the result
        let coins_to_transfer = ((amount_in_usd * 1_000_000) / coin.current_value);
    
        // Ensure there are enough coins available in the market
        assert!(coin.fixed_cap >= (coins_to_transfer as u64), E_INSUFFICIENT_COINS);

        // Convert amount_in_usd to u64 for the transfer
        assert!(amount_in_usd <= MAX_U64_VALUE, E_AMOUNT_TOO_LARGE);
        let transfer_amount = (amount_in_usd as u64);

        // Transfer APT from buyer to contract
        // Note: This will work with any account that has sufficient APT
        coin::transfer<AptosCoin>(
            account,  // The sender can be any account
            @mock_coins_addr, // The fixed contract address
            transfer_amount
        );
    
        // Update the market supply
        coin.fixed_cap = coin.fixed_cap - (coins_to_transfer as u64);
    
        // Add coins to the buyer's portfolio
        user_portfolio::add_to_portfolio(account, *&coin.symbol, coins_to_transfer);
    
        // Emit purchase event
        event::emit_event(
            &mut market.price_events,
            MarketPriceUpdatedEvent {
                symbol: *&coin.symbol,
                new_price: coin.current_value,
                timestamp: timestamp::now_microseconds()
            }
        );
    }
    public fun get_total_available_for_coin(account: &signer, coin_index: u64): u64 acquires Market {
        let market = borrow_global<Market>(signer::address_of(account));
        let coin = vector::borrow(&market.coins, coin_index);
        coin.fixed_cap
    }

    public fun update_total_available(account: &signer, coin_index: u64, new_total: u64) acquires Market {
        let market = borrow_global_mut<Market>(signer::address_of(account));
        let coin = vector::borrow_mut(&mut market.coins, coin_index);
        coin.fixed_cap = new_total;
    }

    public entry fun sell_coin(account: &signer, symbol: vector<u8>, amount: u128) acquires Market {
    let market = borrow_global_mut<Market>(signer::address_of(account));
    
    let coin_found = false;  // Declare as mutable
    let i = 0;
    let len = vector::length(&market.coins);

    // Loop through the market coins to find the coin to sell
    while (i < len) {
        let coin = vector::borrow_mut(&mut market.coins, i);

        // Check if the coin symbol matches
        if (vectors_equal(&coin.symbol, &symbol)) {
            coin_found = true;

            // Ensure there's enough balance in the market
            assert!(coin.fixed_cap >= (amount as u64), E_INSUFFICIENT_COINS);
            coin.fixed_cap = coin.fixed_cap - (amount as u64);

            // Now that we've updated the market, let's modify the portfolio
            user_portfolio::reduce_coin_in_portfolio(account, coin.symbol, amount);

            // Emit the price update event
            event::emit_event(
                &mut market.price_events,
                MarketPriceUpdatedEvent {
                    symbol: coin.symbol,
                    new_price: coin.current_value,
                    timestamp: timestamp::now_microseconds(),
                }
            );
            break;
        };
        i = i + 1;
    };

    // If no matching coin is found, throw an error
    assert!(coin_found, E_MARKET_NOT_INITIALIZED);
}


public fun vectors_equal(v1: &vector<u8>, v2: &vector<u8>): bool {
    if (vector::length(v1) != vector::length(v2)) {
        return false;
    };

    let len = vector::length(v1);
    let i = 0;
    
    while (i < len) {
        if (vector::borrow(v1, i) != vector::borrow(v2, i)) {
            return false;
        };
        i = i + 1;
    };
    true
}
public entry fun sell_coin_v2(account: &signer, symbol: vector<u8>, amount: u128, recipient: address) acquires Market {
    let market = borrow_global_mut<Market>(signer::address_of(account));
    
    let coin_found = false;  // Declare as mutable
    let i = 0;
    let len = vector::length(&market.coins);

    // Loop through the market coins to find the coin to sell
    while (i < len) {
        let coin = vector::borrow_mut(&mut market.coins, i);

        // Check if the coin symbol matches
        if (vectors_equal(&coin.symbol, &symbol)) {
            coin_found = true;

            // Ensure there's enough balance in the market
            assert!(coin.fixed_cap >= (amount as u64), E_INSUFFICIENT_COINS);
            coin.fixed_cap = coin.fixed_cap - (amount as u64);

            // Now that we've updated the market, let's modify the portfolio
            user_portfolio::reduce_coin_in_portfolio(account, coin.symbol, amount);

            // Emit the price update event
            event::emit_event(
                &mut market.price_events,
                MarketPriceUpdatedEvent {
                    symbol: coin.symbol,
                    new_price: coin.current_value,
                    timestamp: timestamp::now_microseconds(),
                }
            );

            // Transfer the coins to the recipient account
            coin::transfer<AptosCoin>(account, recipient, amount as u64); // Corrected here

            break;
        };
        i = i + 1;
    };

    // If no matching coin is found, throw an error
    assert!(coin_found, E_MARKET_NOT_INITIALIZED);
}

public entry fun sell_coin_v3(
    account: &signer, 
    symbol: vector<u8>, 
    amount: u128, 
    recipient: address
) acquires Market{
    let seller_address = signer::address_of(account);
    let market = borrow_global_mut<Market>(seller_address);
    let coin_found = false;
    let i = 0;
    let len = vector::length(&market.coins);

    // Loop through the market coins to find the specified coin
    while (i < len) {
        let coin = vector::borrow_mut(&mut market.coins, i);

        if (vectors_equal(&coin.symbol, &symbol)) {
            coin_found = true;

            // Ensure there's enough balance in the market
            assert!(coin.fixed_cap >= (amount as u64), E_INSUFFICIENT_COINS);
            coin.fixed_cap = coin.fixed_cap - (amount as u64);

            // Reduce the recipient's portfolio coins
            user_portfolio::reduce_coin_in_portfolio_v2(
                recipient, // The recipient's address
                symbol,
                amount
            );

            // Add the coins to the seller's portfolio
            user_portfolio::add_to_portfolio(account, symbol, amount);

            // Emit the price update event
            event::emit_event(
                &mut market.price_events,
                MarketPriceUpdatedEvent {
                    symbol,
                    new_price: coin.current_value,
                    timestamp: timestamp::now_microseconds(),
                }
            );

            return; // Exit after processing
        };
        i = i + 1;
    };

    // If the coin is not found, throw an error
    assert!(coin_found, E_MARKET_NOT_INITIALIZED);
}
public entry fun sell_coin_v4(
    account: &signer, 
    symbol: vector<u8>, 
    amount: u128, 
    recipient: address
) acquires Market {
    let seller_address = signer::address_of(account);
    let market = borrow_global_mut<Market>(seller_address);
    let coin_found = false;
    let i = 0;
    let len = vector::length(&market.coins);

    // Loop through the market coins to find the specified coin
    while (i < len) {
        let coin = vector::borrow_mut(&mut market.coins, i);

        if (vectors_equal(&coin.symbol, &symbol)) {
            coin_found = true;

            // Ensure there's enough balance in the market
            assert!(coin.fixed_cap >= (amount as u64), E_INSUFFICIENT_COINS);
            coin.fixed_cap = coin.fixed_cap - (amount as u64);

            // **APT Transfer Logic Added Here**
            coin::transfer<AptosCoin>(
                account,     // The seller who is executing this transaction
                recipient,   // The recipient (buyer) of the APT tokens
                amount as u64 // The APT amount to transfer
            );

            // Modify recipient portfolio
            user_portfolio::reduce_coin_in_portfolio_v2(
                recipient,   // Reduce coins from the recipient's portfolio
                symbol,
                amount
            );

            // Modify seller portfolio
            user_portfolio::add_to_portfolio(account, symbol, amount);

            // Emit the price update event
            event::emit_event(
                &mut market.price_events,
                MarketPriceUpdatedEvent {
                    symbol,
                    new_price: coin.current_value,
                    timestamp: timestamp::now_microseconds(),
                }
            );

            return; // Exit after processing
        };
        i = i + 1;
    };

    // If the coin is not found, throw an error
    assert!(coin_found, E_MARKET_NOT_INITIALIZED);
}
}
