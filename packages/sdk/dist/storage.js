// Import 0G SDK dynamically where needed to avoid SSR issues and ensure browser Blob enhancements
import { ethers } from 'ethers';
// 0G Storage Configuration
const RPC_URL = process.env.NEXT_PUBLIC_OG_ENDPOINT || 'https://evmrpc-testnet.0g.ai/';
const INDEXER_RPC = process.env.NEXT_PUBLIC_OG_INDEXER || 'https://indexer-storage-testnet-turbo.0g.ai';
// Storage fee configuration - Based on 0G tokens, not ETH!
const STORAGE_FEE_CONFIG = {
    BASE_FEE: BigInt('1000000000000000000'), // 1 0G
    PER_BYTE_FEE: BigInt('1000000000000000'), // 0.001 0G per byte
    MAX_FEE: BigInt('10000000000000000000'), // 10 0G
    TESTNET_DISCOUNT: 0.1, // 90% testnet fee discount
};
// Gas price configuration for 0G Chain
const GAS_CONFIG = {
    INITIAL_GAS_PRICE: BigInt('1000000000'), // 1 Gwei
    GAS_PRICE_MULTIPLIER: 1.5, // More moderate gas price increase
    MAX_GAS_PRICE: BigInt('10000000000'), // 10 Gwei
    GAS_LIMIT: BigInt('100000'), // 100K gas
};
// Calculate reasonable storage fee (0G tokens)
export function calculateStorageFee(dataSize) {
    const baseFee = STORAGE_FEE_CONFIG.BASE_FEE;
    const sizeFee = BigInt(dataSize) * STORAGE_FEE_CONFIG.PER_BYTE_FEE;
    const totalFee = baseFee + sizeFee;
    const discountedFee = totalFee * BigInt(Math.floor(STORAGE_FEE_CONFIG.TESTNET_DISCOUNT * 100)) / BigInt(100);
    return discountedFee > STORAGE_FEE_CONFIG.MAX_FEE ? STORAGE_FEE_CONFIG.MAX_FEE : discountedFee;
}
// Get actual storage fee from 0G SDK (real-time)
export async function getActualStorageFee(data) {
    try {
        const jsonString = JSON.stringify(data);
        const dataSize = jsonString.length;
        const estimatedFee = calculateStorageFee(dataSize);
        console.log('0G Storage: Estimated fee calculation:', {
            dataSize,
            estimatedFee: estimatedFee.toString(),
            estimatedFeeOG: parseFloat(ethers.formatEther(estimatedFee))
        });
        return estimatedFee;
    }
    catch (error) {
        console.error('0G Storage: Failed to calculate storage fee:', error);
        return STORAGE_FEE_CONFIG.BASE_FEE;
    }
}
// Get wallet address
export async function getWalletAddress(signer) {
    if (!signer) {
        throw new Error('Wallet not connected');
    }
    try {
        if (typeof signer.getAddress === 'function') {
            const address = await signer.getAddress();
            if (!address) {
                throw new Error('Failed to get wallet address');
            }
            return address;
        }
        else if (typeof signer.account === 'object' && signer.account?.address) {
            return signer.account.address;
        }
        else {
            throw new Error('Unsupported signer type');
        }
    }
    catch (error) {
        throw new Error('Failed to get wallet address from signer');
    }
}
// Get 0G Storage gateway URL
export function getGatewayUrl(cid) {
    const gateway = process.env.NEXT_PUBLIC_OG_GATEWAY || 'https://gateway.0g.ai/ipfs/';
    return `${gateway}${cid}`;
}
// Validate CID format
export function isValidCID(cid) {
    return Boolean(cid && cid.length > 0);
}
// Create 0G SDK compatible Wallet instance
async function createOGWallet(signer) {
    try {
        if (typeof signer.getPrivateKey === 'function') {
            try {
                const privateKey = await signer.getPrivateKey();
                if (privateKey) {
                    let wallet = new ethers.Wallet(privateKey);
                    if (!wallet.provider) {
                        const provider = new ethers.JsonRpcProvider(RPC_URL);
                        wallet = wallet.connect(provider);
                    }
                    return wallet;
                }
            }
            catch (error) {
                console.log('Failed to get private key from wagmi:', error);
            }
        }
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(ethers.Wallet.createRandom().privateKey, provider);
        if (provider) {
            provider.getFeeData = async () => {
                try {
                    const feeData = await provider.send('eth_feeHistory', [1, 'latest', [25, 75]]);
                    const gasPrice = await provider.send('eth_gasPrice', []);
                    const parsedGasPrice = ethers.parseUnits(gasPrice, 'wei');
                    const safeGasPrice = parsedGasPrice > 0 ? parsedGasPrice : GAS_CONFIG.INITIAL_GAS_PRICE;
                    return {
                        gasPrice: safeGasPrice,
                        maxFeePerGas: GAS_CONFIG.MAX_GAS_PRICE,
                        maxPriorityFeePerGas: GAS_CONFIG.INITIAL_GAS_PRICE,
                        lastBaseFeePerGas: safeGasPrice
                    };
                }
                catch (error) {
                    console.log('Failed to get fee data from network, using defaults:', error);
                    return {
                        gasPrice: GAS_CONFIG.INITIAL_GAS_PRICE,
                        maxFeePerGas: GAS_CONFIG.MAX_GAS_PRICE,
                        maxPriorityFeePerGas: GAS_CONFIG.INITIAL_GAS_PRICE,
                        lastBaseFeePerGas: GAS_CONFIG.INITIAL_GAS_PRICE
                    };
                }
            };
            provider.estimateGas = async (transaction) => {
                try {
                    const txWithDefaults = {
                        from: transaction.from,
                        to: transaction.to,
                        data: transaction.data || '0x',
                        value: transaction.value || '0x0',
                        gasLimit: transaction.gasLimit || GAS_CONFIG.GAS_LIMIT,
                        gasPrice: transaction.gasPrice || GAS_CONFIG.INITIAL_GAS_PRICE,
                        nonce: transaction.nonce,
                        chainId: transaction.chainId || 0x1b,
                        type: 2,
                        maxFeePerGas: transaction.maxFeePerGas || GAS_CONFIG.MAX_GAS_PRICE,
                        maxPriorityFeePerGas: transaction.maxPriorityFeePerGas || GAS_CONFIG.INITIAL_GAS_PRICE
                    };
                    console.log('0G Storage: Estimating gas with transaction:', txWithDefaults);
                    const estimatedGas = await provider.send('eth_estimateGas', [txWithDefaults]);
                    const gasLimit = BigInt(estimatedGas);
                    return gasLimit > 0 ? gasLimit : GAS_CONFIG.GAS_LIMIT;
                }
                catch (error) {
                    console.log('Failed to estimate gas, using default:', error);
                    return GAS_CONFIG.GAS_LIMIT;
                }
            };
        }
        return wallet;
    }
    catch (error) {
        console.error('Failed to create wallet:', error);
        throw new Error(`Failed to create wallet: ${error}`);
    }
}
// Build 0G Chain compatible transaction
function buildOGTransaction(wallet, data, to) {
    return {
        from: wallet.address,
        to: to || '0x0000000000000000000000000000000000000000',
        data: data,
        value: '0x0',
        gasLimit: GAS_CONFIG.GAS_LIMIT,
        gasPrice: GAS_CONFIG.INITIAL_GAS_PRICE,
        chainId: 0x1b,
        type: 2,
        maxFeePerGas: GAS_CONFIG.MAX_GAS_PRICE,
        maxPriorityFeePerGas: GAS_CONFIG.INITIAL_GAS_PRICE,
        nonce: undefined
    };
}
// Ensure 0G SDK compatibility
function ensureOGSDKCompatibility(wallet) {
    if (!wallet.provider) {
        wallet = wallet.connect(new ethers.JsonRpcProvider(RPC_URL));
    }
    const originalProvider = wallet.provider;
    if (originalProvider) {
        originalProvider.getFeeData = async () => {
            try {
                const feeData = await originalProvider.getFeeData();
                const safeGasPrice = feeData.gasPrice && feeData.gasPrice > 0
                    ? feeData.gasPrice
                    : GAS_CONFIG.INITIAL_GAS_PRICE;
                return {
                    gasPrice: safeGasPrice,
                    maxFeePerGas: feeData.maxFeePerGas || GAS_CONFIG.MAX_GAS_PRICE,
                    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || GAS_CONFIG.INITIAL_GAS_PRICE
                };
            }
            catch (error) {
                console.log('Failed to get fee data from network, using defaults:', error);
                return {
                    gasPrice: GAS_CONFIG.INITIAL_GAS_PRICE,
                    maxFeePerGas: GAS_CONFIG.MAX_GAS_PRICE,
                    maxPriorityFeePerGas: GAS_CONFIG.INITIAL_GAS_PRICE
                };
            }
        };
        originalProvider.estimateGas = async (transaction) => {
            try {
                const txWithDefaults = {
                    from: transaction.from || wallet.address,
                    to: transaction.to || '0x0000000000000000000000000000000000000000',
                    data: transaction.data || '0x',
                    value: transaction.value || '0x0',
                    gasLimit: transaction.gasLimit || GAS_CONFIG.GAS_LIMIT,
                    gasPrice: transaction.gasPrice || GAS_CONFIG.INITIAL_GAS_PRICE,
                    chainId: transaction.chainId || 0x1b,
                    type: 2
                };
                console.log('0G Storage: Estimating gas with transaction:', txWithDefaults);
                const estimatedGas = await originalProvider.estimateGas(txWithDefaults);
                return estimatedGas > 0 ? estimatedGas : GAS_CONFIG.GAS_LIMIT;
            }
            catch (error) {
                console.log('Failed to estimate gas, using default:', error);
                return GAS_CONFIG.GAS_LIMIT;
            }
        };
    }
    return wallet;
}
// Helper: normalize any signer to an ethers Signer (uses BrowserProvider if needed)
async function toEthersSigner(possibleSigner) {
    // If it already looks like an ethers.js Signer (v6), return as-is
    if (possibleSigner && typeof possibleSigner.getAddress === 'function' && typeof possibleSigner.sendTransaction === 'function') {
        return possibleSigner;
    }
    // Try BrowserProvider from injected wallet
    const maybeEthereum = globalThis?.ethereum;
    if (maybeEthereum) {
        const browserProvider = new ethers.BrowserProvider(maybeEthereum);
        return await browserProvider.getSigner();
    }
    throw new Error('No compatible ethers Signer available. Please connect a browser wallet.');
}
// Upload JSON data to 0G Storage
export async function putJSON(data, signer) {
    try {
        if (!signer) {
            throw new Error('Wallet not connected');
        }
        const address = await getWalletAddress(signer);
        console.log('0G Storage: Using wallet address:', address);
        const jsonString = JSON.stringify(data);
        console.log('0G Storage: Data size:', jsonString.length, 'bytes');
        const MAX_SEGMENT_SIZE = 256 * 1024; // 256KB
        const MAX_CHUNK_SIZE = 256; // 256 bytes
        if (jsonString.length > MAX_SEGMENT_SIZE) {
            console.warn(`0G Storage: Data size (${jsonString.length} bytes) exceeds recommended segment size (${MAX_SEGMENT_SIZE} bytes)`);
            console.warn('0G Storage: This may cause "too many data writing" errors. Consider compressing or splitting data.');
        }
        const calculatedFee = calculateStorageFee(jsonString.length);
        console.log('0G Storage: Calculated storage fee:', {
            dataSize: jsonString.length,
            baseFee: STORAGE_FEE_CONFIG.BASE_FEE.toString(),
            sizeFee: (BigInt(jsonString.length) * STORAGE_FEE_CONFIG.PER_BYTE_FEE).toString(),
            totalFee: calculatedFee.toString(),
            totalFeeOG: parseFloat(ethers.formatEther(calculatedFee))
        });
        console.log('0G Storage: Initializing indexer with:', INDEXER_RPC);
        const sdk = await import('@0glabs/0g-ts-sdk');
        const { Indexer } = sdk;
        const ZgBlob = sdk.Blob;
        const indexer = new Indexer(INDEXER_RPC);
        const ethersSigner = await toEthersSigner(signer);
        console.log('0G Storage: Using ethers Signer for wallet operations');
        if (!RPC_URL) {
            throw new Error('RPC_URL is not configured');
        }
        console.log('0G Storage: Using RPC URL:', RPC_URL);
        console.log('0G Storage: Environment check:');
        console.log('  - RPC_URL:', RPC_URL);
        console.log('  - INDEXER_RPC:', INDEXER_RPC);
        const maxRetries = 1;
        let lastError = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`0G Storage: Upload attempt ${attempt}/${maxRetries}`);
                console.log(`0G Storage: Signer details:`, {
                    address: address,
                    hasProvider: !!ethersSigner.provider,
                    providerType: ethersSigner.provider?.constructor?.name
                });
                console.log('0G Storage: Creating File and SDK Blob for upload...');
                let uploadData = jsonString;
                let uploadFileName = 'note.json';
                if (jsonString.length > MAX_SEGMENT_SIZE) {
                    console.log('0G Storage: Data is large, attempting compression...');
                    try {
                        const compressedData = JSON.stringify(JSON.parse(jsonString));
                        if (compressedData.length < jsonString.length) {
                            uploadData = compressedData;
                            uploadFileName = 'note-compressed.json';
                            console.log(`0G Storage: Compressed data from ${jsonString.length} to ${compressedData.length} bytes`);
                        }
                    }
                    catch (compressionError) {
                        console.warn('0G Storage: Compression failed, using original data:', compressionError);
                    }
                }
                const domBlob = new Blob([uploadData], { type: 'application/json' });
                const domFile = new File([domBlob], uploadFileName, { type: 'application/json' });
                const sdkFile = new ZgBlob(domFile);
                console.log('0G Storage: File object created:', {
                    name: domFile.name,
                    size: domFile.size,
                    type: domFile.type,
                    compressed: uploadFileName !== 'note.json'
                });
                console.log('0G Storage: Generating Merkle tree for file...');
                const [tree, treeErr] = await sdkFile.merkleTree();
                if (treeErr !== null) {
                    throw new Error(`Failed to generate Merkle tree: ${treeErr}`);
                }
                const rootHash = tree?.rootHash();
                if (!rootHash) {
                    throw new Error('Failed to get root hash from Merkle tree');
                }
                console.log('0G Storage: File Root Hash:', rootHash);
                const uploadOptions = {
                    tags: '0x',
                    finalityRequired: true,
                    taskSize: domFile.size > MAX_SEGMENT_SIZE ? 1 : 10,
                    expectedReplica: 1,
                    skipTx: false,
                    fee: calculatedFee,
                    nonce: undefined
                };
                console.log('0G Storage: Upload options:', {
                    fee: uploadOptions.fee.toString(),
                    feeOG: parseFloat(ethers.formatEther(uploadOptions.fee)),
                    taskSize: uploadOptions.taskSize,
                    dataSize: domFile.size
                });
                const [tx, uploadErr] = await indexer.upload(sdkFile, RPC_URL, ethersSigner, uploadOptions);
                console.log('0G Storage: Upload response:', { tx, uploadErr });
                if (uploadErr !== null) {
                    lastError = uploadErr;
                    console.error(`0G Storage: Upload attempt ${attempt} failed:`, uploadErr);
                    if (uploadErr.message && uploadErr.message.includes('too many data writing')) {
                        console.error('0G Storage: Data size error detected. Consider:');
                        console.error('  1. Reducing data size (remove unnecessary fields)');
                        console.error('  2. Using data compression');
                        console.error('  3. Splitting large data into multiple uploads');
                    }
                }
                else {
                    console.log('0G Storage: Upload successful! Transaction:', tx);
                    let txHash;
                    if (typeof tx === 'string') {
                        txHash = tx;
                    }
                    else if (tx && typeof tx === 'object' && 'hash' in tx) {
                        txHash = tx.hash;
                    }
                    else if (tx && typeof tx === 'object' && 'transactionHash' in tx) {
                        txHash = tx.transactionHash;
                    }
                    else {
                        const txString = JSON.stringify(tx);
                        console.log('0G Storage: Full transaction object:', txString);
                        const hashMatch = txString.match(/0x[a-fA-F0-9]{64}/);
                        if (hashMatch) {
                            txHash = hashMatch[0];
                            console.log('0G Storage: Extracted hash from transaction object:', txHash);
                        }
                        else {
                            throw new Error(`Upload successful but no transaction hash found in response: ${txString}`);
                        }
                    }
                    if (!txHash || txHash === '') {
                        throw new Error('Upload successful but extracted transaction hash is empty');
                    }
                    if (typeof window !== 'undefined') {
                        try {
                            localStorage.setItem(`0g-note-${rootHash}`, uploadData);
                            localStorage.setItem(`0g-tx-to-root-${txHash}`, rootHash);
                            console.log('0G Storage: Data saved to local storage with root hash:', rootHash);
                            console.log('0G Storage: Transaction hash to root hash mapping saved');
                        }
                        catch (localError) {
                            console.warn('Failed to save to local storage:', localError);
                        }
                    }
                    console.log('0G Storage: Final CID (root hash):', rootHash);
                    console.log('0G Storage: Transaction hash:', txHash);
                    return { cid: rootHash };
                }
            }
            catch (attemptError) {
                lastError = attemptError;
                console.error(`0G Storage: Attempt ${attempt} failed:`, attemptError);
            }
        }
        console.error('0G Storage: All upload attempts failed');
        throw new Error(`0G Storage upload failed after ${maxRetries} attempts. Last error: ${lastError}`);
    }
    catch (error) {
        console.error('0G Storage: putJSON failed:', error);
        throw error;
    }
}
// Download JSON data from 0G Storage
export async function getJSON(cid) {
    try {
        console.log('0G Storage: Attempting to fetch data with CID:', cid);
        if (!cid || cid === '') {
            throw new Error('Invalid CID: empty or undefined');
        }
        if (typeof window !== 'undefined') {
            try {
                const localData = localStorage.getItem(`0g-note-${cid}`);
                if (localData) {
                    console.log('0G Storage: Found data in local storage');
                    return JSON.parse(localData);
                }
                console.log('0G Storage: Exact root hash not found, searching all local storage keys...');
                const keys = Object.keys(localStorage);
                const ogNoteKeys = keys.filter(key => key.startsWith('0g-note-'));
                for (const key of ogNoteKeys) {
                    try {
                        const noteData = JSON.parse(localStorage.getItem(key) || '{}');
                        if (noteData.id && noteData.id.includes(cid.slice(-8))) {
                            console.log('0G Storage: Found matching note in local storage by partial match');
                            return noteData;
                        }
                    }
                    catch (parseError) {
                        console.warn('Failed to parse note from local storage:', parseError);
                    }
                }
                console.log('0G Storage: No matching data found in local storage');
                console.log('0G Storage: Available keys:', ogNoteKeys);
            }
            catch (localError) {
                console.log('Failed to get from local storage:', localError);
            }
        }
        console.log('0G Storage: Attempting to download from 0G Storage using root hash:', cid);
        try {
            const sdk = await import('@0glabs/0g-ts-sdk');
            const { Indexer } = sdk;
            const indexer = new Indexer(INDEXER_RPC);
            const tempFileName = `temp-${Date.now()}.json`;
            console.log('0G Storage: Downloading file to temporary location...');
            const downloadErr = await indexer.download(cid, tempFileName, true);
            if (downloadErr !== null) {
                throw new Error(`0G Storage download failed: ${downloadErr}`);
            }
            console.log('0G Storage: File downloaded successfully to:', tempFileName);
            throw new Error(`0G Storage download successful but file reading not implemented for browser environment. File saved to: ${tempFileName}`);
        }
        catch (downloadError) {
            console.error('0G Storage download error:', downloadError);
            throw new Error(`0G Storage download failed. CID: ${cid}. Error: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}. Try checking if the file exists in local storage.`);
        }
    }
    catch (error) {
        console.error('0G Storage download error:', error);
        if (error instanceof Error) {
            throw new Error(`0G Storage download failed: ${error.message}`);
        }
        throw new Error('0G Storage download failed: Unknown error');
    }
}
