import fetch, { Response } from 'node-fetch'

const getHeaders = {
  Accept: "application/json, text/plain, */*",
}

export type RequestType = "GET"

function buildOptions(method: RequestType, headers: Record<string, string>) {
  const result = { method, headers }

  return result
}

export function getRequest<R>(url: string): Promise<R | undefined> {
  const options = buildOptions("GET", getHeaders)

  return handleFetch(promiseRetry(() => fetch(url, options)))
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
