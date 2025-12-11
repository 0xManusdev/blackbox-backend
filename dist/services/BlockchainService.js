"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashContent = hashContent;
exports.timestampReport = timestampReport;
exports.verifyTimestamp = verifyTimestamp;
const ethers_1 = require("ethers");
const config_1 = require("../config");
const ErrorHandler_1 = require("../utils/ErrorHandler");
// Create SHA256 hash of content
function hashContent(content) {
    return ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(content));
}
// Send timestamp transaction to Ethereum Sepolia
async function timestampReport(content) {
    if (!config_1.config.ethPrivateKey || !config_1.config.ethRpcUrl) {
        throw new ErrorHandler_1.AppError('Blockchain configuration missing', 500);
    }
    try {
        // Connect to Sepolia network
        const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.ethRpcUrl);
        const wallet = new ethers_1.ethers.Wallet(config_1.config.ethPrivateKey, provider);
        // Create content hash
        const contentHash = hashContent(content);
        // Send transaction with hash in data field
        const tx = await wallet.sendTransaction({
            to: wallet.address, // Self-transaction for timestamping
            value: 0,
            data: contentHash,
        });
        console.log(`📦 Transaction sent: ${tx.hash}`);
        // Wait for confirmation
        const receipt = await tx.wait();
        if (!receipt) {
            throw new ErrorHandler_1.AppError('Transaction failed - no receipt', 500);
        }
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
        // Get block timestamp
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
        if (error instanceof ErrorHandler_1.AppError)
            throw error;
        console.error('Blockchain error:', error);
        throw new ErrorHandler_1.AppError('Failed to timestamp on blockchain', 500);
    }
}
// Verify a report hash on chain
async function verifyTimestamp(txHash) {
    try {
        const provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.ethRpcUrl);
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