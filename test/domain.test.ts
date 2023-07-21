import { config, mintDomain } from './helpers'

const domain = 'name.meta'

beforeAll(async () => {
  try {
    await config.metaNamesContract.domainRepository.find(domain)
  } catch (e) {
    await mintDomain(domain)
  }
}, 15_000)

test('lookup domain', async () => {
  const data = await config.metaNamesContract.domainRepository.find(domain)

  expect(data).toBeDefined()
  expect(data).toHaveProperty('tokenId')
  expect(data).toHaveProperty('parentId')
  expect(data).toHaveProperty('records')
})
