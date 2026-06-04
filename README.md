# TentaOS Frontend

Vite + React 前端，对接 TentaOS Engine。

## 本地开发

1. 克隆仓库并进入目录
2. 安装依赖：`npm install`
3. 可选：创建 `.env.local` 配置 Engine 地址

```env
VITE_ENGINE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001/ws
```

未配置时默认使用 `https://engine.tentaos.com`，也可在应用 **Settings** 页面修改。

4. 启动：`npm run dev`（默认 http://localhost:3000）

## 部署

见 [DEPLOYMENT.md](./DEPLOYMENT.md)。
