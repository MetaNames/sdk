import { config, mintDomain } from '../helpers'

const domainName = 'name.meta'

beforeAll(async () => {
  const domain = await config.metaNames.domainRepository.find(domainName)
  if (!domain) await mintDomain(domainName)
}, 15_000)

test('lookup domain', async () => {
  const data = await config.metaNames.domainRepository.find(domainName)

  expect(data).toBeDefined()
  expect(data).toHaveProperty('name')
  expect(data).toHaveProperty('tokenId')
  expect(data).toHaveProperty('owner')
  expect(data).toHaveProperty('parentId')
  expect(data).toHaveProperty('records')
  expect(data!.name).toEqual(domainName)
})

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

test('findByOwner returns the correct domains', async () => {
  const domains = await config.metaNames.domainRepository.findByOwner(config.address)

  expect(domains).toBeDefined()

  const domain = domains.find(d => d.name === domainName)

  expect(domain).toBeDefined()
  expect(domain).toHaveProperty('name')
  expect(domain).toHaveProperty('tld')
  expect(domain).toHaveProperty('tokenId')
  expect(domain).toHaveProperty('owner')
  expect(domain).toHaveProperty('parentId')
  expect(domain).toHaveProperty('records')
  expect(domain!.owner).toEqual(config.address)
  expect(domain!.tld).toEqual('meta')
}, 10_000)
