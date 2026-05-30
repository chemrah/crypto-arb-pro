import { ethers } from 'ethers';

export const SUPPORTED_CHAINS: Record<string, { chainId: number; name: string; icon: string; color: string; explorer: string; testnetChainId?: number }> = {
  ARBITRUM: { chainId: 42161, name: 'Arbitrum One', icon: '🔵', color: '#28A0F0', explorer: 'https://arbiscan.io', testnetChainId: 421614 },
  ARBITRUM_SEPOLIA: { chainId: 421614, name: 'Arbitrum Sepolia', icon: '🔵', color: '#28A0F0', explorer: 'https://sepolia.arbiscan.io' },
  ETHEREUM: { chainId: 1, name: 'Ethereum', icon: '💎', color: '#627EEA', explorer: 'https://etherscan.io', testnetChainId: 11155111 },
  BASE: { chainId: 8453, name: 'Base', icon: '🔷', color: '#0052FF', explorer: 'https://basescan.org', testnetChainId: 84532 },
  OPTIMISM: { chainId: 10, name: 'Optimism', icon: '🔴', color: '#FF0420', explorer: 'https://optimistic.etherscan.io' },
  POLYGON: { chainId: 137, name: 'Polygon', icon: '🟣', color: '#8247E5', explorer: 'https://polygonscan.com' },
  BSC: { chainId: 56, name: 'BNB Chain', icon: '🟡', color: '#F0B90B', explorer: 'https://bscscan.com' },
};

const CHAIN_PARAMS: Record<number, { chainId: string; chainName: string; rpcUrls: string[]; nativeCurrency: { name: string; symbol: string; decimals: number }; blockExplorerUrls: string[] }> = {
  42161: {
    chainId: '0xa4b1',
    chainName: 'Arbitrum One',
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://arbiscan.io'],
  },
  421614: {
    chainId: '0x66eee',
    chainName: 'Arbitrum Sepolia',
    rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://sepolia.arbiscan.io'],
  },
  1: {
    chainId: '0x1',
    chainName: 'Ethereum',
    rpcUrls: ['https://eth.llamarpc.com'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://etherscan.io'],
  },
  8453: {
    chainId: '0x2105',
    chainName: 'Base',
    rpcUrls: ['https://mainnet.base.org'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://basescan.org'],
  },
  10: {
    chainId: '0xa',
    chainName: 'Optimism',
    rpcUrls: ['https://mainnet.optimism.io'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
  },
  137: {
    chainId: '0x89',
    chainName: 'Polygon',
    rpcUrls: ['https://polygon-rpc.com'],
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    blockExplorerUrls: ['https://polygonscan.com'],
  },
  56: {
    chainId: '0x38',
    chainName: 'BNB Smart Chain',
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    blockExplorerUrls: ['https://bscscan.com'],
  },
};

export function getChainName(chainId: number): string {
  const chain = Object.values(SUPPORTED_CHAINS).find((c) => c.chainId === chainId);
  return chain?.name || `Chain ${chainId}`;
}

export function getExplorerUrl(chainId: number): string {
  const chain = Object.values(SUPPORTED_CHAINS).find((c) => c.chainId === chainId);
  return chain?.explorer || 'https://arbiscan.io';
}

export function getTxUrl(chainId: number, txHash: string): string {
  return `${getExplorerUrl(chainId)}/tx/${txHash}`;
}

export async function connectWallet(): Promise<{
  address: string;
  signer: ethers.JsonRpcSigner;
  provider: ethers.BrowserProvider;
  chainId: number;
  balance: string;
}> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('MetaMask غير مثبت. يرجى تثبيت MetaMask أولاً.');
  }

  const ethereum = (window as any).ethereum;

  try {
    // Request accounts
    await ethereum.request({ method: 'eth_requestAccounts' });

    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    const balanceWei = await provider.getBalance(address);
    const balance = ethers.formatEther(balanceWei);

    // Listen for account/chain changes
    ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        window.location.reload();
      } else {
        window.location.reload();
      }
    });

    ethereum.on('chainChanged', () => {
      window.location.reload();
    });

    return { address, signer, provider, chainId, balance };
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('تم رفض الاتصال من قبل المستخدم');
    }
    throw new Error(`خطأ في الاتصال: ${error.message}`);
  }
}

export async function disconnectWallet(): Promise<void> {
  const ethereum = (window as any).ethereum;
  if (ethereum) {
    ethereum.removeAllListeners?.('accountsChanged');
    ethereum.removeAllListeners?.('chainChanged');
  }
}

export async function switchChain(chainId: number): Promise<void> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('MetaMask غير مثبت');
  }

  const ethereum = (window as any).ethereum;
  const hexChainId = '0x' + chainId.toString(16);

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
  } catch (error: any) {
    // Chain not added, try to add it
    if (error.code === 4902) {
      const params = CHAIN_PARAMS[chainId];
      if (!params) throw new Error(`Chain ${chainId} غير مدعوم`);

      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [params],
      });
    } else {
      throw error;
    }
  }
}

export async function getWalletBalance(provider: ethers.BrowserProvider, address: string): Promise<string> {
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}
