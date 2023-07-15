import { actionDomainMintPayload } from "../actions"
import { IActionDomainMint, IContractRepository } from "../interface"
import { Domain } from "../models/domain"
import { getPnsDomains, lookUpDomain } from "../partisia-name-system"

export class DomainRepository {
  contractRepository: IContractRepository

  constructor(contractRepository: IContractRepository) {
    this.contractRepository = contractRepository
  }

  async mint(params: IActionDomainMint) {
    const contractAbi = await this.contractRepository.getContractAbi()
    const payload = actionDomainMintPayload(contractAbi, params)

    return await this.contractRepository.createTransaction(payload)
  }

  async find(domainName: string): Promise<Domain> {
    const struct = await this.contractRepository.getState()
    const domains = getPnsDomains(struct)

    const domain = lookUpDomain(domains, domainName)
    if (!domain) throw new Error('Domain not found')

    return new Domain(domain, this.contractRepository)
  }
}
