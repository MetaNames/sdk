import { config, mintDomain } from './helpers'

const domain = 'name.meta'

beforeAll(async () => {
  const data = await config.metaNamesContract.domainLookup(domain)
  if (!data) await mintDomain(domain)
}, 15_000)

test('lookup domain', async () => {
  const data = await config.metaNamesContract.domainLookup(domain)

  expect(data).toBeDefined()
  expect(data).toHaveProperty('tokenId', 1)
  expect(data).toHaveProperty('parentId')
  expect(data).toHaveProperty('records')
})
