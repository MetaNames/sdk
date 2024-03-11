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

  return handleFetch(fetch(url, options))
}

async function handleFetch<T>(promise: Promise<Response>): Promise<T | undefined> {
  const response = await promise

  if (response.status === 200) return response.json() as unknown as T
  else return undefined
}
