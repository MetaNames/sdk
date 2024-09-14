import { IValidatorOptions } from "../interface"

export abstract class BaseValidator {
  #errors: string[] = []

  hasErrors() {
    return this.#errors.length > 0
  }

  getErrors() {
    return this.#errors
  }

  protected addError(error: string) {
    this.#errors.push(error)
  }

  protected clearErrors() {
    this.#errors = []
  }

  protected raiseErrors() {
    if (this.#errors.length > 0) throw new Error(this.getErrors().join(', '))
  }

  abstract get rules(): Record<string, unknown>
  abstract validate(record: unknown, options?: IValidatorOptions): boolean
  abstract normalize(record: unknown, options?: IValidatorOptions): unknown
}
