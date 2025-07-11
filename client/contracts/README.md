# IntentFi Contract Integration

This directory contains all the smart contract integration code for the IntentFi React Native application.

## 📁 Structure

```
contracts/
├── abi/                    # Contract ABI files
├── types/                  # Generated TypeScript types (auto-generated)
├── config.ts              # Chain and contract configurations
├── ContractService.ts      # Main contract interaction service
├── Web3Provider.ts         # Web3 provider and wallet management
└── index.ts               # Main exports

hooks/
└── useContracts.ts         # React hook for easy contract usage

components/
└── ContractExample.tsx     # Example component showing usage
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install ethers typechain @typechain/ethers-v6
```

### 2. Generate TypeScript Types

After updating contract ABIs:

```bash
npm run typechain
```

### 3. Configure Contract Addresses

Update `contracts/config.ts` with your deployed contract addresses:

```typescript
export const CONTRACTS = {
  [CHAIN_IDS.ETHEREUM_SEPOLIA]: {
    INTENTFI: "0xYourContractAddress",
    INTENTFI_CCIP: "0xYourCCIPContractAddress",
    // ... other contracts
  },
  // ... other chains
};
```

### 4. Use in Your Components

```typescript
import { useContracts } from '../hooks/useContracts';

export default function MyComponent() {
  const {
    isConnected,
    connectWallet,
    createIntent,
    intents,
    currentPrice,
  } = useContracts();

  const handleCreateIntent = async () => {
    try {
      await createIntent({
        type: 'swap',
        amount: '0.1',
        fromToken: 'ETH',
        toToken: 'USDC',
        fromChain: 11155111, // Sepolia
        triggerPrice: '2000',
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    // Your UI components
  );
}
```

## 🔧 Core Services

### ContractService

The main service for interacting with smart contracts:

```typescript
import { ContractService } from "./contracts/ContractService";

// Create service instance
const service = new ContractService(provider, signer, chainId);

// Create an intent
const txHash = await service.createIntent({
  type: "bridge",
  amount: "1.0",
  fromToken: "ETH",
  fromChain: 11155111,
  toChain: 84532,
  receiverAddress: "0x...",
});

// Get user intents
const intents = await service.getUserIntents(userAddress);

// Cancel an intent
await service.cancelIntent(intentId);
```

### Web3Provider

Manages wallet connections and network switching:

```typescript
import { web3Provider } from "./contracts/Web3Provider";

// Connect wallet
const walletInfo = await web3Provider.connectWallet();

// Switch network
await web3Provider.switchNetwork(CHAIN_IDS.BASE_SEPOLIA);

// Get balance
const balance = await web3Provider.getBalance();
```

### useContracts Hook

React hook that combines everything for easy use:

```typescript
const {
  // Wallet state
  walletInfo,
  isConnecting,
  isConnected,

  // Contract state
  intents,
  currentPrice,
  isLoading,
  error,

  // Actions
  connectWallet,
  createIntent,
  cancelIntent,
  switchNetwork,
} = useContracts();
```

## 📋 Intent Parameters

### Creating Intents

```typescript
interface IntentParams {
  type: "swap" | "bridge" | "advanced";
  triggerPrice?: string; // Optional trigger price in USD
  amount: string; // Amount in token units
  fromToken: string; // Token symbol (e.g., 'ETH')
  toToken?: string; // For swaps
  fromChain: number; // Source chain ID
  toChain?: number; // For bridges
  receiverAddress?: string; // For bridges (defaults to user address)
}
```

### Intent Types

- **Swap**: Exchange one token for another on the same chain
- **Bridge**: Transfer tokens across different chains
- **Advanced**: Complex operations with custom logic

## 🌐 Supported Networks

- **Ethereum Sepolia** (Chain ID: 11155111)
- **Base Sepolia** (Chain ID: 84532)
- **Optimism Sepolia** (Chain ID: 11155420)
- **Arbitrum Sepolia** (Chain ID: 421614)
- **Flow Testnet** (Chain ID: 545)

## 📡 Events

The system listens to smart contract events:

- **IntentCreated**: When a new intent is created
- **IntentExecuted**: When an intent is automatically executed
- **CrossChainMessageSent**: When a cross-chain message is sent via CCIP

## 🔄 Process Flow

### User Creates Intent

1. User fills out intent form in UI
2. Frontend calls `createIntent()` with parameters
3. ContractService converts parameters and calls smart contract
4. Intent is stored on-chain with unique ID
5. Chainlink Automation begins monitoring

### Automatic Execution

1. Chainlink `checkUpkeep()` continuously monitors conditions
2. When trigger conditions are met, `performUpkeep()` is called
3. Intent is executed automatically
4. For cross-chain operations, CCIP sends message to destination
5. Frontend receives event and updates UI

### Event Flow

```
User Action → Smart Contract → Chainlink Automation → CCIP → Destination Chain
     ↓              ↓                    ↓             ↓            ↓
  Frontend ← Event Listener ← Event Emission ← Cross-chain ← Execution
```

## 🛠️ Development

### Adding New Contract Functions

1. Update contract ABI in `contracts/abi/`
2. Run `npm run typechain` to regenerate types
3. Add methods to `ContractService.ts`
4. Update React hook if needed

### Adding New Networks

1. Add chain ID to `CHAIN_IDS` in `config.ts`
2. Add RPC URL to `RPC_URLS`
3. Add contract addresses to `CONTRACTS`
4. Add chain selector for CCIP operations

### Testing

```typescript
// Example test setup
import { ContractService } from "./contracts/ContractService";

const mockProvider = new ethers.JsonRpcProvider("http://localhost:8545");
const mockSigner = new ethers.Wallet("0x...", mockProvider);
const service = new ContractService(mockProvider, mockSigner, 11155111);

// Test intent creation
const txHash = await service.createIntent({
  type: "swap",
  amount: "0.1",
  fromToken: "ETH",
  toToken: "USDC",
  fromChain: 11155111,
});
```

## 🔐 Security Considerations

- Always validate user inputs before sending to contracts
- Use proper error handling for all contract calls
- Verify network and contract addresses
- Handle gas estimation and transaction failures gracefully
- Never store private keys in the application

## 📝 TODO

- [ ] Add transaction status monitoring
- [ ] Implement retry logic for failed transactions
- [ ] Add support for EIP-1559 gas pricing
- [ ] Create more comprehensive error handling
- [ ] Add unit tests for contract interactions
- [ ] Implement batched operations for multiple intents

## 🆘 Troubleshooting

### Common Issues

1. **"Contract not deployed"**: Update contract addresses in `config.ts`
2. **"Unsupported network"**: Add network configuration
3. **"Transaction reverted"**: Check gas limits and contract state
4. **"Provider not found"**: Ensure wallet is connected

### Debug Mode

Enable debug logging:

```typescript
// Add to your component
useEffect(() => {
  console.log("Contract Service:", contractService);
  console.log("Wallet Info:", walletInfo);
  console.log("Current Intents:", intents);
}, [contractService, walletInfo, intents]);
```
