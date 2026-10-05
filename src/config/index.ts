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

// 插件参数的类型字符串 -> 中文显示名
// 后端返回的是 "str" / "int" 这类，页面上要显示中文
export const typeMap: { [key: string]: string } = {
  str: '字符串',
  int: '整型',
  float: '浮点型',
  bool: '布尔值',
}
