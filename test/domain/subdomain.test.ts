import { config, generateRandomString, mintDomain } from '../helpers'

const domainName = 'name.meta'

beforeAll(async () => {
  const domain = await config.metaNames.domainRepository.find(domainName)
  if (!domain) await mintDomain(domainName)
}, 15_000)

test('mint domain with parent', async () => {
  const randomName = generateRandomString(10)

  const result = await config.metaNames.domainRepository.register({
    domain: randomName,
    to: config.address,
    parentDomain: domainName
  })

  expect(result).toBeDefined()
  expect(result.hasError).toBeFalsy()
  expect(result.isFinalOnChain).toBeTruthy()

  const expectedDomain = [randomName, domainName].join('.')
  const subDomain = await config.metaNames.domainRepository.find(expectedDomain)

  expect(subDomain).toBeDefined()
  expect(subDomain).toHaveProperty('name')
  expect(subDomain!.name).toEqual(expectedDomain)
  expect(subDomain!.parentId).toEqual('name.meta')
}, 10_000)

test('mint subdomain without parent', async () => {
  const randomName = generateRandomString(10)

  const subdomain = `${randomName}.${domainName}`

  const result = await config.metaNames.domainRepository.register({
    domain: subdomain,
    to: config.address,
  })

  expect(result).toBeDefined()
  expect(result.hasError).toBeFalsy()
  expect(result.isFinalOnChain).toBeTruthy()

  const expectedDomain = subdomain
  const subDomain = await config.metaNames.domainRepository.find(expectedDomain)

  expect(subDomain).toBeDefined()
  expect(subDomain).toHaveProperty('name')
  expect(subDomain!.name).toEqual(expectedDomain)
  expect(subDomain!.parentId).toEqual('name.meta')
}, 10_000)
