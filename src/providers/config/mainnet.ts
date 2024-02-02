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
  byoc: [{
    address: '01e0dbf1ce62c4ebd76fa8aa81f3630e0e84001206',
    id: 0,
    symbol: 'POLYGON_USDC',
    rounding: 1
  },{
    address: '011150c3a2779309ff52e86c139ff58265a93fafd4',
    id: 1,
    symbol: 'ETHEREUM_USDT',
    rounding: 1
  },{
    address: '01d9f82e98a22b319aa371e752f3e0d85bd96c9545',
    id: 2,
    symbol: 'MATIC',
    rounding: 100
  },{
    address: '014a6d0fd09fe2e6853a76caedcb46646ab7ee69d6',
    id: 3,
    symbol: 'ETH',
    rounding: 10000
  },{
    address: '0137f4da8ad6a9a5305383953d4b3a9c7859c08bea',
    id: 4,
    symbol: 'BNB',
    rounding: 1000
  }]
}
