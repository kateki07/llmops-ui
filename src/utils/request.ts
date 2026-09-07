import { apiPrefix } from '@/config'

// 1.超时时间 100s
const TIME_OUT = 100000

// 2.基础配置（注意都是 fetch 规定的小写键名）
const baseFetchOptions: RequestInit = {
  method: 'GET',
  mode: 'cors',
  credentials: 'include',
  headers: new Headers({
    'Content-Type': 'application/json',
  }),
  redirect: 'follow',
}

// 3.fetch 参数类型：在原生 RequestInit 上，允许 body 传对象、并支持 params
type FetchOptionType = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown> | null
  params?: Record<string, unknown>
}

// 4.封装基础的 fetch 请求
const baseFetch = <T>(url: string, fetchOptions: FetchOptionType): Promise<T> => {
  // 5.把默认配置和调用方传的配置合并
  const options: FetchOptionType = Object.assign({}, baseFetchOptions, fetchOptions)

  // 6.组装 url
  let urlWithPrefix = `${apiPrefix}${url.startsWith('/') ? url : `/${url}`}`

  // 7.解构出请求方法、params、body
  const { method, params, body } = options

  // 8.GET 请求且传了 params，就把 params 拼到 url 上
  if (method === 'GET' && params) {
    const paramsArray: string[] = []
    Object.keys(params).forEach((key) => {
      paramsArray.push(`${key}=${encodeURIComponent(String(params[key]))}`)
    })
    if (urlWithPrefix.search(/\?/) === -1) {
      urlWithPrefix += `?${paramsArray.join('&')}`
    } else {
      urlWithPrefix += `&${paramsArray.join('&')}`
    }
    delete options.params
  }

  // 9.body 是对象的话转成 JSON 字符串
  if (body) {
    options.body = JSON.stringify(body)
  }

  // 10.超时和请求赛跑，谁先结束用谁的结果
  return Promise.race([
    // 11.计时器：到点就抛超时
    new Promise((_resolve, reject) => {
      setTimeout(() => {
        reject(new Error('接口已超时'))
      }, TIME_OUT)
    }),
    // 12.真正的请求
    new Promise((resolve, reject) => {
      globalThis
        .fetch(urlWithPrefix, options as RequestInit)
        .then((res) => {
          resolve(res.json())
        })
        .catch((err) => {
          reject(err)
        })
    }),
  ]) as Promise<T>
}

export const get = <T>(url: string, options: FetchOptionType = {}) => {
  return baseFetch<T>(url, { ...options, method: 'GET' })
}

export const post = <T>(url: string, options: FetchOptionType = {}) => {
  return baseFetch<T>(url, { ...options, method: 'POST' })
}

export const request = <T>(url: string, options: FetchOptionType = {}) => {
  return baseFetch<T>(url, options)
}
