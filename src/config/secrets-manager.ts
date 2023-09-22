import PartisiaSdk from "partisia-sdk"

export class SecretsManager {
  private static instance: SecretsManager

  privateKey?: string
  partisiaSdk?: PartisiaSdk

  private constructor() { }

  public static getInstance(): SecretsManager {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager()
    }

    return SecretsManager.instance
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
