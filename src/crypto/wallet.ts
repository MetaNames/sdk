import { createHash } from "crypto"

export function privateKeyToAccountAddress(privateKey: string): string {
  const keyBuffer = Buffer.from(privateKey.replace(/^0x/, ""), "hex")
  const hash = createHash("sha256").update(keyBuffer).digest()
  return "00" + hash.toString("hex").substring(24)
}
