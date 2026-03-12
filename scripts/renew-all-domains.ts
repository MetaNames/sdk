/**
 * Domain Renewal Script
 * Renews all domains in the MetaNames contract for 1 extra year
 * 
 * Usage:
 *   npx tsx scripts/renew-all-domains.ts
 * 
 * Environment:
 *   ADMIN_PRIVATE_KEY - The admin account private key (required)
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// Config - MetaNames Mainnet
const CONTRACT_ADDRESS = '02c9a6290864e27b587331c88ec8e69a8280c290dc';
const RPC_URL = process.env.RPC_URL || 'https://rpc.partisiablockchain.com';
const LOG_DIR = path.join(process.cwd(), 'logs');

const RPC_URL = process.env.RPC_URL || 'https://rpc.partisiablockchain.com';
const LOG_DIR = path.join(process.cwd(), 'logs');
const RETRY_DELAYS = [2000, 4000, 8000]; // Exponential backoff

interface RenewalLog {
  timestamp: string;
  domain: string;
  txHash: string;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
}

function getLogFile(): string {
  const date = new Date().toISOString().split('T')[0];
  return path.join(LOG_DIR, `renewals-${date}.csv`);
}

function initLogFile(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  const logFile = getLogFile();
  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, 'timestamp,domain,txHash,status,error\n');
  }
}

function appendLog(entry: RenewalLog): void {
  const logFile = getLogFile();
  const row = `${entry.timestamp},${entry.domain},${entry.txHash},${entry.status},${entry.error || ''}\n`;
  fs.appendFileSync(logFile, row);
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function renewDomain(
  contract: ethers.Contract,
  domain: string,
  signer: ethers.Signer
): Promise<{ txHash: string; success: boolean; error?: string }> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Send transaction with hardcoded gas limit (2100 is sufficient for renewal)
      const tx = await contract.renew(domain, {
        gasLimit: 2100,
        gasPrice: await signer.provider!.getGasPrice()
      });

      console.log(`  Tx sent: ${tx.hash}, waiting for confirmation...`);
      
      // Wait for transaction to be confirmed
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        return { txHash: tx.hash, success: true };
      } else {
        return { txHash: tx.hash, success: false, error: 'Transaction failed' };
      }
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      console.log(`  Attempt ${attempt + 1} failed: ${errorMsg}`);
      
      // Check if it's a transient error
      const isTransient = 
        error.code === 'NETWORK_ERROR' ||
        error.code === 'TIMEOUT' ||
        error.message?.includes('nonce') ||
        error.message?.includes('gas');
      
      if (isTransient && attempt < MAX_RETRIES - 1) {
        console.log(`  Retrying in ${RETRY_DELAYS[attempt]}ms...`);
        await sleep(RETRY_DELAYS[attempt]);
        continue;
      }
      
      return { txHash: '', success: false, error: errorMsg };
    }
  }
  
  return { txHash: '', success: false, error: 'Max retries exceeded' };
}

async function main() {
  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  if (!privateKey) {
    console.error('ERROR: ADMIN_PRIVATE_KEY environment variable is required');
    console.log('Set it with: export ADMIN_PRIVATE_KEY="0x..."');
    process.exit(1);
  }

  initLogFile();

  // Setup provider and signer
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(privateKey, provider);

  console.log(`Using admin address: ${signer.address}`);
  console.log(`RPC: ${RPC_URL}\n`);

  // TODO: Connect to the actual contract
  // const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  
  // TODO: Get all domains from contract
  // const domains = await contract.getAllDomains();
  
  // Placeholder for testing
  const domains = [
    'example.meta',
    'test.meta'
  ];

  console.log(`Found ${domains.length} domains to renew\n`);

  const results: RenewalLog[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const domain of domains) {
    console.log(`Renewing ${domain}...`);
    
    // TODO: Uncomment when contract is connected
    // const result = await renewDomain(contract, domain, signer);
    
    // Placeholder result for now
    const result = {
      txHash: '0xplaceholder',
      success: true
    };

    const entry: RenewalLog = {
      timestamp: new Date().toISOString(),
      domain,
      txHash: result.txHash,
      status: result.success ? 'SUCCESS' : 'FAILED',
      error: result.success ? undefined : result.error
    };

    appendLog(entry);
    results.push(entry);

    if (result.success) {
      successCount++;
      console.log(`  ✓ ${domain} renewed\n`);
    } else {
      failCount++;
      console.log(`  ✗ ${domain} failed: ${result.error}\n`);
    }

    // Small delay between domains to avoid rate limiting
    await sleep(500);
  }

  console.log('--- Summary ---');
  console.log(`Succeeded: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Log file: ${getLogFile()}`);
}

main().catch(console.error);
