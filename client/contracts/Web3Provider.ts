import { ethers } from "ethers";
import { CHAIN_IDS, RPC_URLS } from "./config";

export interface WalletInfo {
  address: string;
  chainId: number;
  isConnected: boolean;
}

export class Web3Provider {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private walletInfo: WalletInfo | null = null;

  constructor() {
    this.setupProvider();
  }

  private setupProvider() {
    // For React Native, we'll use the injected provider from WalletConnect
    if (typeof window !== "undefined" && (window as any).ethereum) {
      this.provider = new ethers.BrowserProvider((window as any).ethereum);
    }
  }

  async connectWallet(): Promise<WalletInfo> {
    try {
      if (!this.provider) {
        throw new Error(
          "No Web3 provider found. Make sure your wallet is connected."
        );
      }

      const browserProvider = this.provider as ethers.BrowserProvider;

      // Request account access
      await browserProvider.send("eth_requestAccounts", []);

      // Get signer
      this.signer = await browserProvider.getSigner();

      // Get wallet info
      const address = await this.signer.getAddress();
      const network = await browserProvider.getNetwork();
      const chainId = Number(network.chainId);

      this.walletInfo = {
        address,
        chainId,
        isConnected: true,
      };

      return this.walletInfo;
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  }

  async switchNetwork(chainId: number): Promise<void> {
    try {
      if (!this.provider) {
        throw new Error("No provider available");
      }

      const browserProvider = this.provider as ethers.BrowserProvider;

      // Convert chainId to hex
      const chainIdHex = `0x${chainId.toString(16)}`;

      try {
        // Try to switch to the network
        await browserProvider.send("wallet_switchEthereumChain", [
          { chainId: chainIdHex },
        ]);
      } catch (switchError: any) {
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
          await this.addNetwork(chainId);
        } else {
          throw switchError;
        }
      }

      // Update wallet info
      if (this.walletInfo) {
        this.walletInfo.chainId = chainId;
      }
    } catch (error) {
      console.error("Error switching network:", error);
      throw error;
    }
  }

  private async addNetwork(chainId: number): Promise<void> {
    if (!this.provider) {
      throw new Error("No provider available");
    }

    const browserProvider = this.provider as ethers.BrowserProvider;
    const chainIdHex = `0x${chainId.toString(16)}`;
    const rpcUrl = RPC_URLS[chainId as keyof typeof RPC_URLS];

    if (!rpcUrl) {
      throw new Error(`No RPC URL configured for chain ${chainId}`);
    }

    const networkParams = {
      chainId: chainIdHex,
      chainName: this.getChainName(chainId),
      nativeCurrency: this.getNativeCurrency(chainId),
      rpcUrls: [rpcUrl],
      blockExplorerUrls: [this.getBlockExplorerUrl(chainId)],
    };

    await browserProvider.send("wallet_addEthereumChain", [networkParams]);
  }

  private getChainName(chainId: number): string {
    switch (chainId) {
      case CHAIN_IDS.ETHEREUM_SEPOLIA:
        return "Ethereum Sepolia";
      case CHAIN_IDS.BASE_SEPOLIA:
        return "Base Sepolia";
      case CHAIN_IDS.OPTIMISM_SEPOLIA:
        return "Optimism Sepolia";
      case CHAIN_IDS.ARBITRUM_SEPOLIA:
        return "Arbitrum Sepolia";
      case CHAIN_IDS.FLOW_TESTNET:
        return "Flow Testnet";
      default:
        return `Chain ${chainId}`;
    }
  }

  private getNativeCurrency(chainId: number) {
    switch (chainId) {
      case CHAIN_IDS.FLOW_TESTNET:
        return {
          name: "Flow",
          symbol: "FLOW",
          decimals: 18,
        };
      default:
        return {
          name: "Ether",
          symbol: "ETH",
          decimals: 18,
        };
    }
  }

  private getBlockExplorerUrl(chainId: number): string {
    switch (chainId) {
      case CHAIN_IDS.ETHEREUM_SEPOLIA:
        return "https://sepolia.etherscan.io";
      case CHAIN_IDS.BASE_SEPOLIA:
        return "https://sepolia.basescan.org";
      case CHAIN_IDS.OPTIMISM_SEPOLIA:
        return "https://sepolia-optimism.etherscan.io";
      case CHAIN_IDS.ARBITRUM_SEPOLIA:
        return "https://sepolia.arbiscan.io";
      case CHAIN_IDS.FLOW_TESTNET:
        return "https://evm-testnet.flowscan.org";
      default:
        return "";
    }
  }

  async getBalance(address?: string): Promise<string> {
    if (!this.provider) {
      throw new Error("No provider available");
    }

    const addr = address || this.walletInfo?.address;
    if (!addr) {
      throw new Error("No address provided");
    }

    const balance = await this.provider.getBalance(addr);
    return ethers.formatEther(balance);
  }

  async getTokenBalance(
    tokenAddress: string,
    address?: string
  ): Promise<string> {
    if (!this.provider || !this.signer) {
      throw new Error("Provider or signer not available");
    }

    const addr = address || this.walletInfo?.address;
    if (!addr) {
      throw new Error("No address provided");
    }

    // ERC20 contract ABI for balanceOf
    const erc20Abi = [
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)",
    ];

    const contract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);
    const [balance, decimals] = await Promise.all([
      contract.balanceOf(addr),
      contract.decimals(),
    ]);

    return ethers.formatUnits(balance, decimals);
  }

  // Create a provider for a specific chain (for reading data)
  createProviderForChain(chainId: number): ethers.Provider {
    const rpcUrl = RPC_URLS[chainId as keyof typeof RPC_URLS];
    if (!rpcUrl) {
      throw new Error(`No RPC URL configured for chain ${chainId}`);
    }
    return new ethers.JsonRpcProvider(rpcUrl);
  }

  // Getters
  getProvider(): ethers.Provider | null {
    return this.provider;
  }

  getSigner(): ethers.Signer | null {
    return this.signer;
  }

  getWalletInfo(): WalletInfo | null {
    return this.walletInfo;
  }

  isConnected(): boolean {
    return this.walletInfo?.isConnected || false;
  }

  getCurrentChainId(): number | null {
    return this.walletInfo?.chainId || null;
  }

  getCurrentAddress(): string | null {
    return this.walletInfo?.address || null;
  }

  // Disconnect wallet
  disconnect(): void {
    this.signer = null;
    this.walletInfo = null;
  }

  // Listen to account and chain changes
  setupEventListeners(callbacks: {
    onAccountsChanged?: (accounts: string[]) => void;
    onChainChanged?: (chainId: string) => void;
    onDisconnect?: () => void;
  }): void {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;

      if (callbacks.onAccountsChanged) {
        ethereum.on("accountsChanged", callbacks.onAccountsChanged);
      }

      if (callbacks.onChainChanged) {
        ethereum.on("chainChanged", callbacks.onChainChanged);
      }

      if (callbacks.onDisconnect) {
        ethereum.on("disconnect", callbacks.onDisconnect);
      }
    }
  }

  // Remove event listeners
  removeEventListeners(): void {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      ethereum.removeAllListeners();
    }
  }
}

// Singleton instance
export const web3Provider = new Web3Provider();
