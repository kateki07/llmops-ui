import { ssePost } from '@/utils/request'

/**
 * 应用预览与调试。
 *
 * 第8周改成流式：不再 await 一个完整回答，而是传一个 onData 回调进去，
 * 后端每吐出一段内容就调用一次，页面上就是打字机效果。
 */
export const debugApp = (
  app_id: string,
  query: string,
  onData: (event_response: { [key: string]: any }) => void,
) => {
  return ssePost(`/apps/${app_id}/debug`, { body: { query } }, onData)
}
