import { config, mintDomain } from '../helpers'

const domainName = 'name.meta'

beforeAll(async () => {
  const domain = await config.metaNames.domainRepository.find(domainName)
  if (!domain) await mintDomain(domainName)
}, 15_000)

test('analyze domain', () => {
  const domainName = 'sub.name.meta'

  const domain = config.metaNames.domainRepository.analyze(domainName)

  expect(domain).toBeDefined()
  expect(domain).toHaveProperty('name')
  expect(domain).toHaveProperty('parentId')
  expect(domain).toHaveProperty('tld')
  expect(domain!.name).toEqual(domainName)
  expect(domain!.tld).toEqual('meta')
  expect(domain!.parentId).toEqual('name.meta')
})

test('lookup domain', async () => {
  const data = await config.metaNames.domainRepository.find(domainName)

  expect(data).toBeDefined()
  expect(data).toHaveProperty('name')
  expect(data).toHaveProperty('createdAt')
  expect(data).toHaveProperty('expiresAt')
  expect(data).toHaveProperty('tokenId')
  expect(data).toHaveProperty('owner')
  expect(data).toHaveProperty('parentId')
  expect(data).toHaveProperty('records')
  expect(data!.name).toEqual(domainName)
  expect(data!.createdAt).toBeInstanceOf(Date)
})

test('findByOwner returns the correct domains', async () => {
  const domains = await config.metaNames.domainRepository.findByOwner(config.address)

  expect(domains).toBeDefined()

  const domain = domains.find(d => d.name === domainName)

  expect(domain).toBeDefined()
  expect(domain).toHaveProperty('name')
  expect(domain).toHaveProperty('createdAt')
  expect(domain).toHaveProperty('expiresAt')
  expect(domain).toHaveProperty('tld')
  expect(domain).toHaveProperty('tokenId')
  expect(domain).toHaveProperty('owner')
  expect(domain).toHaveProperty('parentId')
  expect(domain).toHaveProperty('records')
  expect(domain!.owner).toEqual(config.address)
  expect(domain!.tld).toEqual('meta')
  expect(domain!.createdAt).toBeInstanceOf(Date)
}, 10_000)

test('run action count', async () => {
  const count = await config.metaNames.domainRepository.count()

  expect(count).toBeGreaterThan(0)
})

test('get owners', async () => {
  const owners = await config.metaNames.domainRepository.getOwners()

  expect(owners).toBeDefined()
  expect(owners.length).toBeGreaterThan(0)
  expect(owners).toContain(config.address)
})
