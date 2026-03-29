import { privateKeyToAccountAddress } from '../../src/crypto/wallet'
import { deriveDigest, getTrxHash } from '../../src/crypto/transaction'

describe('crypto/wallet', () => {
  describe('privateKeyToAccountAddress', () => {
    it('should derive a valid Partisia address from private key', () => {
      const privateKey = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
      const address = privateKeyToAccountAddress(privateKey)

      expect(typeof address).toBe('string')
      expect(address.startsWith('00')).toBe(true)
      expect(address.length).toBe(42)
    })

    it('should handle private key with 0x prefix', () => {
      const privateKeyWithPrefix = '0xa1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
      const privateKeyWithout = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'

      const addressWithPrefix = privateKeyToAccountAddress(privateKeyWithPrefix)
      const addressWithout = privateKeyToAccountAddress(privateKeyWithout)

      expect(addressWithPrefix).toBe(addressWithout)
    })

    it('should produce the same address for the same private key', () => {
      const privateKey = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'

      const address1 = privateKeyToAccountAddress(privateKey)
      const address2 = privateKeyToAccountAddress(privateKey)

      expect(address1).toBe(address2)
    })

    it('should produce different addresses for different private keys', () => {
      const privateKey1 = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
      const privateKey2 = 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3'

      const address1 = privateKeyToAccountAddress(privateKey1)
      const address2 = privateKeyToAccountAddress(privateKey2)

      expect(address1).not.toBe(address2)
    })

    it('should produce valid hex string', () => {
      const privateKey = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
      const address = privateKeyToAccountAddress(privateKey)

      expect(/^00[0-9a-f]{40}$/.test(address)).toBe(true)
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
