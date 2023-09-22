import { RecordClassEnum, RecordValidator } from "../../src"

test('validation of proper record', () => {
  const record = {
    class: RecordClassEnum.Bio,
    data: 'data'
  }
  const validator = new RecordValidator()
  expect(validator.validate(record)).toBe(true)
})

test('validation of proper record with first class', () => {
  const record = {
    class: 0,
    data: 'data'
  }
  const validator = new RecordValidator()
  expect(validator.validate(record)).toBe(true)
})

test('validation of a record with too long data fails', () => {
  const record = {
    class: RecordClassEnum.Bio,
    data: 'a'.repeat(65)
  }
  const validator = new RecordValidator()
  expect(() => { validator.validate(record) }).toThrow('Record data is too long')
})

test('validation of a record with invalid class fails', () => {
  const record = {
    class: 100,
    data: 'data'
  }
  const validator = new RecordValidator()
  expect(() => { validator.validate(record) }).toThrow('Record class is invalid')
})

