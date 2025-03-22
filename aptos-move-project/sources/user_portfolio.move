module mock_coins_addr::user_portfolio {
    use aptos_framework::signer;
    use aptos_framework::event;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use std::vector;
    use std::string;
    use std::option;

    const E_INSUFFICIENT_BALANCE: u64 = 1001;
    const E_COIN_NOT_FOUND: u64 = 1002;

    struct CoinData has copy, drop, store {
        symbol: vector<u8>,
        amount: u128,
    }

    struct Portfolio has key {
        coins: vector<CoinData>
    }

    struct PortfolioEvents has key {
        portfolio_events: event::EventHandle<PortfolioEvent>
    }

    struct PortfolioEvent has copy, drop, store {
        symbol: vector<u8>,
        amount: u128,
        timestamp: u64
    }

    const E_PORTFOLIO_NOT_FOUND: u64 = 1;

    public fun add_to_portfolio(account: &signer, symbol: vector<u8>, amount: u128) 
    acquires Portfolio, PortfolioEvents {
        let user_addr = signer::address_of(account);

        if (!exists<Portfolio>(user_addr)) {
            move_to(account, Portfolio { coins: vector[] });
        };

        if (!exists<PortfolioEvents>(user_addr)) {
            move_to(account, PortfolioEvents { 
                portfolio_events: account::new_event_handle(account)
            });
        };

        let portfolio = borrow_global_mut<Portfolio>(user_addr);
        let events = borrow_global_mut<PortfolioEvents>(user_addr);
        let i = 0;
        let len = vector::length(&portfolio.coins);

        while (i < len) {
            let coin_data = vector::borrow_mut(&mut portfolio.coins, i);
            if (coin_data.symbol == symbol) {
                coin_data.amount = coin_data.amount + amount;
                event::emit_event(
                    &mut events.portfolio_events,
                    PortfolioEvent {
                        symbol: *&coin_data.symbol,
                        amount: coin_data.amount,
                        timestamp: timestamp::now_microseconds()
                    }
                );
                return;
            };
            i = i + 1;
        };

        vector::push_back(&mut portfolio.coins, CoinData { symbol, amount });
        event::emit_event(
            &mut events.portfolio_events,
            PortfolioEvent {
                symbol,
                amount,
                timestamp: timestamp::now_microseconds()
            }
        );
    }

    public entry fun view_portfolio(account: &signer) acquires Portfolio, PortfolioEvents {
        let user_addr = signer::address_of(account);
        assert!(exists<Portfolio>(user_addr), E_PORTFOLIO_NOT_FOUND);
        
        let portfolio = borrow_global<Portfolio>(user_addr);
        
        if (!exists<PortfolioEvents>(user_addr)) {
            move_to(account, PortfolioEvents { 
                portfolio_events: account::new_event_handle(account)
            });
        };
        
        let events = borrow_global_mut<PortfolioEvents>(user_addr);
        let i = 0;
        let len = vector::length(&portfolio.coins);
        
        while (i < len) {
            let coin_data = vector::borrow(&portfolio.coins, i);
            event::emit_event(
                &mut events.portfolio_events,
                PortfolioEvent {
                    symbol: *&coin_data.symbol,
                    amount: coin_data.amount,
                    timestamp: timestamp::now_microseconds()
                }
            );
            i = i + 1;
        };
    }

    #[view]
    public fun get_portfolio(account_addr: address): vector<CoinData> 
    acquires Portfolio {
        if (!exists<Portfolio>(account_addr)) {
            return vector::empty();
        };
        
        let portfolio = borrow_global<Portfolio>(account_addr);
        *&portfolio.coins
    }

    public fun reduce_coin_in_portfolio(account: &signer, symbol: vector<u8>, amount: u128) acquires Portfolio {
    let user_addr = signer::address_of(account);
    let portfolio = borrow_global_mut<Portfolio>(user_addr);

    let i = 0;
    let len = vector::length(&portfolio.coins);
    while (i < len) {
        let coin = vector::borrow_mut(&mut portfolio.coins, i);
        if (vectors_equal(&coin.symbol, &symbol)) {
            assert!(coin.amount >= amount, E_INSUFFICIENT_BALANCE);
            coin.amount = coin.amount - amount;
            break;
        };
        i = i + 1;
    }
}


public entry fun modify_portfolio(account: &signer, symbol: vector<u8>, amount: u128) acquires Portfolio {
    let user_addr = signer::address_of(account);
    let portfolio = borrow_global_mut<Portfolio>(user_addr);

    let i = 0;
    let len = vector::length(&portfolio.coins);

    while (i < len) {
        let coin = vector::borrow_mut(&mut portfolio.coins, i);
        if (vectors_equal(&coin.symbol, &symbol)) {
            coin.amount = coin.amount + amount;
            return;
        };
        i = i + 1;
    };

    vector::push_back(&mut portfolio.coins, CoinData { symbol, amount });
}

#[view]
public fun get_stock_portfolio(account_addr: address): vector<CoinData> 
acquires Portfolio {
    if (!exists<Portfolio>(account_addr)) {
        return vector::empty();
    };
    
    let portfolio = borrow_global<Portfolio>(account_addr);
    let stocks = vector::empty<CoinData>();
    let i = 0;
    let len = vector::length(&portfolio.coins);
    
    // Stock symbols we're looking for
    let stock_symbols = vector[b"AAPL", b"GOOGL", b"AMZN"];
    
    while (i < len) {
        let coin_data = vector::borrow(&portfolio.coins, i);
        let j = 0;
        let stock_len = vector::length(&stock_symbols);
        
        while (j < stock_len) {
            if (vectors_equal(&coin_data.symbol, vector::borrow(&stock_symbols, j))) {
                vector::push_back(&mut stocks, *coin_data);
                break;
            };
            j = j + 1;
        };
        
        i = i + 1;
    };
    
    stocks
}

public entry fun view_stock_portfolio(account: &signer) acquires Portfolio, PortfolioEvents {
    let user_addr = signer::address_of(account);
    assert!(exists<Portfolio>(user_addr), E_PORTFOLIO_NOT_FOUND);
    
    let portfolio = borrow_global<Portfolio>(user_addr);
    
    if (!exists<PortfolioEvents>(user_addr)) {
        move_to(account, PortfolioEvents { 
            portfolio_events: account::new_event_handle(account)
        });
    };
    
    let events = borrow_global_mut<PortfolioEvents>(user_addr);
    let i = 0;
    let len = vector::length(&portfolio.coins);
    
    // Stock symbols we're looking for
    let stock_symbols = vector[b"AAPL", b"GOOGL", b"AMZN"];
    
    while (i < len) {
        let coin_data = vector::borrow(&portfolio.coins, i);
        let j = 0;
        let stock_len = vector::length(&stock_symbols);
        let is_stock = false;
        
        while (j < stock_len) {
            if (vectors_equal(&coin_data.symbol, vector::borrow(&stock_symbols, j))) {
                is_stock = true;
                break;
            };
            j = j + 1;
        };
        
        if (is_stock) {
            event::emit_event(
                &mut events.portfolio_events,
                PortfolioEvent {
                    symbol: *&coin_data.symbol,
                    amount: coin_data.amount,
                    timestamp: timestamp::now_microseconds()
                }
            );
        };
        
        i = i + 1;
    };
}

// Helper function to check if two vectors are equal
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
public fun reduce_coin_in_portfolio_v2(
    account_addr: address, 
    symbol: vector<u8>, 
    amount: u128
) acquires Portfolio {
    assert!(exists<Portfolio>(account_addr), E_PORTFOLIO_NOT_FOUND);
    let portfolio = borrow_global_mut<Portfolio>(account_addr);

    let i = 0;
    let len = vector::length(&portfolio.coins);

    while (i < len) {
        let coin = vector::borrow_mut(&mut portfolio.coins, i);
        if (vectors_equal(&coin.symbol, &symbol)) {
            assert!(coin.amount >= amount, E_INSUFFICIENT_BALANCE);
            coin.amount = coin.amount - amount;
            return; // Exit after reducing
        };
        i = i + 1;
    };

    abort E_COIN_NOT_FOUND; // If the symbol is not found
}

}
