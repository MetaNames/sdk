import { BN } from "@partisiablockchain/abi-client"
import { actionApproveMintFeesPayload, actionDomainMintPayload, actionDomainRenewalPayload, actionDomainTransferPayload } from "../actions"
import { Address, IActionDomainMint, IActionDomainRenewal, IActionDomainTransfer, IContractRepository, IDomainAnalyzed, IMetaNamesContractRepository, MetaNamesAvlTrees } from "../interface"
import { Domain } from "../models"
import { getParentName } from "../models/helpers/domain"
import { decorateDomain, deserializeDomain, deserializeDomainsAvl, deserializeOwnersAvl, getDecimalsMultiplier, getDomainCount, getDomainNamesByOwner, getMintFees, getNftOwners, getPnsDomains, lookUpDomain } from "../partisia-name-system"
import { BYOCSymbol, Config } from "../providers"
import { DomainValidator } from "../validators"
import { getFeesLabel } from "./helpers/contract"
import { LittleEndianByteOutput } from "@secata-public/bitmanipulation-ts"

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
    this.domainValidator = new DomainValidator(this.config.tlds)
  }

  /**
   * Analyze the domain given the name,
   * without checking on the contract state
   * @param domainName
   */
  analyze(domainName: string): IDomainAnalyzed {
    if (!this.domainValidator.validate(domainName)) throw new Error('Domain validation failed')

    const domainWithoutTld = this.domainValidator.normalize(domainName, { reverse: false, removeTLD: true })
    const fullName = `${domainWithoutTld}.${this.config.tld}`

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
  async approveMintFees(domainName: string, byocSymbol: BYOCSymbol, subscriptionYears = 1) {
    if (!this.domainValidator.validate(domainName)) throw new Error('Domain validation failed')
    if (subscriptionYears < 1) throw new Error('Subscription years must be greater than 0')

    const normalizedDomain = this.domainValidator.normalize(domainName)
    const { fees, address: byocAddress } = await this.calculateMintFees(normalizedDomain, byocSymbol)
    const totalAmount = fees.mul(new BN(subscriptionYears))
    const contract = await this.contractRepository.getContract({ contractAddress: byocAddress, partial: true })
    const metanamesContractAddress = await this.metaNamesContract.getContractAddress()
    const payload = actionApproveMintFeesPayload(contract.abi, { address: metanamesContractAddress, amount: totalAmount })

    return this.contractRepository.createTransaction({ contractAddress: byocAddress, payload })
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

    const byoc = this.config.byoc.find((byoc) => byoc.symbol === params.byocSymbol)
    if (!byoc) throw new Error(`BYOC ${params.byocSymbol} not found`)

    domain = this.domainValidator.normalize(domain, { reverse: true })
    const abi = await this.metaNamesContract.getAbi()
    const payload = actionDomainMintPayload(abi.contract, { ...params, domain, parentDomain: normalizedParentDomain, byocTokenId: byoc.id, subscriptionYears })

    return this.metaNamesContract.createTransaction({ payload, gasCost: 'high' })
  }

  /**
   * Renew a domain
   * @param params Domain renewal params
   * @returns transaction intent
   */
  async renew(params: IActionDomainRenewal) {
    const domainName = params.domain
    const subscriptionYears = params.subscriptionYears ?? 1

    if (!this.domainValidator.validate(params.domain)) throw new Error('Domain validation failed')
    if (subscriptionYears < 1) throw new Error('Subscription years must be greater than 0')

    const byoc = this.config.byoc.find((byoc) => byoc.symbol === params.byocSymbol)
    if (!byoc) throw new Error(`BYOC ${params.byocSymbol} not found`)

    const domain = this.domainValidator.normalize(domainName, { reverse: true })
    const abi = await this.metaNamesContract.getAbi()
    const payload = actionDomainRenewalPayload(abi.contract, { ...params, domain, subscriptionYears, byocTokenId: byoc.id })

    return this.metaNamesContract.createTransaction({ payload, gasCost: 'high' })
  }

  async transfer(params: IActionDomainTransfer) {
    const { domain, from, to } = params
    if (!this.domainValidator.validate(domain)) throw new Error('Domain validation failed')

    const normalizedDomain = this.domainValidator.normalize(domain, { reverse: true })
    const abi = await this.metaNamesContract.getAbi()
    const payload = actionDomainTransferPayload(abi.contract, { domain: normalizedDomain, from, to })

    return this.metaNamesContract.createTransaction({ payload, gasCost: 'high' })
  }


  /**
   * Calculate mint fees for a domain.
   * The function will throw an error if the domain name is invalid.
   * @param domainName A valid domain name
   */
  async calculateMintFees(domainName: string, tokenSymbol: BYOCSymbol) {
    if (!this.domainValidator.validate(domainName)) throw new Error('Invalid domain name')

    const [struct, availableCoins] = await Promise.all([
      this.metaNamesContract.getState({ partial: true }),
      this.contractRepository.getByocCoins()
    ])

    const normalizedDomain = this.domainValidator.normalize(domainName)
    const handledByoc = this.config.byoc.find((byoc) => byoc.symbol === tokenSymbol)
    if (!handledByoc) throw new Error(`BYOC ${tokenSymbol} not handled`)

    const fees = getMintFees(struct, normalizedDomain, handledByoc.id)
    const symbol = handledByoc.symbol
    const address = handledByoc.address

    const symbolString = symbol.toString()
    const networkByoc = availableCoins.find((coin) => coin.symbol === symbolString)
    if (!networkByoc) throw new Error(`BYOC ${symbolString} coin not found in available coins`)

    const feesLabel = getFeesLabel(fees, getDecimalsMultiplier(handledByoc.decimals))

    return { fees, symbol, address, feesLabel }
  }

  /**
   * Finds a domain by name
   * @param domainName Domain name
   */
  async find(domainName: string, options?: { cache?: boolean }) {
    const normalizedDomain = this.domainValidator.normalize(domainName, { reverse: true })
    const domainBufferBuilder = new LittleEndianByteOutput()
    domainBufferBuilder.writeString(normalizedDomain)

    const domainBuffer = await this.metaNamesContract.getStateAvlValue(MetaNamesAvlTrees.domains, domainBufferBuilder.toBuffer())
    if (!domainBuffer) return null

    const { cache } = { cache: true, ...options }
    const struct = await this.metaNamesContract.getState({ force: !cache, partial: true })
    const nftOwners = getNftOwners(struct)

    const abi = await this.metaNamesContract.getAbi()
    const domainPartial = deserializeDomain(domainBuffer, abi.contract, normalizedDomain, this.config.tld)

    const ownerBufferBuilder = new LittleEndianByteOutput()
    ownerBufferBuilder.writeUnsignedBigInteger(new BN(domainPartial.tokenId), 16)

    const ownerBuffer = await this.metaNamesContract.getStateAvlValue(MetaNamesAvlTrees.owners, ownerBufferBuilder.toBuffer())
    if (!ownerBuffer) throw new Error('Owner not found')

    const owner = ownerBuffer.toString('hex')

    return new Domain({ ...domainPartial, owner })
  }

  /**
   * Get all registered domains
   * @returns Domain[]
   */
  async getAll() {
    const domainsAvl = await this.metaNamesContract.getStateAvlTree(MetaNamesAvlTrees.domains)
    if (!domainsAvl) throw new Error('Domains not found')

    const abi = await this.metaNamesContract.getAbi()
    const domainsList = deserializeDomainsAvl(domainsAvl, abi.contract, this.config.tld)

    const onwersAvl = await this.metaNamesContract.getStateAvlTree(MetaNamesAvlTrees.owners)
    if (!onwersAvl) throw new Error('Owners not found')
    const nftOwners = deserializeOwnersAvl(onwersAvl)

    const domains: Domain[] = []
    domainsList.forEach((domainObj) => {
      const owner = nftOwners.get(domainObj.tokenId)
      if (!owner) throw new Error('Owner not found')
      const domain = { ...domainObj, owner }
      domains.push(new Domain(domain))
    })

    return domains
  }

  /**
   * Count the number of registered domains
   * @returns number
   */
  async count() {
    const struct = await this.metaNamesContract.getState()

    return getDomainCount(struct)
  }

  /**
   * Finds domains by owner address
   * @param ownerAddress Owner address
   */
  async findByOwner(ownerAddress: Address): Promise<Domain[]> {
    const domainsAvl = await this.metaNamesContract.getStateAvlTree(MetaNamesAvlTrees.domains)
    if (!domainsAvl) throw new Error('Domains not found')
    const abi = await this.metaNamesContract.getAbi()
    const domainsList = deserializeDomainsAvl(domainsAvl, abi.contract, this.config.tld)

    const onwersAvl = await this.metaNamesContract.getStateAvlTree(MetaNamesAvlTrees.owners)
    if (!onwersAvl) throw new Error('Owners not found')
    const nftOwners = deserializeOwnersAvl(onwersAvl)

    const address = Buffer.isBuffer(ownerAddress) ? ownerAddress : Buffer.from(ownerAddress, 'hex')

    const tokenIds: number[] = []
    nftOwners.forEach((address, tokenId) => {
      if (address === ownerAddress) tokenIds.push(tokenId)
    })

    const ownerString = address.toString('hex')
    const domains: Domain[] = []
    domainsList.forEach((domainObj) => {
      if (tokenIds.includes(domainObj.tokenId)) {
        const domain = { ...domainObj, owner: ownerString }
        domains.push(new Domain(domain))
      }
    })

    return domains
  }

  /**
   * Get all owners addresses
   * @returns string[]
   */
  async getOwners() {
    const onwersAvl = await this.metaNamesContract.getStateAvlTree(MetaNamesAvlTrees.owners)
    if (!onwersAvl) throw new Error('Owners not found')
    const nftOwners = deserializeOwnersAvl(onwersAvl)

    const owners: string[] = []
    nftOwners.forEach((address) => {
      if (!owners.includes(address)) owners.push(address)
    })

    return owners
  }
}
