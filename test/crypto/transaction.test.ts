import { deriveDigest, getTrxHash } from '../../src/crypto/transaction'
import { privateKeyToAccountAddress } from '../../src/crypto/wallet'

describe('crypto/wallet', () => {
  describe('privateKeyToAccountAddress', () => {
    it('should derive account address from private key', () => {
      const privateKey = '0000000000000000000000000000000000000000000000000000000000000001'
      const address = privateKeyToAccountAddress(privateKey)
      expect(address).toBeDefined()
      expect(address.length).toBe(42)
      expect(address.startsWith('00')).toBe(true)
    })

    it('should handle 0x prefix', () => {
      const privateKey = '0x0000000000000000000000000000000000000000000000000000000000000001'
      const address1 = privateKeyToAccountAddress(privateKey)
      const address2 = privateKeyToAccountAddress(privateKey.slice(2))
      expect(address1).toBe(address2)
    })
  })
})

describe('crypto/transaction', () => {
  describe('deriveDigest', () => {
    it('should produce a 32-byte SHA-256 digest', () => {
      const chainId = 'Partisia Blockchain'
      const serializedTx = Buffer.from([0x01, 0x02, 0x03])

      const digest = deriveDigest(chainId, serializedTx)

      expect(digest).toBeInstanceOf(Buffer)
      expect(digest.length).toBe(32)
    })

    it('should produce the same digest for the same inputs', () => {
      const chainId = 'Partisia Blockchain'
      const serializedTx = Buffer.from([0x01, 0x02, 0x03])

      const digest1 = deriveDigest(chainId, serializedTx)
      const digest2 = deriveDigest(chainId, serializedTx)

      expect(digest1.equals(digest2)).toBe(true)
    })

    it('should produce different digests for different chainIds', () => {
      const serializedTx = Buffer.from([0x01, 0x02, 0x03])

      const digest1 = deriveDigest('Partisia Blockchain', serializedTx)
      const digest2 = deriveDigest('Partisia Blockchain Testnet', serializedTx)

      expect(digest1.equals(digest2)).toBe(false)
    })

    it('should produce different digests for different serialized transactions', () => {
      const chainId = 'Partisia Blockchain'

      const digest1 = deriveDigest(chainId, Buffer.from([0x01]))
      const digest2 = deriveDigest(chainId, Buffer.from([0x02]))

      expect(digest1.equals(digest2)).toBe(false)
    })
  })

  describe('getTrxHash', () => {
    it('should produce a 64-char hex string hash', () => {
      const digest = Buffer.alloc(32, 0xab)
      const signature = Buffer.alloc(65, 0xcd)

      const hash = getTrxHash(digest, signature)

      expect(typeof hash).toBe('string')
      expect(hash.length).toBe(64)
    })

    it('should produce the same hash for the same inputs', () => {
      const digest = Buffer.alloc(32, 0xab)
      const signature = Buffer.alloc(65, 0xcd)

      const hash1 = getTrxHash(digest, signature)
      const hash2 = getTrxHash(digest, signature)

      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different signatures', () => {
      const digest = Buffer.alloc(32, 0xab)
      const signature1 = Buffer.alloc(65, 0xcd)
      const signature2 = Buffer.alloc(65, 0xff)

      const hash1 = getTrxHash(digest, signature1)
      const hash2 = getTrxHash(digest, signature2)

      expect(hash1).not.toBe(hash2)
    })
  })
})
