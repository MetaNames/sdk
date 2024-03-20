import { IActionDomainMint } from '../../src/interface'
import { config, generateRandomString } from '../helpers'

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  for (const i of Array(200).keys()) {
    const chunk = 50
    console.log('Minting batch', i, 'total of', i * chunk, 'domains')
    const paramsBatch = new Array(chunk).fill(null).map(() => {
      const domainName = `${generateRandomString(15)}.mpc`
      const randomActionMint: IActionDomainMint = {
        domain: domainName,
        to: config.address,
        byocSymbol: 'TEST_COIN'
      }
      return randomActionMint
    })

    try {
      const { transactionHash, fetchResult } = await config.sdk.domainRepository.registerBatch(paramsBatch)
    } catch (error) {
      console.error(error)
    }
    await sleep(200)
  }
}

main()
