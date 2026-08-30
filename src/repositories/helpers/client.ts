const jsonHeaders = {
  Accept: "application/json, text/plain, */*",
}

const jsonBodyHeaders = {
  ...jsonHeaders,
  "Content-Type": "application/json",
}

export type RequestType = "GET" | "POST"

/**
 * Requests that never settle would otherwise pin a retry chain open forever,
 * since `promiseRetry` only advances when the underlying promise settles.
 */
export const DEFAULT_TIMEOUT_MS = 30_000

function buildOptions(method: RequestType, headers: Record<string, string>, signal: AbortSignal, body?: unknown) {
  const result: { method: RequestType, headers: Record<string, string>, signal: AbortSignal, body?: string } = { method, headers, signal }
  if (body !== undefined) result.body = JSON.stringify(body)

  return result
}

export function getRequest<R>(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<R | undefined> {
  return handleFetch(promiseRetry(() => request(url, "GET", jsonHeaders, undefined, timeoutMs)))
}

export function postRequest<R>(url: string, body: unknown, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<R | undefined> {
  return handleFetch(promiseRetry(() => request(url, "POST", jsonBodyHeaders, body, timeoutMs)))
}

/**
 * A reader node under load answers 429 or 503. That answer is not the
 * contract's state, but returning it as `undefined` made every caller report a
 * missing contract: `getAll()` against a busy node surfaced as "Contract not
 * found". Those statuses are retried instead. 404 and the other client errors
 * still fall through to `undefined`, which is how a missing AVL value is
 * reported.
 */
function request(url: string, method: RequestType, headers: Record<string, string>, body: unknown, timeoutMs: number): Promise<Response> {
  return fetchWithTimeout(url, method, headers, body, timeoutMs).then((response) => {
    if (response.status === 429 || response.status >= 500) throw new Error(`${method} ${url} failed with HTTP ${response.status}`)

    return response
  })
}

async function fetchWithTimeout(url: string, method: RequestType, headers: Record<string, string>, body: unknown, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, buildOptions(method, headers, controller.signal, body))
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
