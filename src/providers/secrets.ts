import PartisiaSdk from "partisia-sdk"
import { MetaMaskSdk, SigningClassType, SigningStrategyType } from "../interface"

export class SecretsProvider {
  private static instance: SecretsProvider

  strategy?: SigningStrategyType
  secret?: SigningClassType

  private constructor() { }

  // TODO: Remove singleton as it might leak secrets
  public static getInstance(): SecretsProvider {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!SecretsProvider.instance) {
      SecretsProvider.instance = new SecretsProvider()
    }

    return SecretsProvider.instance
  }

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
        this.setSecret(value)
        break

      case 'MetaMask':
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

  private setSecret(secret?: SigningClassType) {
    this.secret = secret
  }
}
