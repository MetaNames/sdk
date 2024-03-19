import { Config } from "../config"

export const testNetConfig: Config = {
  cache_ttl: 10 * 60 * 1000, // 10 minutes
  tld: 'mpc',
  tlds: ['mpc', 'meta'],
  contractAddress: '0255a408adef31f24a892c96fddeb31da79d243043',
  hasProxyContract: true,
  rpcConfig: {
    urlBaseGlobal: { url: 'https://node1.testnet.partisiablockchain.com', shard_id: 99 },
    urlBaseShards: [
      { url: 'https://node1.testnet.partisiablockchain.com/shards/Shard0', shard_id: 0 },
      { url: 'https://node1.testnet.partisiablockchain.com/shards/Shard1', shard_id: 1 },
      { url: 'https://node1.testnet.partisiablockchain.com/shards/Shard2', shard_id: 2 },
    ],
  },
  byoc: [{
    address: '01f3cc99688e6141355c53752418230211facf063c',
    id: 0,
    symbol: 'TEST_COIN',
    decimals: 0
  },
  {
    address: '01dce90b5a0b6eb598dd6b4250f0f5924eb4a4a818',
    id: 1,
    symbol: 'ETH_GOERLI',
    decimals: 18
  }]
}
