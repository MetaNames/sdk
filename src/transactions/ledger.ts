import { BN } from "@secata-public/bitmanipulation-ts"
// @ts-ignore - no types available
import BIPPath from 'bip32-path'
import type Transport from "@ledgerhq/hw-transport"
import { Signature } from "./types"

// Mainly extracted from https://gitlab.com/partisiablockchain/language/example-web-client/-/blob/main/src/main/pbc-ledger-client/PbcLedgerClient.ts

/**
 * Serializes a BIP-32 path to a buffer.
 */
export function bip32Buffer(path: string): Buffer {
  // Bip format to numbers

  const pathElements: number[] = BIPPath.fromString(path).toPathArray()
  const buffer = Buffer.alloc(1 + pathElements.length * 4)
  buffer[0] = pathElements.length
  pathElements.forEach((pathElement, pathIdx) => {
    buffer.writeUInt32BE(pathElement, 1 + 4 * pathIdx)
  })
  return buffer
}

/**
 * Serializes a number as an unsigned 32-bit integer as a buffer.
 */
function uint32BeBuffer(v: number): Buffer {
  const buffer = Buffer.alloc(4)
  buffer.writeUInt32BE(v, 0)
  return buffer
}

/**
 * The maximum length of each APDU packets to send to the Ledger device.
 *
 * @see https://en.wikipedia.org/wiki/Smart_card_application_protocol_data_unit
 */
const MAX_APDU_DATA_LENGTH = 255

/**
 * Instruction class for the PBC App.
 *
 * @see https://en.wikipedia.org/wiki/Smart_card_application_protocol_data_unit
 */
const CLA = 0xe0

/**
 * Instructions for the PBC App.
 *
 * @see https://en.wikipedia.org/wiki/Smart_card_application_protocol_data_unit
 */
enum INS {
  GET_VERSION = 0x03,
  GET_APP_NAME = 0x04,
  SIGN_TRANSACTION = 0x06,
  GET_ADDRESS = 0x07,
}

/**
 * First parameters for the PBC App.
 *
 * @see https://en.wikipedia.org/wiki/Smart_card_application_protocol_data_unit
 */
enum P1 {
  P1_FIRST_CHUNK = 0x00,
  P1_NOT_FIRST_CHUNK = 0x01,
}

const P1_CONFIRM_ADDRESS_ON_SCREEN = 0x01

/**
 * Second parameters for the PBC App.
 *
 * @see https://en.wikipedia.org/wiki/Smart_card_application_protocol_data_unit
 */
enum P2 {
  P2_LAST_CHUNK = 0x00,
  P2_NOT_LAST_CHUNK = 0x80,
}

/**
 * Splits the given buffer into chunks of at most chunkSize.
 */
export function chunkifyBuffer(buffer: Buffer, chunkSize: number): Buffer[] {
  const chunks: Buffer[] = []
  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.slice(i, Math.min(buffer.length, i + chunkSize)))
  }
  return chunks
}

/**
 * Serializes a signature into byte.
 *
 * @param signature the signature.
 * @return the bytes.
 */
export function signatureToBuffer(signature: Signature): Buffer {
  if (signature.recoveryParam == null) {
    throw new Error("Recovery parameter is null")
  }
  return Buffer.concat([
    Buffer.from([signature.recoveryParam]),
    signature.r.toArrayLike(Buffer, "be", 32),
    signature.s.toArrayLike(Buffer, "be", 32),
  ])
}


export const DEFAULT_KEYPATH = "44'/3757'/0'/0/0"

/**
 * Wrapper class capable of interacting with the Ledger hardware wallet through
 * APDU calls.
 */
export class PartisiaLedgerClient {
  private readonly ledgerTransport: Transport

  constructor(ledgerTransport: Transport) {
    this.ledgerTransport = ledgerTransport
  }

  /**
   * Asks the Ledger hardware wallet about the address that it will sign for.
   */
  public getAddress(keyPath: string = DEFAULT_KEYPATH, confirmOnScreen = false): Promise<string> {
    return this.ledgerTransport
      .send(
        CLA,
        INS.GET_ADDRESS,
        confirmOnScreen ? P1_CONFIRM_ADDRESS_ON_SCREEN : P1.P1_FIRST_CHUNK,
        P2.P2_LAST_CHUNK,
        bip32Buffer(keyPath)
      )
      .then((result) => result.slice(0, 21).toString("hex"))
  }

  /**
   * Attempts to sign a transaction by communicating with a Ledger hardware
   * wallet.
   *
   * Returns a signature as a promised buffer.
   */
  public async signTransaction(
    serializedTransaction: Buffer,
    chainId: string,
    keyPath: string = DEFAULT_KEYPATH,
  ): Promise<Signature> {
    const chainIdBuffer = Buffer.from(chainId, "utf8")

    // Setup data to send
    const initialChunkData = Buffer.concat([
      bip32Buffer(keyPath),
      uint32BeBuffer(chainIdBuffer.length),
      chainIdBuffer,
    ])

    const subsequentChunkData = chunkifyBuffer(serializedTransaction, MAX_APDU_DATA_LENGTH)

    // Setup promise flow
    let result = await this.ledgerTransport.send(
      CLA,
      INS.SIGN_TRANSACTION,
      P1.P1_FIRST_CHUNK,
      P2.P2_NOT_LAST_CHUNK,
      initialChunkData
    )

    // Iterate blocks
    for (let chunkIdx = 0; chunkIdx < subsequentChunkData.length; chunkIdx++) {
      const chunk = subsequentChunkData[chunkIdx]
      const isLastChunk = chunkIdx == subsequentChunkData.length - 1
      result = await this.ledgerTransport.send(
        CLA,
        INS.SIGN_TRANSACTION,
        P1.P1_NOT_FIRST_CHUNK,
        isLastChunk ? P2.P2_LAST_CHUNK : P2.P2_NOT_LAST_CHUNK,
        chunk
      )
    }

    // Deserialize signature from the transfer format
    return {
      recoveryParam: result[0],
      r: new BN(result.subarray(1, 32 + 1)),
      s: new BN(result.subarray(32 + 1, 32 + 32 + 1)),
    }
  }
}


