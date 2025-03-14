module 0xb4c854f4b2c05d748afdde0777ff7a87aa114bf16a098fb131b516d03d0d1740::crypto_market {
    use aptos_framework::timestamp;
    use std::vector;
    use std::signer;

    /// A structure to represent a coin in the market.
    /// - `symbol` is the coin ticker (e.g., "BTC").
    /// - `fixed_cap` is the maximum (mock) supply.
    /// - `current_value` is the current (mock) price value.
    /// - `last_update` is a timestamp (in microseconds) of the last update.
    struct Coin has copy, drop, store {
        symbol: vector<u8>,
        fixed_cap: u64,
        current_value: u64,
        last_update: u64,
    }

    /// A resource that stores the market information (three coins).
    struct Market has key {
        coins: vector<Coin>,
    }

    /// Initializes the market with three coins.
    /// This function should be called once by the market admin.
    public entry fun initialize(m: &signer) {
        // Ensure that Market has not been initialized already.
        assert!(!exists<Market>(signer::address_of(m)), 1);
        let now = timestamp::now_microseconds();
        let coins = vector[
            Coin {
                symbol: b"BTC",
                fixed_cap: 21000000, // e.g., 21 million
                current_value: 50000, // initial mock price, e.g., $50,000
                last_update: now
            },
            Coin {
                symbol: b"ETH",
                fixed_cap: 115000000, // e.g., 115 million
                current_value: 4000,  // initial mock price, e.g., $4,000
                last_update: now
            },
            Coin {
                symbol: b"ADA",
                fixed_cap: 45000000000, // e.g., 45 billion
                current_value: 2,       // initial mock price, e.g., $2
                last_update: now
            }
        ];
        move_to(m, Market { coins });
    }

    /// Updates the prices of the three coins.
    /// This function is meant to be called externally (e.g., by an off-chain oracle) every 20 seconds.
    /// The new prices are provided as arguments.
    public entry fun update_prices(m: &signer, new_btc: u64, new_eth: u64, new_ada: u64) acquires Market {
        let market = borrow_global_mut<Market>(signer::address_of(m));
        let now = timestamp::now_microseconds();
        let coins = &mut market.coins;
        // Update BTC (at index 0)
        vector::borrow_mut(coins, 0).current_value = new_btc;
        vector::borrow_mut(coins, 0).last_update = now;
        // Update ETH (at index 1)
        vector::borrow_mut(coins, 1).current_value = new_eth;
        vector::borrow_mut(coins, 1).last_update = now;
        // Update ADA (at index 2)
        vector::borrow_mut(coins, 2).current_value = new_ada;
        vector::borrow_mut(coins, 2).last_update = now;
    }

    /// (Optional) A helper function to read the market data.
    public fun get_market(addr: address): Market acquires Market {
        move_from<Market>(addr)
    }
}
