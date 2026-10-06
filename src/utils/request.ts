import { Message } from '@arco-design/web-vue'
import { apiPrefix, httpCode } from '@/config'

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
        .then(async (res) => {
          const json = await res.json()
          if (json.code === httpCode.success) {
            resolve(json)
          } else {
            // 业务失败：弹一个提示，同时把错误抛给调用方
            Message.error(json.message)
            reject(new Error(json.message))
          }
        })
        .catch((err) => {
          // 网络层失败（连不上、超时、CORS 等）
          Message.error(err.message)
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

// ─────────────────────────────────────────────────────────────
// 第8周：流式响应（SSE）与文件上传
// ─────────────────────────────────────────────────────────────

// 一次流式事件的形状：event = 事件名，data = 后端 json.dumps 出来的内容
export type SSEEvent = { [key: string]: any }

/**
 * 发一个 POST 请求，但响应不是一次性的 JSON，而是一条条往下推的事件流。
 *
 * 和普通 post 的区别：普通 post 要 await 到整个响应体才 resolve；
 * 这里拿到的是一个「还在往外吐字」的流，每吐出一个完整事件就回调一次 onData。
 * 这就是打字机效果的来源 —— 不是前端装的动画，是后端真的在一个字一个字地发。
 */
export const ssePost = async (
  url: string,
  fetchOptions: FetchOptionType,
  onData: (data: SSEEvent) => void,
) => {
  // 1.组装配置，SSE 固定用 POST
  const options: FetchOptionType = Object.assign({}, baseFetchOptions, { method: 'POST' }, fetchOptions)

  // 2.组装请求 URL
  const urlWithPrefix = `${apiPrefix}${url.startsWith('/') ? url : `/${url}`}`

  // 3.body 是对象的话转成 JSON 字符串
  const { body } = fetchOptions
  if (body) options.body = JSON.stringify(body)

  // 4.发起请求，然后交给 handleStream 一段段读
  const response = await globalThis.fetch(urlWithPrefix, options as RequestInit)
  return handleStream(response, onData)
}

/**
 * 读取 SSE 响应流。
 *
 * SSE 的报文格式是固定的三行一组：
 *     event: agent_message
 *     data: {"id": "...", "data": "你"}
 *     （空行 —— 这一组结束）
 *
 * 关键点：网络包的切分和「行」的切分完全没关系，一个 data: 行可能被切成两半分两次到。
 * 所以必须用 buffer 攒着，每次只处理「已经完整的行」，最后一行（可能是半截）留着下次拼。
 */
const handleStream = (response: Response, onData: (data: SSEEvent) => void) => {
  // 1.检测网络请求是否正常
  if (!response.ok) throw new Error('网络请求失败')

  // 2.构建 reader 与 decoder（stream: true 表示可能有被切断的多字节字符，先攒着）
  const reader = response.body?.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  // 3.递归读取
  const read = () => {
    let hasError = false
    reader?.read().then((result) => {
      if (result.done) return

      buffer += decoder.decode(result.value, { stream: true })
      const lines = buffer.split('\n')

      let event = ''
      let data = ''

      try {
        lines.forEach((line) => {
          line = line.trim()
          if (line.startsWith('event:')) {
            event = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            data = line.slice(5).trim()
          }

          // 空行代表一组事件结束；event 和 data 都齐了才算拿到一次完整事件
          if (line === '') {
            if (event !== '' && data !== '') {
              onData({ event, data: JSON.parse(data) })
              event = ''
              data = ''
            }
          }
        })
        // 最后一行可能是被切断的半截，留到下一次 read 再拼
        buffer = lines.pop() || ''
      } catch (e) {
        hasError = true
      }

      if (!hasError) read()
    })
  }

  // 4.启动读取
  read()
}

// 文件上传的配置：用 xhr 而不是 fetch，是因为只有 xhr 能拿到上传进度
type UploadOptions = {
  method?: string
  url?: string
  headers?: Record<string, string>
  data?: FormData | Document | null
  onprogress?: (ev: ProgressEvent) => void
}

export const upload = <T>(url: string, options: UploadOptions = {}): Promise<T> => {
  // 1.组装请求 URL
  const urlWithPrefix = `${apiPrefix}${url.startsWith('/') ? url : `/${url}`}`

  // 2.合并配置
  const defaultOptions: UploadOptions = {
    method: 'POST',
    url: urlWithPrefix,
    headers: {},
    data: null,
  }
  const merged: UploadOptions = {
    ...defaultOptions,
    ...options,
    headers: { ...defaultOptions.headers, ...options.headers },
  }

  // 3.用 xhr 完成上传
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.open(merged.method as string, merged.url as string)
    for (const [key, value] of Object.entries(merged.headers ?? {})) {
      xhr.setRequestHeader(key, value)
    }

    // 携带授权凭证（例如 cookie），响应直接按 json 解析
    xhr.withCredentials = true
    xhr.responseType = 'json'

    xhr.onreadystatechange = () => {
      // readyState === 4 表示传输完成（成功和失败都算）
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(xhr.response)
        } else {
          reject(xhr)
        }
      }
    }

    if (merged.onprogress) xhr.upload.onprogress = merged.onprogress

    xhr.send(merged.data)
  })
}
