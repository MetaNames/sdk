import { actionApproveMintFeesPayload, actionDomainMintPayload } from "../actions"
import { Address, IActionDomainMint, IContractRepository, IDomain, IDomainAnalyzed, IMetaNamesContractRepository } from "../interface"
import { Domain } from "../models"
import { getParentName } from "../models/helpers/domain"
import { getDomainNamesByOwner, getNftOwners, getPnsDomains, lookUpDomain } from "../partisia-name-system"
import { Config } from "../providers"
import { DomainValidator } from "../validators"

/**
 * Repository to interact with domains on the Meta Names contract
 */
export class DomainRepository {
  private config: Config
  private contractRepository: IContractRepository
  private metaNamesContract: IMetaNamesContractRepository
  public domainValidator: DomainValidator

  constructor(contractRepository: IContractRepository, metaNamesContractRepository: IMetaNamesContractRepository, config: Config) {
    this.config = config
    this.contractRepository = contractRepository
    this.metaNamesContract = metaNamesContractRepository
    this.domainValidator = new DomainValidator(this.config.tld)
  }

  /**
   * Analyze the domain given the name,
   * without checking on the contract state
   * @param domainName
   */
  analyze(domainName: string): IDomainAnalyzed {
    if (!this.domainValidator.validate(domainName)) throw new Error('Domain validation failed')

    const fullName = domainName.endsWith(`.${this.config.tld}`) ? domainName : `${domainName}.${this.config.tld}`

    return {
      name: fullName,
      parentId: getParentName(fullName),
      tld: this.config.tld,
    }
  }

  /**
   * Create a transaction to approve the amount of fees required to mint a domain
   * on the BYOC contract. To get the BYOC contract, please refer to `calculateMintFees` function
   * The function will throw an error if the domain name is invalid.
   * @param domainName A valid domain name
   */
  async approveMintFees(domainName: string, subscriptionYears = 1) {
    if (!this.domainValidator.validate(domainName)) throw new Error('Domain validation failed')
    if (subscriptionYears < 1) throw new Error('Subscription years must be greater than 0')

    const normalizedDomain = this.domainValidator.normalize(domainName)
    const { amount } = await this.calculateMintFees(normalizedDomain)
    const totalAmount = amount * subscriptionYears
    const contract = await this.contractRepository.getContract({ contractAddress: this.config.byoc.address })
    const payload = actionApproveMintFeesPayload(contract.abi, { address: this.config.contractAddress, amount: totalAmount })

    return this.contractRepository.createTransaction({ contractAddress: this.config.byoc.address, payload })
  }

  /**
   * Register a domain
   * @param params Domain mint params
   */
  async register(params: IActionDomainMint) {
    if (!this.domainValidator.validate(params.domain)) throw new Error('Domain validation failed')

    let domain = params.domain
    let parentDomain = params.parentDomain

    if (!parentDomain) parentDomain = getParentName(domain)

    let subscriptionYears: number | undefined
    let normalizedParentDomain: string | undefined
    if (parentDomain) {
      if (!this.domainValidator.validate(parentDomain)) throw new Error('Parent domain validation failed')

      normalizedParentDomain = this.domainValidator.normalize(parentDomain, { reverse: true })
      if (!domain.endsWith(parentDomain)) domain = `${domain}.${parentDomain}`
    } else {
      subscriptionYears = params.subscriptionYears ?? 1
    }

    domain = this.domainValidator.normalize(domain, { reverse: true })
    const contract = await this.metaNamesContract.getContract()
    const payload = actionDomainMintPayload(contract.abi, { ...params, domain, parentDomain: normalizedParentDomain, subscriptionYears })

    return this.metaNamesContract.createTransaction({ payload, gasCost: 'high' })
  }

  /**
   * Calculate mint fees for a domain.
   * The function will throw an error if the domain name is invalid.
   * @param domainName A valid domain name
   */
  calculateMintFees(domainName: string) {
    if (!this.domainValidator.validate(domainName)) throw new Error('Invalid domain name')

    const mintFees: Record<number, number> = {
      1: 200,
      2: 150,
      3: 100,
      4: 50,
    }

    const normalizedDomain = this.domainValidator.normalize(domainName)

    const amount = mintFees[normalizedDomain.length] || 5
    const token = this.config.byoc.token
    const address = this.config.byoc.address

    return { amount, token, address }
  }

  /**
   * Finds a domain by name
   * @param domainName Domain name
   */
  async find(domainName: string) {
    const struct = await this.metaNamesContract.getState()
    const domains = getPnsDomains(struct)
    const nftOwners = getNftOwners(struct)

    const normalizedDomain = this.domainValidator.normalize(domainName, { reverse: true })

    const domain = lookUpDomain(domains, nftOwners, normalizedDomain)
    if (!domain) return null

    return new Domain(domain, this.metaNamesContract)
  }

  /**
   * Finds domains by owner address
   * @param ownerAddress Owner address
   */
  async findByOwner(ownerAddress: Address): Promise<Domain[]> {
    const struct = await this.metaNamesContract.getState()
    const domains = getPnsDomains(struct)
    const nftOwners = getNftOwners(struct)

    const address = Buffer.isBuffer(ownerAddress) ? ownerAddress : Buffer.from(ownerAddress, 'hex')
    const domainNames = getDomainNamesByOwner(domains, nftOwners, address)

    const domainsObjects = domainNames.map((domainName) => lookUpDomain(domains, nftOwners, domainName)).filter((domain) => domain !== undefined) as IDomain[]

    return domainsObjects.map((domain) => new Domain(domain, this.metaNamesContract))
  }
}
