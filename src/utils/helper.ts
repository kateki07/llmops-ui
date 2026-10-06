// 将转义的字符修改回原始表达
export const unescapeString = (str: string): string => {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
}

// ─────────────────────────────────────────────────────────────
// ArcoDesign a-upload 的自定义上传
// ─────────────────────────────────────────────────────────────

import type { RequestOption, UploadRequest, FileItem } from '@arco-design/web-vue'

/**
 * 把 a-upload 的上传动作接到我们自己的后端接口上。
 *
 * 为什么要包一层：a-upload 的 :custom-request 要求「同步返回一个 UploadRequest 对象」
 * （里面可以带 abort），而真正的上传是异步的。直接写 async 箭头函数会返回 Promise，
 * 类型过不了。所以这里同步返回一个空对象，异步的活儿在里面自己跑。
 *
 * @param uploader 真正发请求的函数，拿到 File 返回带 url 的响应
 * @param onUrl    上传成功后，把拿到的 url 交给调用方（通常是写进 form.icon）
 */
export const makeCustomRequest = <T>(
  uploader: (file: File) => Promise<T>,
  pickUrl: (resp: T) => string,
  onUrl: (url: string) => void,
) => {
  return (option: RequestOption): UploadRequest => {
    const { fileItem, onSuccess, onError } = option
    void (async () => {
      try {
        const resp = await uploader(fileItem.file as File)
        onUrl(pickUrl(resp))
        onSuccess(resp)
      } catch (e) {
        onError(e)
      }
    })()
    return {}
  }
}

/**
 * a-upload 删除前的回调。
 * 同样是类型问题：:on-before-remove 要求返回 Promise<boolean>，不能是裸 boolean。
 */
export const makeBeforeRemove = (onRemove: () => void) => {
  return async (_fileItem: FileItem): Promise<boolean> => {
    onRemove()
    return true
  }
}
