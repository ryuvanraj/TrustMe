module mock_coins_addr::mock_coins {
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::account;
    use std::vector;

    struct Coin has copy, drop, store {
        symbol: vector<u8>,
        fixed_cap: u64,          // Total number of coins available
        current_value: u128,     // Use u128 to store scaled float values (e.g., multiply float by 10^6)
        last_update: u64,
    }

    struct Market has key {
        coins: vector<Coin>,
    }

    struct MarketPriceUpdatedEvent has copy, drop, store {
        symbol: vector<u8>,
        new_price: u128,
        timestamp: u64,
    }

    const E_MARKET_NOT_INITIALIZED: u64 = 1;
    const E_MARKET_ALREADY_EXISTS: u64 = 2;

    public entry fun initialize(account: &signer) {
        let signer_addr = signer::address_of(account);
        assert!(!exists<Market>(signer_addr), E_MARKET_ALREADY_EXISTS);

        let now = timestamp::now_microseconds();
        let coins = vector[
            Coin {
                symbol: b"BTC",
                fixed_cap: 21000000,        // Bitcoin max supply
                current_value: 50000000000, // Initial price: 50,000 (scaled by 10^6)
                last_update: now
            },
            Coin {
                symbol: b"ETH",
                fixed_cap: 115000000,       // Ethereum max supply
                current_value: 4000000000,  // Initial price: 4,000 (scaled by 10^6)
                last_update: now
            },
            Coin {
                symbol: b"ADA",
                fixed_cap: 45000000000,     // Cardano max supply
                current_value: 2000000,     // Initial price: 2 (scaled by 10^6)
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

        event::emit_event(
            &mut market.price_events,
            MarketPriceUpdatedEvent {
                symbol: *&coin.symbol,
                new_price: new_price,
                timestamp: coin.last_update
            }
        );
    }


        while (i < len) {
            let coin = vector::borrow(coins, i);
            vector::push_back(&mut total_available, coin.fixed_cap);
            i = i + 1;
        };


        // Convert amount_in_usd to u64 for the transfer
        assert!(amount_in_usd <= MAX_U64_VALUE, E_AMOUNT_TOO_LARGE);
        let transfer_amount = (amount_in_usd as u64);

        coin::transfer<AptosCoin>(
            account,  // The sender can be any account
            @mock_coins_addr, // The fixed contract address
            transfer_amount
        );
    }
}