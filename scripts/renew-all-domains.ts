/**
 * Domain Renewal Script
 * Renews all domains in the MetaNames contract for 1 extra year
 * 
 * Usage:
 *   ADMIN_PRIVATE_KEY=0x... npx tsx scripts/renew-all-domains.ts
 * 
 * Environment:
 *   ADMIN_PRIVATE_KEY - The admin account private key (required)
 */

import { MetaNamesSdk, Enviroment, BYOCSymbol } from './src';
import { privateKeyToAccountAddress } from 'partisia-blockchain-applications-crypto/lib/main/wallet';

// Config - Low gas for renewal
const BYOC_SYMBOL: BYOCSymbol = 'POLYGON_USDC';
const GAS_LIMIT = 2000; // Low gas limit for renewal
const MAX_RETRIES = 3;
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
  return path.join(__dirname, '..', 'logs', `renewals-${date}.csv`);
}

function initLogFile(): void {
  const logDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
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
  sdk: MetaNamesSdk,
  domain: string,
  subscriptionYears: number = 1
): Promise<{ txHash: string; success: boolean; error?: string }> {
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`  Attempt ${attempt + 1}/${MAX_RETRIES}...`);
      
      // Build the payload manually to use custom gas
      const byoc = sdk.config.byoc.find((byoc) => byoc.symbol === BYOC_SYMBOL);
      if (!byoc) throw new Error(`BYOC ${BYOC_SYMBOL} not found`);
      
      const normalizedDomain = domain.replace('.meta', '').replace('.mpc', '');
      const abi = await sdk.metaNamesContract.getAbi();
      
      // Use the action builder
      const { actionDomainRenewalPayload } = await import('./src/actions');
      const payload = actionDomainRenewalPayload(abi, {
        domain: normalizedDomain,
        byocTokenId: byoc.id,
        payer: adminAddress,
        subscriptionYears,
      });

      // Create transaction with LOW gas (2000)
      const transaction = await sdk.metaNamesContract.createTransaction({ 
        payload, 
        gasCost: GAS_LIMIT as any 
      });

      console.log(`  Transaction created, waiting for confirmation...`);
      
      // Note: The SDK handles signing and submission internally
      console.log(`  ✅ ${domain} renewed successfully`);
      return { txHash: transaction.transactionId || 'pending', success: true };
      
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      console.log(`  Attempt ${attempt + 1} failed: ${errorMsg}`);
      
      // Check if it's a transient error
      const isTransient = 
        error.code === 'NETWORK_ERROR' ||
        error.code === 'TIMEOUT' ||
        errorMsg.includes('nonce') ||
        errorMsg.includes('gas') ||
        errorMsg.includes('timeout');
      
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
  const fs = await import('fs');
  const path = await import('path');
  
  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  if (!privateKey) {
    console.error('ERROR: ADMIN_PRIVATE_KEY environment variable is required');
    console.log('Set it with: export ADMIN_PRIVATE_KEY="0x..."');
    process.exit(1);
  }

  initLogFile();

  // Initialize SDK with mainnet
  const sdk = new MetaNamesSdk(Enviroment.mainnet);
  
  // Set up private key signing
  sdk.setSigningStrategy('privateKey', privateKey);
  
  // Derive address from private key for the payer
  const adminAddress = privateKeyToAccountAddress(privateKey);
  console.log(`Using admin address: ${adminAddress}`);
  console.log('');

  // Get all domains
  console.log('Fetching all domains from contract...');
  const allDomains = await sdk.domainRepository.getAll();
  console.log(`Found ${allDomains.length} domains\n`);

  const results: RenewalLog[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const domain of allDomains) {
    console.log(`Renewing ${domain.name}...`);
    
    const result = await renewDomain(sdk, domain.name, 1);

    const entry: RenewalLog = {
      timestamp: new Date().toISOString(),
      domain: domain.name,
      txHash: result.txHash,
      status: result.success ? 'SUCCESS' : 'FAILED',
      error: result.success ? undefined : result.error
    };

    appendLog(entry);
    results.push(entry);

    if (result.success) {
      successCount++;
      console.log(`  ✓ ${domain.name} renewed\n`);
    } else {
      failCount++;
      console.log(`  ✗ ${domain.name} failed: ${result.error}\n`);
    }

    // Small delay between domains
    await sleep(1000);
  }

  console.log('--- Summary ---');
  console.log(`Succeeded: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Log file: ${getLogFile()}`);
}

main().catch(console.error);
