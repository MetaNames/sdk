import { Buffer } from 'buffer'
import { actionDomainMintPayload } from '../../src/actions'
import { IActionDomainMint } from '../../src/interface'
import { config } from '../helpers'


test('payload for action domain mint', async () => {
  const expectedHex = '09000000096e616d652e6d6574610000000000000000000000000000000000000000000000'

  const params: IActionDomainMint = {
    domain: 'name.meta',
    to: Buffer.alloc(21),
    token_uri: undefined,
    parent_domain: undefined,
  }
  const contractAbi = await config.metaNamesContract.contractRepository.getContractAbi()
  const data = actionDomainMintPayload(contractAbi, params)

  expect(data.toString('hex')).toBe(expectedHex)
})
