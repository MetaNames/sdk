import { sha256 } from "hash.js"
import elliptic from "elliptic"

const secp256k1 = new elliptic.ec("secp256k1")

export function signTransaction(digest: Buffer, privateKey: string): Buffer {
  const key = secp256k1.keyFromPrivate(privateKey.replace(/^0x/, ""), "hex")
  const signature = key.sign(digest, { canonical: true })

  const r = signature.r.toBuffer("be", 32)
  const s = signature.s.toBuffer("be", 32)
  const recoveryParam = Buffer.from([signature.recoveryParam ?? 0])

  return Buffer.concat([recoveryParam, r, s])
}

export function deriveDigest(chainId: string, serializedTransaction: Buffer): Buffer {
  const chainIdBuffer = Buffer.from(chainId, "utf8")
  const lengthBuffer = Buffer.alloc(4)
  lengthBuffer.writeUInt32BE(chainIdBuffer.length)
  const chainIdBytes = Buffer.concat([lengthBuffer, chainIdBuffer])

  const data = Buffer.concat([chainIdBytes, serializedTransaction])

  const hash = sha256()
  hash.update(data)
  return Buffer.from(hash.digest())
}

export function getTrxHash(digest: Buffer, signature: Buffer): string {
  const data = Buffer.concat([digest, signature])
  const hash = sha256()
  hash.update(data)
  return hash.digest("hex")
}

export function getTransactionPayloadData(
  serializedTransaction: Buffer,
  signature: Buffer
): Buffer {
  return Buffer.concat([signature, serializedTransaction])
}
