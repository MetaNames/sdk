// Declare the module here as the types do not exist in the bip32-path package
declare module 'bip32-path' {
    export default class BIPPath {
      private path: number[]

      constructor(path: number[])

      static validatePathArray(path: number[]): boolean
      static validateString(text: string, reqRoot?: boolean): boolean
      static fromPathArray(path: number[]): BIPPath
      static fromString(text: string, reqRoot?: boolean): BIPPath

      toPathArray(): number[];
      toString(noRoot?: boolean, oldStyle?: boolean): string
      inspect(): string
    }
}
