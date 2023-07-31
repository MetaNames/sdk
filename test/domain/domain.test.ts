import { config, mintDomain } from '../helpers'

const domainName = 'name.meta'

beforeAll(async () => {
  const domain = await config.metaNamesContract.domainRepository.find(domainName)
  if (!domain) await mintDomain(domainName)
}, 15_000)

test('lookup domain', async () => {
  const data = await config.metaNamesContract.domainRepository.find(domainName)

  expect(data).toBeDefined()
  expect(data).toHaveProperty('tokenId')
  expect(data).toHaveProperty('parentId')
  expect(data).toHaveProperty('records')
})

test('mint domain with parent', async () => {
  const domain = await config.metaNamesContract.domainRepository.find(domainName)

  expect(domain).toBeDefined()

  const result = await config.metaNamesContract.domainRepository.mint({
    domain: 'sub',
    to: config.address,
    parent_domain: 'name.meta'
  })

  expect(result).toBeDefined()
  expect(result.hasError).toBeFalsy()
  expect(result.isFinalOnChain).toBeTruthy()

  const subDomain = await config.metaNamesContract.domainRepository.find('sub.name.meta')

  expect(subDomain).toBeDefined()
}, 10_000)
