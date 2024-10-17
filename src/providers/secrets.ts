import type PartisiaSdk from "partisia-blockchain-applications-sdk"
import type LedgerTransport from "@ledgerhq/hw-transport"
import { MetaMaskSdk, SigningClassType, SigningStrategyType } from "../interface"

export class SecretsProvider {
  strategy?: SigningStrategyType
  secret?: SigningClassType

  /**
 * Set the strategy to sign transactions
 * @param strategy Signing strategy
 * @param value The value of the strategy
 */
  setSigningStrategy(strategy: SigningStrategyType, value: SigningClassType) {
    this.resetSigningStrategy()

    switch (strategy) {
      case 'privateKey':
        if (typeof value !== 'string') throw new Error('Private key must be a string')

        this.setSecret(value)
        break
      case 'partisiaSdk':
      case 'MetaMask':
      case 'Ledger':
        this.setSecret(value)
        break

      default:
        throw new Error('Invalid signing strategy')
    }

    this.strategy = strategy
  }

  /**
   * Reset the signing strategy
   */
  resetSigningStrategy() {
    this.setSecret()
  }

  get privateKey(): string {
    if (this.strategy !== 'privateKey') throw new Error('Invalid signing strategy')

    return this.secret as string
  }

  get partisiaSdk(): PartisiaSdk {
    if (this.strategy !== 'partisiaSdk') throw new Error('Invalid signing strategy')

    return this.secret as PartisiaSdk
  }

  get metaMask(): MetaMaskSdk {
    if (this.strategy !== 'MetaMask') throw new Error('Invalid signing strategy')

    return this.secret as MetaMaskSdk
  }

  get ledger(): LedgerTransport {
    if (this.strategy !== 'Ledger') throw new Error('Invalid signing strategy')

    return this.secret as LedgerTransport
  }

  private setSecret(secret?: SigningClassType) {
    this.secret = secret
  }
}
