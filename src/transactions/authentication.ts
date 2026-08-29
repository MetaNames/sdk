import type LedgerTransport from "@ledgerhq/hw-transport"
import type PartisiaSdk from "partisia-blockchain-applications-sdk"
import type { SenderAuthentication } from "@partisiablockchain/blockchain-api-transaction-client"
import type { MetaMaskSdk } from "../interface"
import assert from "assert"

/**
 * A signing backend, expressed as the official client's `SenderAuthentication`.
 *
 * `SignedTransaction.create` serializes the transaction and hands the bytes to
 * `sign`, so each strategy only has to answer two questions: which address is
 * signing, and what is the signature over these bytes. Everything the four
 * strategies used to repeat -- serializing, digesting, concatenating, encoding
 * -- happens once, inside the official client.
 */
export interface SigningBackend {
  authentication: SenderAuthentication
  /**
   * Interactive signers prompt the user on every signature. A rejected
   * broadcast must not silently ask them to confirm again, so these are not
   * retried.
   */
  interactive: boolean
}

const SNAP_ID = "npm:@partisiablockchain/snap"

/**
 * The backends are loaded on demand. `@partisiablockchain/blockchain-api-transaction-client`
 * carries elliptic and hash.js; the Ledger backend adds the `@ledgerhq`
 * transport. Reading contract state reaches none of this.
 */
export const privateKeyBackend = async (privateKey: string): Promise<SigningBackend> => {
  const { SenderAuthenticationKeyPair } = await import("@partisiablockchain/blockchain-api-transaction-client")

  return {
    authentication: SenderAuthenticationKeyPair.fromString(privateKey),
    interactive: false,
  }
}

export const ledgerBackend = async (transport: LedgerTransport): Promise<SigningBackend> => {
  const { PartisiaLedgerClient, signatureToBuffer } = await import("./ledger")

  const client = new PartisiaLedgerClient(transport)
  // `getAddress` is synchronous on `SenderAuthentication`, and asking the
  // device costs a round trip, so it is resolved once here.
  const address = await client.getAddress()

  return {
    authentication: {
      getAddress: () => address,
      sign: async (transactionPayload, chainId) => {
        const signature = await client.signTransaction(transactionPayload, chainId)

        return signatureToBuffer(signature).toString("hex")
      },
    },
    interactive: true,
  }
}

export const metaMaskBackend = async (client: MetaMaskSdk): Promise<SigningBackend> => {
  const address: string = await client.request({
    method: "wallet_invokeSnap",
    params: { snapId: SNAP_ID, request: { method: "get_address" } },
  })

  return {
    authentication: {
      getAddress: () => address,
      sign: async (transactionPayload, chainId) => {
        const signature: string = await client.request({
          method: "wallet_invokeSnap",
          params: {
            snapId: SNAP_ID,
            request: {
              method: "sign_transaction",
              params: { payload: transactionPayload.toString("hex"), chainId },
            },
          },
        })
        assert(Buffer.from(signature, "hex").length === 65)

        return signature
      },
    },
    interactive: true,
  }
}

export const partisiaSdkBackend = (client: PartisiaSdk): SigningBackend => {
  if (!client.connection) throw new Error('Client is not connected')

  const address = client.connection.account.address

  return {
    authentication: {
      getAddress: () => address,
      sign: async (transactionPayload) => {
        // `dontBroadcast` keeps the wallet from sending the transaction itself:
        // the SDK broadcasts every strategy the same way, through the reader
        // node, so the result is polled the same way too.
        const { signature } = await client.signMessage({
          payload: transactionPayload.toString("hex"),
          payloadType: "hex",
          dontBroadcast: true,
        })

        return signature
      },
    },
    interactive: true,
  }
}
