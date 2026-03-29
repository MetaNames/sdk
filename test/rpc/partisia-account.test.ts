import { PartisiaAccount } from '../../src/rpc/partisia-account'

describe('rpc/partisia-account', () => {
  const mockConfig = {
    urlBaseGlobal: { url: 'https://node1.testnet.partisiablockchain.com', shard_id: 99 },
    urlBaseShards: [
      { shard_id: 0, url: 'https://node1.testnet.partisiablockchain.com' },
      { shard_id: 1, url: 'https://node2.testnet.partisiablockchain.com' },
      { shard_id: 2, url: 'https://node3.testnet.partisiablockchain.com' },
    ],
  }

  describe('deriveShardId', () => {
    it('should derive a shard ID from address', () => {
      const account = PartisiaAccount(mockConfig)

      const address = '00373c68dfed999aec39063194e2d3e0870f9899fa'
      const shardId = account.deriveShardId(address)

      expect(typeof shardId).toBe('string')
      expect(shardId.startsWith('Shard')).toBe(true)
    })

    it('should return consistent shard for same address', () => {
      const account = PartisiaAccount(mockConfig)

      const address = '00373c68dfed999aec39063194e2d3e0870f9899fa'
      const shardId1 = account.deriveShardId(address)
      const shardId2 = account.deriveShardId(address)

      expect(shardId1).toBe(shardId2)
    })

    it('should return ShardN for empty address based on hash', () => {
      const account = PartisiaAccount(mockConfig)

      const shardId = account.deriveShardId('')

      expect(typeof shardId).toBe('string')
      expect(shardId.startsWith('Shard')).toBe(true)
    })
  })

  describe('getShardUrl', () => {
    it('should return shard URL for valid shard ID', () => {
      const account = PartisiaAccount(mockConfig)

      const url = account.getShardUrl('Shard1')

      expect(typeof url).toBe('string')
      expect(url.length).toBeGreaterThan(0)
    })

    it('should return global URL for invalid shard ID', () => {
      const account = PartisiaAccount(mockConfig)

      const url = account.getShardUrl('InvalidShard')

      expect(url).toBe(mockConfig.urlBaseGlobal.url)
    })

    it('should return correct URL for each shard', () => {
      const account = PartisiaAccount(mockConfig)

      expect(account.getShardUrl('Shard0')).toBe(mockConfig.urlBaseShards[0].url)
      expect(account.getShardUrl('Shard1')).toBe(mockConfig.urlBaseShards[1].url)
      expect(account.getShardUrl('Shard2')).toBe(mockConfig.urlBaseShards[2].url)
    })
  })
})
