const getHeaders = {
  Accept: "application/json, text/plain, */*",
}

export type RequestType = "GET"

/**
 * Requests that never settle would otherwise pin a retry chain open forever,
 * since `promiseRetry` only advances when the underlying promise settles.
 */
export const DEFAULT_TIMEOUT_MS = 30_000

function buildOptions(method: RequestType, headers: Record<string, string>, signal: AbortSignal) {
  const result = { method, headers, signal }

  return result
}

export function getRequest<R>(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<R | undefined> {
  return handleFetch(promiseRetry(() => fetchWithTimeout(url, timeoutMs)))
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, buildOptions("GET", getHeaders, controller.signal))
  } finally {
    clearTimeout(timer)
  }
}

async function handleFetch<T>(promise: Promise<Response>): Promise<T | undefined> {
  const response = await promise

  if (response.status === 200) return response.json() as unknown as T
  else return undefined
}

export async function promiseRetry<T>(fn: () => Promise<T>, retries = 10, err?: unknown): Promise<T> {
  await new Promise(resolve => setTimeout(resolve, (10 - retries) * 300))

  return !retries ? Promise.reject(err) : fn().catch(error => promiseRetry(fn, (retries - 1), error))
}
