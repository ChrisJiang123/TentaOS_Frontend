# 部署到 Vercel（Vite + React）

本项目是 **Vite + React SPA**，部署到 Vercel 时需要配置 **SPA rewrite**，并通过 **VITE_ 前缀环境变量**指向公网 Engine。

## 1) Vercel 环境变量

在 Vercel 项目里（Production / Preview / Development 视需要分别配置）添加：

- `VITE_ENGINE_URL=https://engine.tentaos.com`
- `VITE_WS_URL=wss://engine.tentaos.com/ws`

注意：修改环境变量后必须 **重新 Deploy** 才会生效。

## 2) 构建设置

- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## 3) SPA 路由刷新 404（React Router）

已在项目根目录提供 `vercel.json`：

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

用于避免刷新 `/dashboard` 这类前端路由时返回 404。

