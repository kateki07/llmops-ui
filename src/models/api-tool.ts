import { type BaseResponse, type BasePaginatorResponse } from '@/models/base'

// 获取自定义API插件响应接口
export type GetApiToolProvidersWithPageResponse = BasePaginatorResponse<{
  id: string
  name: string
  icon: string
  description: string
  headers: Array<any>
  tools: Array<any>
  created_at: number
}>

// 新增自定义API插件提供者请求结构
export type CreateApiToolProviderRequest = {
  name: string
  icon: string
  openapi_schema: string
  headers: Array<any>
}

// 更新自定义API工具提供者请求与响应结构
export type UpdateApiToolProviderRequest = {
  name: string
  icon: string
  openapi_schema: string
  headers: Array<any>
}

// 请求头的键值对
export type ApiToolHeader = {
  key: string
  value: string
}

// 获取自定义API工具提供者响应结构体
// 注意要包一层 BaseResponse —— 接口返回的永远是 { code, message, data }
export type GetApiToolProviderResponse = BaseResponse<{
  id: string
  name: string
  icon: string
  openapi_schema: string
  headers: ApiToolHeader[]
  created_at: number
}>
