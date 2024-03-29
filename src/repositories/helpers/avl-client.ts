import { Buffer } from "buffer"
import { ContractData } from "../../interface"
import { getRequest } from "./client"

export class AvlClient {
  private readonly host: string
  private readonly shards: string[]

  constructor(host: string, shards: number[]) {
    this.host = host
    this.shards = shards.map(s => `Shard${s}`)
  }

  public getContractAbi(address: string): Promise<string | undefined> {
    return getRequest<{ abi: string }>(this.contractStateQueryUrl(address) + "?stateOutput=none").then(data => {
      return data === undefined ? undefined : data.abi
    })
  }

  public getBinaryContractState(address: string): Promise<ContractData | undefined> {
    return getRequest<{ serializedContract: string, abi: string }>(this.contractStateQueryUrl(address) + "?stateOutput=binary").then(data => {
      return data === undefined ? undefined : {
        abi: data.abi,
        serializedContract: {
          state: {
            data: data.serializedContract
          }
        }
      }
    })
  }

  public async getContractStateAvlValue(
    address: string,
    treeId: number,
    key: Buffer
  ): Promise<Buffer | undefined> {
    const data = await getRequest<{ data: string }>(
      `${this.contractStateQueryUrl(address)}/avl/${treeId}/${key.toString("hex")}`
    )
    return data === undefined ? undefined : Buffer.from(data.data, "base64")
  }

  public async getContractStateAvlTree(
    address: string,
    treeId: number,
  ): Promise<Array<Record<string, string>> | undefined> {
    let allData: Array<Record<string, string>> = []

    let lastKey = undefined
    let proceed = true
    const pageSize = 100
    while (proceed) {
      const data = await this.getContractStateAvlNextN(address, treeId, lastKey, pageSize)
      if (data === undefined) return allData

      allData = allData.concat(data)
      const lastElement = data[data.length - 1]
      if (lastElement) {
        const last = Object.keys(lastElement)[0]
        if (last) lastKey = Buffer.from(last, "base64")
      }
      if (data.length < pageSize) proceed = false
    }

    return allData
  }

  public getContractStateAvlNextN(
    address: string,
    treeId: number,
    key: Buffer | undefined,
    n: number
  ): Promise<Array<Record<string, string>> | undefined> {
    if (key === undefined) {
      return getRequest<Array<Record<string, string>>>(
        `${this.contractStateQueryUrl(address)}/avl/${treeId}/next?n=${n}`
      )
    } else {
      return getRequest<Array<Record<string, string>>>(
        `${this.contractStateQueryUrl(address)}/avl/${treeId}/next/${key.toString("hex")}?n=${n}`
      )
    }
  }

  private contractStateQueryUrl(address: string): string {
    return `${this.host}/shards/${this.shardForAddress(address)}/blockchain/contracts/${address}`
  }

  private shardForAddress(address: string): string {
    const numOfShards = this.shards.length
    const buffer = Buffer.from(address, "hex")
    const shardIndex = Math.abs(buffer.readInt32BE(17)) % numOfShards
    const shard = this.shards[shardIndex]
    if (!shard) throw new Error("Shard not found")

    return shard
  }
}
