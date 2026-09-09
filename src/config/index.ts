// api 请求接口前缀
export const apiPrefix: string = 'http://localhost:5000'

// 业务状态码（和后端 pkg/response/http_code.py 里的 HttpCode 一一对应）
export const httpCode = {
  success: 'success',
  fail: 'fail',
  notFound: 'not_found',
  unauthorized: 'unauthorized',
  forbidden: 'forbidden',
  validateError: 'validate_error',
}
