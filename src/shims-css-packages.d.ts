// github-markdown-css 这类「只有样式、没有 JS」的包不带类型声明，
// 直接 import 'xxx' 做副作用引入时 TS 会报 TS2882。
// 这里补一个空声明，告诉 TS「这个模块存在，没有导出」。
declare module 'github-markdown-css'
