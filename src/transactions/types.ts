import { BN } from "@secata-public/bitmanipulation-ts"

export interface Signature {
  r: BN;
  s: BN;
  recoveryParam: number | undefined;
}
