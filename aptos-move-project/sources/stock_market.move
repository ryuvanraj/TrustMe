module stock_market_addr::stock_market {
    use 0x8ed1668c895c1228c1cee850f4ce8d1efb462550772be3e7ed1c2896ec4ff56d::s_user_portfolio;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::account;
    use std::vector;
    use std::signer;
    use aptos_framework::coin::{Self};
    use aptos_framework::aptos_coin::AptosCoin;

    struct Stock has copy, drop, store {
        symbol: vector<u8>,
        total_shares: u64,
        available_shares: u64,
        price_per_share: u128,
        last_update: u64,
    }

    struct StockMarket has key {
        stocks: vector<Stock>,
        stock_events: event::EventHandle<StockUpdatedEvent>,
    }

    struct StockUpdatedEvent has copy, drop, store {
        symbol: vector<u8>,
        new_price: u128,
        timestamp: u64,
    }

    struct DebugEvent has copy, drop, store {
        shares_to_buy: u64,
        available_shares: u64,
        amount_in_usd: u128,
        price_per_share: u128,
    }

    const COMPANY_WALLET: address = @0x8ed1668c895c1228c1cee850f4ce8d1efb462550772be3e7ed1c2896ec4ff56d;
    const E_MARKET_NOT_INITIALIZED: u64 = 1;
    const E_INSUFFICIENT_SHARES: u64 = 2;
    const E_AMOUNT_TOO_LARGE: u64 = 3;

    public entry fun initialize(account: &signer) {
        let signer_addr = signer::address_of(account);
        assert!(!exists<StockMarket>(signer_addr), E_MARKET_NOT_INITIALIZED);

        let now = timestamp::now_microseconds();
        let stocks = vector[
            Stock {
                symbol: b"CompanyA",
                total_shares: 2000,
                available_shares: 1000,
                price_per_share: 5000,
                last_update: now,
            },
            Stock {
                symbol: b"CompanyB",
                total_shares: 1500,
                available_shares: 750,
                price_per_share: 3000,
                last_update: now,
            },
            Stock {
                symbol: b"CompanyC",
                total_shares: 1000,
                available_shares: 500,
                price_per_share: 1000,
                last_update: now,
            }
        ];

        move_to(account, StockMarket {
            stocks,
            stock_events: account::new_event_handle(account),
        });
    }

    public entry fun update_prices(
        account: &signer,
        new_price_a: u128,
        new_price_b: u128,
        new_price_c: u128
    ) acquires StockMarket {
        let stock_market = borrow_global_mut<StockMarket>(signer::address_of(account));

        let stock_a = vector::borrow_mut(&mut stock_market.stocks, 0);
        stock_a.price_per_share = new_price_a;

        let stock_b = vector::borrow_mut(&mut stock_market.stocks, 1);
        stock_b.price_per_share = new_price_b;

        let stock_c = vector::borrow_mut(&mut stock_market.stocks, 2);
        stock_c.price_per_share = new_price_c;
    }

    public entry fun buy_stock(
        account: &signer,
        stock_index: u64,
        amount_in_usd: u128
    ) acquires StockMarket {
        let buyer_address = signer::address_of(account);
        let stock_market = borrow_global_mut<StockMarket>(COMPANY_WALLET);
        let stock = vector::borrow_mut(&mut stock_market.stocks, stock_index);

        let shares_to_buy = (amount_in_usd * 1_000_000) / stock.price_per_share;
        assert!((shares_to_buy as u64) <= stock.available_shares, E_INSUFFICIENT_SHARES);

        stock.available_shares = stock.available_shares - (shares_to_buy as u64);
        coin::transfer<AptosCoin>(account, COMPANY_WALLET, (amount_in_usd as u64));
        s_user_portfolio::add_to_portfolio(account, stock.symbol, shares_to_buy);

        event::emit_event(
            &mut stock_market.stock_events,
            StockUpdatedEvent {
                symbol: stock.symbol,
                new_price: stock.price_per_share,
                timestamp: timestamp::now_microseconds(),
            },
        );
    }

    public entry fun buy_stock_1(
        account: &signer,
        stock_index: u64,
        amount_in_usd: u128
    ) acquires StockMarket {
        let buyer_address = signer::address_of(account);
        let stock_market = borrow_global_mut<StockMarket>(COMPANY_WALLET);
        let stock = vector::borrow_mut(&mut stock_market.stocks, stock_index);

        let shares_to_buy = (amount_in_usd * 1_000_000) / stock.price_per_share;
        assert!((shares_to_buy as u64) <= stock.available_shares, E_INSUFFICIENT_SHARES);

        stock.available_shares = stock.available_shares - (shares_to_buy as u64);
        coin::transfer<AptosCoin>(account, COMPANY_WALLET, (amount_in_usd as u64));
        s_user_portfolio::add_to_portfolio(account, stock.symbol, shares_to_buy);

        event::emit_event(
            &mut stock_market.stock_events,
            StockUpdatedEvent {
                symbol: stock.symbol,
                new_price: stock.price_per_share,
                timestamp: timestamp::now_microseconds(),
            },
        );
    }

    public entry fun sell_stock(
        account: &signer,
        symbol: vector<u8>,
        shares: u128,
        recipient: address
    ) acquires StockMarket {
        let seller_address = signer::address_of(account);
        let stock_market = borrow_global_mut<StockMarket>(COMPANY_WALLET);
        let stock_found = false;
        let i = 0;
        let len = vector::length(&stock_market.stocks);

        while (i < len) {
            let stock = vector::borrow_mut(&mut stock_market.stocks, i);

            if (vectors_equal(&stock.symbol, &symbol)) {
                stock_found = true;

                assert!(stock.total_shares >= (shares as u64), E_INSUFFICIENT_SHARES);
                stock.available_shares = stock.available_shares + (shares as u64);

                coin::transfer<AptosCoin>(
                    account,
                    recipient,
                    shares as u64
                );

                s_user_portfolio::reduce_stock_in_portfolio(
                    recipient,
                    stock.symbol,
                    shares
                );

                s_user_portfolio::add_to_portfolio(account, stock.symbol, shares);

                event::emit_event(
                    &mut stock_market.stock_events,
                    StockUpdatedEvent {
                        symbol: stock.symbol,
                        new_price: stock.price_per_share,
                        timestamp: timestamp::now_microseconds(),
                    },
                );

                return;
            };
            i = i + 1;
        };

        assert!(stock_found, E_MARKET_NOT_INITIALIZED);
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

    public fun emit_debug_event(
        event_handle: &mut event::EventHandle<DebugEvent>,
        shares_to_buy: u64,
        available_shares: u64,
        amount_in_usd: u128,
        price_per_share: u128
    ) {
        event::emit_event(
            event_handle,
            DebugEvent {
                shares_to_buy,
                available_shares,
                amount_in_usd,
                price_per_share,
            },
        );
    }
}
