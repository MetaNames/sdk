import { PartisiaRpc } from '../../src/rpc/partisia-rpc'

describe('rpc/partisia-rpc', () => {
  const mockShardUrl = 'https://node1.testnet.partisiablockchain.com/shards/Shard0'
  const mockGlobalUrl = 'https://node1.testnet.partisiablockchain.com'

  describe('PartialisRpc factory', () => {
    it('should create a PartisiaRpc instance', () => {
      const rpc = PartisiaRpc({ shardURL: mockShardUrl, globalURL: mockGlobalUrl })

      expect(rpc).toBeDefined()
      expect(typeof rpc.getTransaction).toBe('function')
      expect(typeof rpc.broadcastTransaction).toBe('function')
    })
  })

  describe('getTransaction', () => {
    it('should return an object with finalized property', async () => {
      const rpc = PartisiaRpc({ shardURL: mockShardUrl, globalURL: mockGlobalUrl })

      const result = await rpc.getTransaction('0000000000000000000000000000000000000000000000000000000000000000')

      expect(result).toBeDefined()
      expect('finalized' in result).toBe(true)
      expect(typeof result.finalized).toBe('boolean')
    })
  })

  describe('broadcastTransaction', () => {
    it('should return a boolean', async () => {
      const rpc = PartisiaRpc({ shardURL: mockShardUrl, globalURL: mockGlobalUrl })

      const result = await rpc.broadcastTransaction('invalid_base64_payload')

      expect(typeof result).toBe('boolean')
    })
  })
})
