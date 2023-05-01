import { namehash } from '../src/namehash'

// TODO: Test normalize function

test('namehash of name.meta', () => {
  const domain = 'name.meta'
  const hash = namehash(domain)

  expect(hash!.length).toBe(64 + 2)
  expect(hash).toBe('0x5c3a07fd5f0f5410e00a902c87ca5376737651290e5e3e5c8b4a110de6f6c12b')
})

test('namehash of sub.name.meta', () => {
  const domain = 'sub.name.meta'
  const hash = namehash(domain)

  expect(hash!.length).toBe(64 + 2)
  expect(hash).toBe('0xe3f6ec2befcfb21edeffbb9ec73f4d89a4df1474739e958469e352c531bd8d93')
})
