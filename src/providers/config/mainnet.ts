import { Config } from "../config"

export const mainNetConfig: Config = {
  tld: 'meta',
  contractAddress: '02158b8610671957e88de6265d119bec1af071a551',
  rpcConfig: {
    urlBaseGlobal: { url: "https://reader.partisiablockchain.com", shard_id: 99 },
    urlBaseShards: [
      { url: "https://reader.partisiablockchain.com/shards/Shard0", shard_id: 0 },
      { url: "https://reader.partisiablockchain.com/shards/Shard1", shard_id: 1 },
      { url: "https://reader.partisiablockchain.com/shards/Shard2", shard_id: 2 },
    ],
  },
  byoc: {
    address: '01e0dbf1ce62c4ebd76fa8aa81f3630e0e84001206',
    token: 'USDC'
  }
}
