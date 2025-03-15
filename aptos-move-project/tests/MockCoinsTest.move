module 0xd54742c71e03305c78e8c31e29d2b4d049f0ca570607ffd86dfa8dff7414a990::MockCoinsTest {
    use 0xd54742c71e03305c78e8c31e29d2b4d049f0ca570607ffd86dfa8dff7414a990::MockCoins;
    use aptos_framework::account;
    use aptos_framework::signer;
    use std::vector;

    #[test]
    public fun test_initialize_and_retrieve_market() {
        // Use the `create_signer_for_testing` function to create a test signer
        let test_signer = account::create_signer_for_testing();

        // Initialize the MockCoins market
        MockCoins::initialize(&test_signer);

        // Retrieve the market
        let market = MockCoins::get_market(signer::address_of(&test_signer));

        // Assert market data
        assert!(vector::length(&market.coins) == 3, 1);
        let btc = vector::borrow(&market.coins, 0);
        assert!(btc.symbol == b"BTC", 2);
        assert!(btc.fixed_cap == 21000000, 3);
    }
}