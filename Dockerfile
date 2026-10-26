# 使用官方 Node.js 镜像作为基础镜像
FROM node:20 as builder

# 设置工作目录
WORKDIR /app/web

# 先只拷依赖清单，让这一层能命中 Docker 缓存：
# 只要 package.json / package-lock.json 没变，下面的 npm ci 就不用重跑
COPY package.json .
COPY package-lock.json .

# 用 npm ci 而不是 npm install：严格按 lock 文件装，构建结果可复现
# （本项目统一用 npm，不用 yarn —— 见仓库根的 .gitignore）
RUN npm ci

# 将项目代码拷贝到容器中
COPY . .

# 配置环境变量。这里给的是默认值，实际部署时用
#   docker build --build-arg / docker compose 的 environment 覆盖
ENV VITE_API_PREFIX=http://localhost:5000

# 构建/编译项目
RUN npm run build-only

# 二阶段使用 Nginx 来部署 Vue 静态页面
FROM nginx:alpine as production
COPY --from=builder /app/web/dist /usr/share/nginx/html
COPY --from=builder /app/web/docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 设置目录权限为 755，确保 Nginx 可以访问目录
RUN find /usr/share/nginx/html -type d -exec chmod 755 {} \;

# 设置文件权限为 644，确保文件可以读但不可执行
RUN find /usr/share/nginx/html -type f -exec chmod 644 {} \;

# 暴露 80 端口号
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
