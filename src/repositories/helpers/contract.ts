import { BN, ScValueStruct } from "@partisiablockchain/abi-client"
import { AvlTree } from "../../interface"

export const convertAvlTree = (avlTrees: AvlTree[]) => {
  const avlTreeMap = new Map<number, [Buffer, Buffer][]>()

  for (const tree of avlTrees) {
    const buffers: [Buffer, Buffer][] = tree.value.avlTree.map(obj => [
      Buffer.from(obj.key.data.data, 'base64'),
      Buffer.from(obj.value.data, 'base64')
    ])
    avlTreeMap.set(tree.key, buffers)
  }

  return avlTreeMap
}

export const getFeesLabel = (fees: BN, decimals: BN) => {
  // Convert both numbers to strings
  let strDividend = fees.toString()
  let strDivisor = decimals.toString()

  // Determine the minimum number of trailing zeros in both numbers
  const minTrailingZeros = Math.min(
    strDividend.length - strDividend.replace(/0+$/, '').length,
    strDivisor.length - strDivisor.replace(/0+$/, '').length
  )

  // Remove the common trailing zeros
  if (minTrailingZeros > 0) {
    strDividend = strDividend.slice(0, -minTrailingZeros)
    strDivisor = strDivisor.slice(0, -minTrailingZeros)
  }

  // Check if numbers are within safe integer range for JavaScript
  const numDividend = Number(strDividend)
  const numDivisor = Number(strDivisor)
  if (Number.isSafeInteger(numDividend) && Number.isSafeInteger(numDivisor) && numDivisor !== 0) {
    // Perform the division directly if safe
    return numDividend / numDivisor
  } else {
    // Handle as strings or use a big number library if needed
    console.log("Fee label may not be accurate due to size")
    return parseFloat(strDividend) / parseFloat(strDivisor)
  }
}

export const getAddressFromProxyContractState = (state: ScValueStruct) => {
  const addressValue = state.fieldsMap.get('address')
  if (!addressValue) throw new Error('Address not found')

  return addressValue.addressValue().value.toString('hex')
}
