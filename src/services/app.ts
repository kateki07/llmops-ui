import { post } from '@/utils/request'
import type { DebugAppResponse } from '@/models/app'

// 应用预览与调试
export const debugApp = (app_id: string, query: string) => {
  return post<DebugAppResponse>(`/app/${app_id}/debug`, {
    body: { query },
  })
}
