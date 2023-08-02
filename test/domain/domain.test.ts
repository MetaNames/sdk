import { config, generateRandomString, mintDomain } from '../helpers'

const domainName = 'name.meta'

beforeAll(async () => {
  const domain = await config.metaNames.domainRepository.find(domainName)
  if (!domain) await mintDomain(domainName)
}, 15_000)

test('lookup domain', async () => {
  const data = await config.metaNames.domainRepository.find(domainName)

  expect(data).toBeDefined()
  expect(data).toHaveProperty('tokenId')
  expect(data).toHaveProperty('parentId')
  expect(data).toHaveProperty('records')
})

test('mint domain with parent', async () => {
  const randomName = generateRandomString(10)
  const domain = await config.metaNames.domainRepository.find(randomName)

  expect(domain).toBeDefined()

  const result = await config.metaNames.domainRepository.mint({
    domain: randomName,
    to: config.address,
    parent_domain: 'name.meta'
  })

  expect(result).toBeDefined()
  expect(result.hasError).toBeFalsy()
  expect(result.isFinalOnChain).toBeTruthy()

  const expectedDomain = randomName + '.name.meta'
  const subDomain = await config.metaNames.domainRepository.find(expectedDomain)

  expect(subDomain).toBeDefined()
}, 10_000)

test('calculate mint fees', () => {
  const feesTuples: [string, number][] = [
    ['n', 200],
    ['na', 150],
    ['nam', 100],
    ['name', 50],
    ['names', 5],
    ['verylongname', 5],
  ]

  feesTuples.forEach(([name, fee]) => {
    const { token: expectedToken, address: expectedAddress } = config.metaNames.config.byoc
    const { amount, token, address } = config.metaNames.domainRepository.calculateMintFees(name)

    expect(amount).toEqual(fee)
    expect(token).toEqual(expectedToken)
    expect(address).toEqual(expectedAddress)
  })
})
