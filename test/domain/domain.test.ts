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
