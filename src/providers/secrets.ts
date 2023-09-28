import PartisiaSdk from "partisia-sdk"

export class SecretsProvider {
  private static instance: SecretsProvider

  privateKey?: string
  partisiaSdk?: PartisiaSdk

  private constructor() { }

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
  setSigningStrategy(strategy: 'privateKey' | 'partisiaSdk', value: string | PartisiaSdk) {
    this.resetSigningStrategy()

    if (strategy === 'privateKey') {
      if (typeof value !== 'string') throw new Error('Private key must be a string')

      this.setPrivateKey(value)
    } else this.setPartisiaSdk(value as PartisiaSdk)
  }

  /**
   * Reset the signing strategy
   */
  resetSigningStrategy() {
    this.setPrivateKey()
    this.setPartisiaSdk()
  }

  private setPrivateKey(privateKey?: string) {
    this.privateKey = privateKey
  }

  private setPartisiaSdk(partisiaSdk?: PartisiaSdk) {
    this.partisiaSdk = partisiaSdk
  }
}
