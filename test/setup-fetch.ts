import nodeFetch from 'node-fetch'

if (typeof globalThis.fetch !== 'function') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).fetch = nodeFetch
}
