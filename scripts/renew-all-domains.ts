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

import { MetaNamesSdk, Enviroment, BYOCSymbol } from '../src';
import { privateKeyToAccountAddress } from 'partisia-blockchain-applications-crypto/lib/main/wallet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config();

// Config - Low gas for renewal
const BYOC_SYMBOL: BYOCSymbol = 'WMPC';
const BASE_GAS_LIMIT = 3080; // Base gas limit for renewal
const GAS_INCREASE_PERCENT = 10; // 20% gas increase on retry
const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 8000, 16000]; // Exponential backoff
const CONCURRENCY = 10;

// Progress tracking
const PROGRESS_FILE = path.join(__dirname, '..', 'logs', 'renewal-progress.json');
interface ProcessedDomains {
  success: string[];
  failed: { domain: string; error: string }[];
}

function loadProgress(): ProcessedDomains {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = fs.readFileSync(PROGRESS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading progress file:', e);
  }
  return { success: [], failed: [] };
}

function saveProgress(progress: ProcessedDomains): void {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

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
      // Calculate gas with 20% increase per retry attempt
      const gasMultiplier = 1 + (attempt * GAS_INCREASE_PERCENT / 100);
      const gasLimit = Math.floor(BASE_GAS_LIMIT * gasMultiplier);
      
      console.log(`  Attempt ${attempt + 1}/${MAX_RETRIES} (gas: ${gasLimit})...`);
      
      // Build the payload manually to use custom gas
      const byoc = sdk.config.byoc.find((byoc) => byoc.symbol === BYOC_SYMBOL);
      if (!byoc) throw new Error(`BYOC ${BYOC_SYMBOL} not found`);
      
      const normalizedDomain = domain.replace('.meta', '').replace('.mpc', '');
      const abi = await sdk.contract.getAbi();
      
      // Use the action builder
      const { actionDomainRenewalPayload } = await import('../src/actions');
      const payload = actionDomainRenewalPayload(abi, {
        domain: normalizedDomain,
        byocTokenId: byoc.id,
        payer: privateKeyToAccountAddress(sdk.secrets.privateKey),
        subscriptionYears,
      });

      // Create transaction with calculated gas limit
      const transaction = await sdk.contract.createTransaction({ 
        contractAddress: '025fa781d389d7c7caaf836e5e47abed6cefd2d928',
        payload, 
        gasCost: gasLimit as any 
      });

      // Return transaction info - caller will handle fetchResult
      return { 
        txHash: transaction.transactionHash, 
        success: true,
        transaction // Include transaction for result fetching
      };
      
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      console.log(`  Attempt ${attempt + 1} failed: ${errorMsg}`);
      
      if (attempt < MAX_RETRIES - 1) {
        console.log(`  Retrying in ${RETRY_DELAYS[attempt]}ms...`);
        await sleep(RETRY_DELAYS[attempt] || 0);
        continue;
      }
      
      return { txHash: '', success: false, error: errorMsg };
    }
  }
  
  return { txHash: '', success: false, error: 'Max retries exceeded' };
}

interface TransactionResult {
  txHash: string;
  success: boolean;
  error?: string;
  transaction?: any;
  domainName?: string;
  localIndex?: number;
}

async function fetchTransactionResult(transaction: any, domain: string): Promise<{ txHash: string; success: boolean; error?: string }> {
  console.log(`  Transaction created, waiting for confirmation...`);
  const result = await transaction.fetchResult;

  if (result.hasError) {
    console.log(`  Error: ${result.errorMessage}`);
    return { txHash: transaction.transactionHash, success: false, error: result.errorMessage };
  }

  console.log(`  ✅ ${domain} renewed successfully: ${transaction.transactionHash}`);
  return { txHash: transaction.transactionHash, success: !result.hasError };
}

async function main() {
  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  if (!privateKey) {
    console.error('ERROR: ADMIN_PRIVATE_KEY environment variable is required');
    console.log('Set it with: export ADMIN_PRIVATE_KEY="0x..."');
    process.exit(1);
  }

  initLogFile();

  // Load previous progress if exists
  const processedProgressBase = loadProgress();
  console.log(`Loaded previous progress: ${processedProgressBase.success.length} succeeded, ${processedProgressBase.failed.length} failed`);

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
  const allDomains = await sdk.domainRepository.getAll().then(domains => domains.slice(12));
  console.log(`Found ${allDomains.length} domains\n`);

  const results: RenewalLog[] = [];
  let successCount = 0;
  let failCount = 0;

  // Set up graceful shutdown handlers
  const shutdown = () => {
    console.log('\n⚠️ Shutting down... saving progress...');
    saveProgress(processedProgress);
    console.log(`Progress saved to: ${PROGRESS_FILE}`);
    process.exit(0);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Filter out already processed domains
  const processedProgress: ProcessedDomains = { success: [...processedProgressBase.success], failed: [...processedProgressBase.failed] };
  const processedDomainNames = new Set([
    ...processedProgress.success,
    ...processedProgress.failed.map(f => f.domain)
  ]);
  const domainsToProcess = allDomains.filter(d => !processedDomainNames.has(d.name));
  
  if (domainsToProcess.length < allDomains.length) {
    console.log(`Skipping ${allDomains.length - domainsToProcess.length} already processed domains\n`);
  }

  const totalDomains = domainsToProcess.length;
  const indexLock = { value: 0 };

  // Process domains in batches of CONCURRENCY
  for (let i = 0; i < domainsToProcess.length; i += CONCURRENCY) {
    const batch = domainsToProcess.slice(i, i + CONCURRENCY);
    
    // Step 1: Create all transactions sequentially (to avoid nonce conflicts)
    const txResults: TransactionResult[] = [];
    for (const domain of batch) {
      const localIndex = ++indexLock.value;
      console.log(`[${localIndex}/${totalDomains}] Creating transaction for ${domain.name}...`);
      
      const result = await renewDomain(sdk, domain.name, 1);
      txResults.push({ ...result, domainName: domain.name, localIndex });
      // Small delay between transaction submissions
      await sleep(1000);
    }
    
    // Step 2: Fetch results in parallel
    const fetchPromises: Promise<{ domain: any; result: TransactionResult; localIndex: number }>[] = [];
    
    for (const txResult of txResults) {
      const domain = batch.find(d => d.name === txResult.domainName);
      if (!domain) continue;
      
      if (txResult.transaction) {
        fetchPromises.push(
          fetchTransactionResult(txResult.transaction, domain.name).then(result => ({
            domain,
            result: { ...result },
            localIndex: txResult.localIndex
          }))
        );
      } else {
        // Already failed during creation
        fetchPromises.push(
          Promise.resolve({
            domain,
            result: { 
              txHash: txResult.txHash, 
              success: txResult.success, 
              error: txResult.error 
            },
            localIndex: txResult.localIndex
          })
        );
      }
    }
    
    const fetchResults = await Promise.all(fetchPromises);
    
    // Process results and save progress
    for (const { domain, result, localIndex } of fetchResults) {
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
        processedProgress.success.push(domain.name);
        successCount++;
        console.log(`  ✓ [${localIndex}/${totalDomains}] ${domain.name} renewed`);
      } else {
        processedProgress.failed.push({ domain: domain.name, error: result.error || 'Unknown error' });
        failCount++;
        console.log(`  ✗ [${localIndex}/${totalDomains}] ${domain.name} failed: ${result.error}`);
      }

      saveProgress(processedProgress);
    }
    
    // Small delay between batches
    await sleep(1000);
  }

  console.log('');
  console.log('--- Summary ---');
  console.log(`Succeeded: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Log file: ${getLogFile()}`);
  console.log(`Progress file: ${PROGRESS_FILE}`);
}

main().catch(console.error);
