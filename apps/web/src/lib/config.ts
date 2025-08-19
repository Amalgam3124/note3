// 0G Storage Configuration
// This file provides fallback configuration when environment variables are not set

export const OG_CONFIG = {
  // RPC endpoint for 0G blockchain
  RPC_URL: process.env.NEXT_PUBLIC_OG_ENDPOINT || 'https://evmrpc-testnet.0g.ai/',
  
  // Indexer endpoint for 0G Storage
  INDEXER_RPC: process.env.NEXT_PUBLIC_OG_INDEXER || 'https://indexer-storage-testnet-turbo.0g.ai',
  
  // Gateway URL for IPFS-like access
  GATEWAY: process.env.NEXT_PUBLIC_OG_GATEWAY || 'https://gateway.0g.ai/ipfs/',
  
  // Wallet Connect Project ID
  WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'your_wallet_connect_project_id_here'
};

// Validate configuration
export function validateOGConfig() {
  const warnings = [];
  
  if (!process.env.NEXT_PUBLIC_OG_ENDPOINT) {
    warnings.push('NEXT_PUBLIC_OG_ENDPOINT not set, using default testnet endpoint');
  }
  
  if (!process.env.NEXT_PUBLIC_OG_INDEXER) {
    warnings.push('NEXT_PUBLIC_OG_INDEXER not set, using default testnet indexer');
  }
  
  if (!process.env.NEXT_PUBLIC_OG_GATEWAY) {
    warnings.push('NEXT_PUBLIC_OG_GATEWAY not set, using default gateway');
  }
  
  if (!process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 
      process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID === 'your_wallet_connect_project_id_here') {
    warnings.push('NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID not set, wallet connection may not work');
  }
  
  if (warnings.length > 0) {
    console.warn('0G Storage Configuration Warnings:');
    warnings.forEach(warning => console.warn(`- ${warning}`));
    console.warn('Please check your .env.local file configuration');
  }
  
  return warnings.length === 0;
}
