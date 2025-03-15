module mock_coins_addr::user_portfolio {
    use aptos_framework::signer;
    use aptos_framework::event;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use std::vector;

    /// Represents a single coin holding in the portfolio
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
}