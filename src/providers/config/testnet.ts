import { Config } from "../config"

export const testNetConfig: Config = {
  contractAddress: '0221f792ea978d62043ba08a625324467a51d9e615',
  rpcConfig: {
    urlBaseGlobal: { url: 'https://node1.testnet.partisiablockchain.com', shard_id: 99 },
    urlBaseShards: [
      { url: 'https://node1.testnet.partisiablockchain.com/shards/Shard0', shard_id: 0 },
      { url: 'https://node1.testnet.partisiablockchain.com/shards/Shard1', shard_id: 1 },
      { url: 'https://node1.testnet.partisiablockchain.com/shards/Shard2', shard_id: 2 },
    ],
  },
  byoc: {
    address: '01f3cc99688e6141355c53752418230211facf063c',
    token: 'TEST_COIN'
  }
}
