import { config, generateRandomString, mintDomain, verifyTransactionResult } from '../helpers'

const domainName = 'name.mpc'

beforeAll(async () => {
  const domain = await config.sdk.domainRepository.find(domainName)
  if (!domain) await mintDomain(domainName)
}, 15_000)

test('mint domain with parent', async () => {
  const randomName = generateRandomString(10)

  const { transactionHash, fetchResult } = await config.sdk.domainRepository.register({
    domain: randomName,
    to: config.address,
    parentDomain: domainName,
    byocSymbol: 'TEST_COIN'
  })
  const result = await fetchResult

  verifyTransactionResult(transactionHash, result)

  const expectedDomain = [randomName, domainName].join('.')
  const subDomain = await config.sdk.domainRepository.find(expectedDomain)

  expect(subDomain).toBeDefined()
  expect(subDomain).toHaveProperty('name')
  expect(subDomain!.name).toEqual(expectedDomain)
  expect(subDomain!.parentId).toEqual('name.mpc')
}, 10_000)

test('mint subdomain without parent', async () => {
  const randomName = generateRandomString(10)

  const subdomain = `${randomName}.${domainName}`

  const {transactionHash, fetchResult } = await config.sdk.domainRepository.register({
    domain: subdomain,
    to: config.address,
    byocSymbol: 'TEST_COIN'
  })
  const result = await fetchResult

  verifyTransactionResult(transactionHash, result)

  const expectedDomain = subdomain
  const subDomain = await config.sdk.domainRepository.find(expectedDomain)

  expect(subDomain).toBeDefined()
  expect(subDomain).toHaveProperty('name')
  expect(subDomain!.name).toEqual(expectedDomain)
  expect(subDomain!.parentId).toEqual('name.mpc')
}, 10_000)
