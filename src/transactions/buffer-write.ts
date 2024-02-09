import BN from "bn.js"

/**
 * A class to help serialize data into a buffer
 */
export class BufferWriter {
  private buffer: Buffer

  constructor() {
    this.buffer = Buffer.alloc(0)
  }

  writeIntBE = (int: number): void => {
    const buffer = Buffer.alloc(4)
    buffer.writeInt32BE(int, 0)
    this.appendBuffer(buffer)
  }

  writeLongBE = (long: BN): void => {
    this.writeNumberBE(long, 8)
  }

  writeNumberBE = (num: BN, byteCount: number): void => {
    const buffer = num.toTwos(byteCount * 8).toArrayLike(Buffer, "be", byteCount)
    this.appendBuffer(buffer)
  }

  writeBuffer = (buffer: Buffer): void => {
    this.appendBuffer(buffer)
  }

  writeDynamicBuffer = (buffer: Buffer): void => {
    this.writeIntBE(buffer.length)
    this.writeBuffer(buffer)
  }

  writeHexString = (hex: string): void => {
    this.appendBuffer(Buffer.from(hex, "hex"))
  }

  toBuffer = (): Buffer => {
    const clone = Uint8Array.prototype.slice.call(this.buffer)

    return Buffer.from(clone)
  }

  private appendBuffer = (buffer: Buffer) => {
    this.buffer = Buffer.concat([this.buffer, buffer])
  }
}
