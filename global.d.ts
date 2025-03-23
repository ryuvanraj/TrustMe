interface AptosWallet {
    connect: () => Promise<{ address: string; publicKey: string }>;
    disconnect: () => Promise<void>;
    // Add more methods/properties if needed
  }
  
  interface Window {
    aptos?: AptosWallet;
  }
  