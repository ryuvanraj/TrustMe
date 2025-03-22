module 0x8ed1668c895c1228c1cee850f4ce8d1efb462550772be3e7ed1c2896ec4ff56d::mock_stock_market {
    use aptos_framework::event;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use std::signer;
    use std::vector;
    use std::option;

    struct Stock has copy, drop, store {
        symbol: vector<u8>,
        available_shares: u64,
        price_per_share: u128, // Price scaled by 10^6
        wallet_id: u256,
    }

    struct UserPortfolio has key {
        holdings: vector<StockHolding>,
    }

    public entry fun update_prices(
    account: &signer,
    stock_index: u64,
    new_price: u128
) acquires StockMarket {
    let market_address = signer::address_of(account);

    // Access the stock market resource
    let stock_market = borrow_global_mut<StockMarket>(market_address);

    // Validate stock index
    assert!(stock_index < vector::length(&stock_market.stocks), E_INVALID_STOCK_INDEX);

    // Update stock price
    let stock = vector::borrow_mut(&mut stock_market.stocks, stock_index);
    stock.price_per_share = new_price;

    // Emit price update event
    event::emit_event(&mut stock_market.stock_update_events, StockUpdatedEvent {
        symbol: stock.symbol,
        new_price,
        timestamp: timestamp::now_microseconds(),
    });
}


    struct StockHolding has copy, drop, store {
        symbol: vector<u8>,
        shares: u128, // User can hold fractional shares
    }

    struct StockMarket has key {
        stocks: vector<Stock>,
        stock_update_events: event::EventHandle<StockUpdatedEvent>,
    }

    struct StockUpdatedEvent has copy, drop, store {
        symbol: vector<u8>,
        new_price: u128,
        timestamp: u64,
    }

    const E_MARKET_ALREADY_INITIALIZED: u64 = 1;
    const E_INSUFFICIENT_SHARES: u64 = 2;
    const E_INVALID_STOCK_INDEX: u64 = 3;

    /// Initialize the mock stock market
    public entry fun initialize(account: &signer) {
        let market_address = signer::address_of(account);

        assert!(!exists<StockMarket>(market_address), E_MARKET_ALREADY_INITIALIZED);

        let stocks = vector[
            Stock {
                symbol: b"CompanyA",
                available_shares: 2000,
                price_per_share: 1000_000, // $10
                wallet_id: 0x8ed1668c895c1228c1cee850f4ce8d1efb462550772be3e7ed1c2896ec4ff56,
            },
            Stock {
                symbol: b"CompanyB",
                available_shares: 1500,
                price_per_share: 2000_000, // $20
                wallet_id: 0x8ed1668c895c1228c1cee850f4ce8d1efb462550772be3e7ed1c2896ec4ff56,
            },
            Stock {
                symbol: b"CompanyC",
                available_shares: 1000,
                price_per_share: 4000_000, // $40
                wallet_id: 0x8ed1668c895c1228c1cee850f4ce8d1efb462550772be3e7ed1c2896ec4ff56,
            },
        ];

        move_to(account, StockMarket {
            stocks,
            stock_update_events: account::new_event_handle(account),
        });
    }

    /// Buy stock
        public entry fun buy_stock(
        account: &signer,
        stock_index: u64,
        amount_to_buy: u128
    ) acquires StockMarket, UserPortfolio {
        let market_address = signer::address_of(account);

        // Access stock market
        let stock_market = borrow_global_mut<StockMarket>(market_address);

        // Validate stock index
        assert!(stock_index < vector::length(&stock_market.stocks), E_INVALID_STOCK_INDEX);

        let stock = vector::borrow_mut(&mut stock_market.stocks, stock_index);

        // Check available shares
        assert!(stock.available_shares >= (amount_to_buy as u64), E_INSUFFICIENT_SHARES);

        // Update stock count
        stock.available_shares = stock.available_shares - (amount_to_buy as u64);

        // Update or create user portfolio
        let user_address = signer::address_of(account);

        if (!exists<UserPortfolio>(user_address)) {
            move_to(account, UserPortfolio {
                holdings: vector::empty<StockHolding>(),
            });
        };

        let user_portfolio = borrow_global_mut<UserPortfolio>(user_address);

        let updated = false;
        let i = 0;

        while (i < vector::length(&user_portfolio.holdings)) {
            let holding = vector::borrow_mut(&mut user_portfolio.holdings, i);
            if (holding.symbol == stock.symbol) {
                holding.shares = holding.shares + amount_to_buy;
                updated = true;
                break;
            };
            i = i + 1;
        };

        if (!updated) {
            vector::push_back(&mut user_portfolio.holdings, StockHolding {
                symbol: stock.symbol,
                shares: amount_to_buy,
            });
        }
    }

}
