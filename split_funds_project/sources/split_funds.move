module 0xb4c854f4b2c05d748afdde0777ff7a87aa114bf16a098fb131b516d03d0d1740::split_funds {
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;

    /// Entry function that splits the funds equally between two receivers.
    /// `amount` must be divisible by 2.
    public entry fun split_funds(
        account: &signer,
        receiver1: address,
        receiver2: address,
        amount: u64
    ) {
        // Ensure the sent amount is exactly 10 units (adjust if needed).
        //assert!(amount == 10, 1);

        // Check that the amount is divisible by 2.
        assert!(amount % 2 == 0, 2);
        let half = amount / 2;

        // Transfer half to receiver1.
        coin::transfer<AptosCoin>(account, receiver1, half);

        // Transfer half to receiver2.
        coin::transfer<AptosCoin>(account, receiver2, half);
    }
}
