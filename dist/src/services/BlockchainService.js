import { ethers } from 'ethers';
import { config } from '../config';
import { AppError } from '../utils/ErrorHandler';
export function hashContent(content) {
    return ethers.keccak256(ethers.toUtf8Bytes(content));
}
export async function timestampReport(content) {
    if (!config.ethPrivateKey || !config.ethRpcUrl) {
        throw new AppError('Blockchain configuration missing', 500);
    }
    try {
        const provider = new ethers.JsonRpcProvider(config.ethRpcUrl);
        const wallet = new ethers.Wallet(config.ethPrivateKey, provider);
        const contentHash = hashContent(content);
        const tx = await wallet.sendTransaction({
            to: wallet.address,
            value: 0,
            data: contentHash,
        });
        console.log(`📦 Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        if (!receipt) {
            throw new AppError('Transaction failed - no receipt', 500);
        }
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
        const block = await provider.getBlock(receipt.blockNumber);
        const timestamp = block?.timestamp || Math.floor(Date.now() / 1000);
        return {
            contentHash,
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
            timestamp,
        };
    }
    catch (error) {
        if (error instanceof AppError)
            throw error;
        console.error('Blockchain error:', error);
        throw new AppError('Failed to timestamp on blockchain', 500);
    }
}
export async function verifyTimestamp(txHash) {
    try {
        const provider = new ethers.JsonRpcProvider(config.ethRpcUrl);
        const tx = await provider.getTransaction(txHash);
        if (!tx) {
            return { verified: false, contentHash: null, blockNumber: null };
        }
        return {
            verified: true,
            contentHash: tx.data,
            blockNumber: tx.blockNumber,
        };
    }
    catch (error) {
        console.error('Verification error:', error);
        return { verified: false, contentHash: null, blockNumber: null };
    }
}
//# sourceMappingURL=BlockchainService.js.map