import { actionDomainMintPayload } from "../actions"
import { IActionDomainMint, IContractRepository } from "../interface"
import { Domain } from "../models/domain"
import { getPnsDomains, lookUpDomain } from "../partisia-name-system"
import { Config } from "../providers"
import DomainValidator from "../validators/domain"

export class DomainRepository {
  private config: Config
  private contractRepository: IContractRepository
  private domainValidator: DomainValidator

  constructor(contractRepository: IContractRepository, config: Config) {
    this.config = config
    this.contractRepository = contractRepository
    this.domainValidator = new DomainValidator()
  }

  /**
   * Mint a domain
   * @param params Domain mint params
   */
  async mint(params: IActionDomainMint) {
    if (!this.domainValidator.validate(params.domain)) throw new Error('Domain validation failed')
    let domainName = params.domain

    let normalizedParentDomain: string | undefined
    if (params.parent_domain) {
      if (!this.domainValidator.validate(params.parent_domain)) throw new Error('Domain validation failed')

      if (!domainName.endsWith(params.parent_domain)) domainName = `${params.domain}.${params.parent_domain}`
      normalizedParentDomain = this.domainValidator.normalize(params.parent_domain)
    }

    const normalizedDomain = this.domainValidator.normalize(domainName)
    const contractAbi = await this.contractRepository.getContractAbi()
    const payload = actionDomainMintPayload(contractAbi, { ...params, domain: normalizedDomain, parent_domain: normalizedParentDomain })

    return await this.contractRepository.createTransaction(payload)
  }

  /**
   * Calculate mint fees for a domain.
   * The function will throw an error if the domain name is invalid.
   * @param domainName A valid domain name
   */
  calculateMintFees(domainName: string) {
    if (!this.domainValidator.validate(domainName)) throw new Error('Invalid domain name')

    const mintFees: { [key: number]: number } = {
      1: 200,
      2: 150,
      3: 100,
      4: 50,
    }

    const amount = mintFees[domainName.length] || 5
    const token = this.config.byoc.token
    const address = this.config.byoc.address

    return { amount, token, address }
  }

  /**
   * Finds a domain by name
   * @param domainName Domain name
   */
  async find(domainName: string) {
    const struct = await this.contractRepository.getState()
    const domains = getPnsDomains(struct)

    const normalizedDomain = this.domainValidator.normalize(domainName)

    const domain = lookUpDomain(domains, normalizedDomain)
    if (!domain) return null

    return new Domain(domain, this.contractRepository)
  }
}
