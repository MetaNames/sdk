import type { PartisiaSdk } from '../../src/types/partisia-sdk'

describe('types/partisia-sdk', () => {
  describe('PartisiaSdk interface', () => {
    it('should allow creating an object that satisfies the interface', () => {
      const mockPartisiaSdk: PartisiaSdk = {
        connection: {
          account: {
            address: '00373c68dfed999aec39063194e2d3e0870f9899fa',
          },
        },
        async signMessage(params) {
          expect(params.payload).toBeDefined()
          expect(params.payloadType).toBeDefined()
          expect(typeof params.dontBroadcast).toBe('boolean')
          return { trxHash: 'abc123' }
        },
      }

      expect(mockPartisiaSdk.connection?.account.address).toBe('00373c68dfed999aec39063194e2d3e0870f9899fa')
    })

    it('should allow undefined connection', () => {
      const mockPartisiaSdk: PartisiaSdk = {
        connection: undefined,
        async signMessage() {
          return { trxHash: 'abc123' }
        },
      }

      expect(mockPartisiaSdk.connection).toBeUndefined()
    })

    it('should require signMessage to be async', async () => {
      const mockPartisiaSdk: PartisiaSdk = {
        connection: undefined,
        async signMessage() {
          return { trxHash: 'abc123' }
        },
      }

      const result = await mockPartisiaSdk.signMessage({
        payload: 'abc',
        payloadType: 'hex',
        dontBroadcast: false,
      })

      expect(result.trxHash).toBe('abc123')
    })
  })
})
