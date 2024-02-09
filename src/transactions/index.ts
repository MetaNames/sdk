import assert from "assert"
import BN from "bn.js"
import crypto from 'crypto'
import { BNInput, ec as Elliptic } from 'elliptic'
import type { PartisiaAccountClass } from 'partisia-blockchain-applications-rpc/lib/main/accountInfo'

import { BufferWriter } from "./buffer-write"

const ec = new Elliptic('secp256k1')
export const TRANSACTION_TTL = 60_000

export interface TransactionHeader {
  nonce: number
  validTo: string
  cost: string
}

export function privateKeyToAccountAddress(privateKey: string) {
  assert(isValidPrivateKey(privateKey), 'invalid private key')
  const publicKey = privateKeyToPublicKey(privateKey)
  return publicKeyToAddress(publicKey)
}

export function signTransaction(data: BNInput, privateKey: string): Buffer {
  const keyPair = privateKeyToKeypair(privateKey)
  const signature = keyPair.sign(data, 'hex', { canonical: true })
  const recoveryParam = signature.recoveryParam
  if (recoveryParam === null) throw new Error('Invalid signature')

  return Buffer.concat([
    Buffer.from([recoveryParam]),
    signature.r.toArrayLike(Buffer, 'be', 32),
    signature.s.toArrayLike(Buffer, 'be', 32),
  ])
}

export function getTransactionPayloadData(serializedTransaction: Buffer, signature: Buffer) {
  // remove chainId buffer to get serialized trx
  assert(signature.length === 65)
  const transactionPayload = Buffer.concat([signature, serializedTransaction])
  return transactionPayload.toString('base64')
}

export function deriveDigest(chainId: string, serializedTransaction: Buffer) {
  const digest = hashBuffers([serializedTransaction, bufFromString(chainId)])
  return digest
}

export function getTrxHash(trxDigest: Buffer, signature: Buffer) {
  return hashBuffers([trxDigest, signature]).toString('hex')
}

/**
 * Serialize a transaction into bytes
 */
export const serializeTransaction = async (
  rpc: PartisiaAccountClass,
  walletAddress: string,
  contractAddress: string,
  payload: Buffer,
  cost: number | string
) => {
  const shardId = rpc.deriveShardId(walletAddress)
  const nonce = await rpc.getNonce(walletAddress, shardId)
  const validTo = String(new Date().getTime() + TRANSACTION_TTL)

  return serialize(
    contractAddress,
    {
      cost: String(cost),
      nonce,
      validTo,
    },
    payload
  )
}

function serialize(
  contractAddress: string,
  header: TransactionHeader,
  payload: Buffer
): Buffer {
  const bufferWriter = new BufferWriter()
  serializeTransactionInner(bufferWriter, header)
  bufferWriter.writeHexString(contractAddress)
  bufferWriter.writeDynamicBuffer(payload)
  return bufferWriter.toBuffer()
}

function serializeTransactionInner(bufferWriter: BufferWriter, inner: TransactionHeader) {
  bufferWriter.writeLongBE(new BN(inner.nonce))
  bufferWriter.writeLongBE(new BN(inner.validTo))
  bufferWriter.writeLongBE(new BN(inner.cost))
}

function hashBuffers(buffers: Buffer[]): Buffer {
  const hash = crypto.createHash('sha256')

  for (const buffer of buffers) {
    hash.update(buffer)
  }

  return Buffer.from(hash.digest())
}

function bufFromString(str: string): Buffer {
  const buf = Buffer.from(str, 'utf8')
  return Buffer.concat([numToBuffer(buf.length, 32).reverse(), buf])
}

function numToBuffer(num: string | number, bytes: number) {
  const numBN = new BN(num)
  const maxSize = new BN(2).pow(new BN(bytes * 8))

  assert(numBN.lt(maxSize), 'number too big')
  assert(bytes % 8 === 0, 'invalid byte number')

  const aryBuf = new Uint8Array(bytes / 8)
  let tmpNum = new BN(numBN)

  for (let i = bytes - 8; i >= 0; i -= 8) {
    const byteValue = tmpNum.shrn(i).and(new BN(255))
    aryBuf[i / 8] = byteValue.toNumber()
    tmpNum = tmpNum.sub(byteValue.shln(i))
  }

  return Buffer.from(aryBuf)
}

function isValidPrivateKey(key: Buffer | string): boolean {
  try {
    const str = typeof key === 'string' ? key : key.toString('hex')
    const buf = typeof key === 'string' ? Buffer.from(key, 'hex') : key
    return buf.length === 32 && str.length === 64 && buf.toString('hex') === str.toLowerCase()
  } catch (error) {
    return false
  }
}

function privateKeyToKeypair(privateKey: string) {
  assert(isValidPrivateKey(privateKey), 'invalid private key')
  const keyPair = ec.keyFromPrivate(privateKey, 'hex')
  return keyPair
}

function privateKeyToPublicKey(privateKey: string, compress: boolean = true) {
  assert(isValidPrivateKey(privateKey), 'invalid private key')
  return Buffer.from(privateKeyToKeypair(privateKey).getPublic(compress, 'array'))
}

function publicKeyToAddress(publicKey: Buffer | string): string {
  const pubBuffer = getPublicKeyBuffer(publicKey)
  assert(pubBuffer.length === 65)
  const hash = createHashSha256(pubBuffer)
  return '00' + hash.toString('hex').substring(24)
}

function getPublicKeyBuffer(publicKey: string | Buffer, compress: boolean = false): Buffer {
  let publicKeyBuf: Buffer = typeof publicKey === 'string' ? Buffer.from(publicKey, 'hex') : publicKey
  if (publicKeyBuf.length !== 65) {
    publicKeyBuf = Buffer.from(ec.keyFromPublic(publicKeyBuf).getPublic(false, 'array'))
  } else {
    assert(publicKeyBuf.length === 65, 'public key must be in uncompressed format')
  }
  return Buffer.from(ec.keyFromPublic(publicKeyBuf).getPublic(compress, 'array'))
}

function createHashSha256(data: Buffer | string): Buffer {
  let buf: Buffer
  if (typeof data == 'string') {
    buf = Buffer.from(data, 'hex')
  } else {
    buf = data
  }
  return crypto
    .createHash('sha256')
    .update(buf)
    .digest()
}
