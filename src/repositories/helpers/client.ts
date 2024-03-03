import axios, {AxiosResponse, RawAxiosRequestHeaders} from 'axios'

// axios.interceptors.request.use(request => {
//   console.log('Starting Request', JSON.stringify(request, null, 2))
//   return request
// })

// axios.interceptors.response.use(response => {
//   console.log('Response:', JSON.stringify(response, null, 2))
//   return response
// })

const getHeaders  = {
  Accept: "application/json, text/plain, */*",
}

export type RequestType = "GET"

function buildOptions(method: RequestType, headers: RawAxiosRequestHeaders) {
  const result = { method, headers }

  return result
}

export function getRequest<R>(url: string): Promise<R | undefined> {
  const options = buildOptions("GET", getHeaders)
  return handleFetch(axios.get(url, options))
}

function handleFetch<T>(promise: Promise<AxiosResponse>): Promise<T | undefined> {
  return promise
    .then((response) => {
      if (response.status === 200) return response.data
      else return undefined
    })
}
