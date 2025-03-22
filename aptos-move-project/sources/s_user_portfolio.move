module stock_market_addr::s_user_portfolio {
    use aptos_framework::signer;
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use std::vector;

    const E_INSUFFICIENT_BALANCE: u64 = 1001;

    struct StockData has copy, drop, store {
        symbol: vector<u8>,
        shares: u128,
    }

    struct Portfolio has key {
        stocks: vector<StockData>,
    }

    public fun add_to_portfolio(account: &signer, symbol: vector<u8>, shares: u128) acquires Portfolio {
        let user_address = signer::address_of(account);

        if (!exists<Portfolio>(user_address)) {
            move_to(account, Portfolio { stocks: vector[] });
        };

        let portfolio = borrow_global_mut<Portfolio>(user_address);
        let i = 0;
        let len = vector::length(&portfolio.stocks);

        while (i < len) {
            let stock_data = vector::borrow_mut(&mut portfolio.stocks, i);
            if (stock_data.symbol == symbol) {
                stock_data.shares = stock_data.shares + shares;
                return;
            };
            i = i + 1;
        };

        vector::push_back(&mut portfolio.stocks, StockData { symbol, shares });
    }

    public fun reduce_stock_in_portfolio(account_addr: address, symbol: vector<u8>, shares: u128) acquires Portfolio {
        let portfolio = borrow_global_mut<Portfolio>(account_addr);

        let i = 0;
        let len = vector::length(&portfolio.stocks);
        while (i < len) {
            let stock = vector::borrow_mut(&mut portfolio.stocks, i);
            if (stock.symbol == symbol) {
                assert!(stock.shares >= shares, E_INSUFFICIENT_BALANCE);
                stock.shares = stock.shares - shares;
                return;
            };
            i = i + 1;
        };
    }

    #[view]
    public fun get_portfolio(account_addr: address): vector<StockData> acquires Portfolio {
        if (!exists<Portfolio>(account_addr)) {
            return vector::empty();
        };

        let portfolio = borrow_global<Portfolio>(account_addr);
        *&portfolio.stocks
    }
}
