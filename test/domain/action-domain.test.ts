import { IActionDomainMint, IActionDomainRenewal, IActionDomainTransfer } from '../../src/interface'
import { config, generateRandomString, verifyTransactionResult } from '../helpers'

const domainName = `${generateRandomString(15)}.mpc`

test('run action mint', async () => {
  const randomActionMint: IActionDomainMint = {
    domain: domainName,
    to: config.address,
    byocSymbol: 'TEST_COIN'
  }
  const { transactionHash, fetchResult } = await config.sdk.domainRepository.register(randomActionMint)
  const result = await fetchResult

  verifyTransactionResult(transactionHash, result)
}, 15_000)

test('run action mint batch', async () => {
  const randomActionMint: IActionDomainMint = {
    domain: `${generateRandomString(15)}.mpc`,
    to: config.address,
    byocSymbol: 'TEST_COIN'
  }
  const randomActionMint2: IActionDomainMint = {
    domain: `${generateRandomString(15)}.mpc`,
    to: config.address,
    byocSymbol: 'TEST_COIN'
  }
  const { transactionHash, fetchResult } = await config.sdk.domainRepository.registerBatch([randomActionMint, randomActionMint2])
  const result = await fetchResult

  verifyTransactionResult(transactionHash, result)
}, 15_000)

test('run action renew', async () => {
  const randomActionRenew: IActionDomainRenewal = {
    domain: domainName,
    subscriptionYears: 1,
    payer: config.address,
    byocSymbol: 'TEST_COIN'
  }
  const { transactionHash, fetchResult } = await config.sdk.domainRepository.renew(randomActionRenew)
  const result = await fetchResult

  verifyTransactionResult(transactionHash, result)
}, 15_000)

test('run action transfer', async () => {
  const transferParams: IActionDomainTransfer = {
    domain: domainName,
    from: config.address,
    to: config.address2
  }
  const { transactionHash, fetchResult } = await config.sdk.domainRepository.transfer(transferParams)
  const result = await fetchResult

  verifyTransactionResult(transactionHash, result)
}, 15_000)
