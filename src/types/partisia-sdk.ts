export interface PartisiaSdkConnection {
  account: {
    address: string
  }
}

export interface PartisiaSdk {
  connection?: PartisiaSdkConnection
  signMessage(params: {
    payload: string
    payloadType: string
    dontBroadcast: boolean
  }): Promise<{
    trxHash: string
  }>
}

export default PartisiaSdk
