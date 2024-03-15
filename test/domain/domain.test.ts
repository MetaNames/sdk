import { config, generateRandomString, mintDomain } from '../helpers'

const domainName = 'name.mpc'

beforeAll(async () => {
  const domain = await config.sdk.domainRepository.find(domainName)
  if (!domain) await mintDomain(domainName)
}, 15_000)

test('analyze domain', () => {
  const domainName = 'sub.name.mpc'

  const domain = config.sdk.domainRepository.analyze(domainName)

  expect(domain).toBeDefined()
  expect(domain).toHaveProperty('name')
  expect(domain).toHaveProperty('parentId')
  expect(domain).toHaveProperty('tld')
  expect(domain!.name).toEqual(domainName)
  expect(domain!.tld).toEqual('mpc')
  expect(domain!.parentId).toEqual('name.mpc')
})

test('lookup domain', async () => {
  const data = await config.sdk.domainRepository.find(domainName)

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

test('lookup domain of non existant domain returns null', async () => {
  const data = await config.sdk.domainRepository.find(generateRandomString(15))

  expect(data).toBeNull()
})

test('findByOwner returns the correct domains', async () => {
  const domains = await config.sdk.domainRepository.findByOwner(config.address)

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
  expect(domain!.tld).toEqual('mpc')
  expect(domain!.createdAt).toBeInstanceOf(Date)
}, 20_000)

test('run action count', async () => {
  const count = await config.sdk.domainRepository.count()

  expect(count).toBeGreaterThan(0)
})

test('get owners', async () => {
  const owners = await config.sdk.domainRepository.getOwners()

  expect(owners).toBeDefined()
  expect(owners.length).toBeGreaterThan(0)
  expect(owners).toContain(config.address)
}, 20_000)

test('toJson', async () => {
  const domain = await config.sdk.domainRepository.find(domainName)
  const json = domain?.toJSON()

  expect(json).toBeDefined()
  expect(json).toHaveProperty('name')
  expect(json).toHaveProperty('tld')
  expect(json).toHaveProperty('createdAt')
  expect(json).toHaveProperty('expiresAt')
  expect(json).toHaveProperty('owner')
  expect(json).toHaveProperty('tokenId')
  expect(json).toHaveProperty('parentId')
  expect(json).toHaveProperty('records')
  expect(json!.name).toEqual(domainName)
  expect(json!.tld).toEqual('mpc')
  expect(json!.createdAt).toBeInstanceOf(Date)
  expect(json!.owner).toEqual(config.address)
  expect(json!.tokenId).toBeGreaterThan(0)
  expect(json!.parentId).toBeUndefined()
  expect(json!.records).toBeDefined()
})
