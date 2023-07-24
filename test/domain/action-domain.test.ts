import { IActionDomainMint } from '../../src/interface'
import { config, generateRandomString } from '../helpers'

test('run action mint', async () => {
  const randomActionMint: IActionDomainMint = {
    domain: `${generateRandomString(15)}.meta`,
    to: config.address,
    token_uri: undefined,
    parent_domain: undefined,
  }
  const result = await config.metaNamesContract.domainRepository.mint(randomActionMint)

  expect(result.isFinalOnChain).toBe(true)
  expect(result.hasError).toBe(false)
}, 10_000)
