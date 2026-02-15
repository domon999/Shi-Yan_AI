# 项目概览

## 简介

这是一个基于 Next.js 15 构建的 AI API 测试平台，集成了多个视频生成和语音合成 API。

## 技术栈

- **框架**: Next.js 15 + React 19
- **样式**: Tailwind CSS v4
- **UI 组件**: shadcn/ui
- **部署**: Vercel
- **存储**: Vercel Blob
- **语言**: TypeScript

## 功能模块

### 1. VEO 视频生成 (`/veo_kg`)
- 支持多种 VEO 模型（VEO 2/3/3.1 系列）
- 文本生成视频
- 图片参考生成视频
- 首尾帧控制
- 横竖屏选择
- 实时任务状态监控

### 2. Grok 10秒视频 (`/grok-10s`)
- 基于 Grok API 的快速视频生成
- 支持多种宽高比（2:3、3:2、1:1）
- 参考图片上传
- 任务轮询和状态追踪

### 3. MiniMax 语音合成 (`/minimax1`)
- 同步语音合成（实时生成）
- 异步语音合成（长文本）
- 音色快速复刻
- 系统音色列表
- 实时积分消耗预估

## 项目结构

```
/app
  /page.tsx                 # 首页导航
  /veo_kg/page.tsx         # VEO 视频生成页面
  /grok-10s/page.tsx       # Grok 视频页面
  /minimax1/page.tsx       # MiniMax 语音合成页面
  /api
    /veo                   # VEO API 路由
    /grok                  # Grok API 路由
    /minimax              # MiniMax API 路由
/components/ui            # shadcn/ui 组件
/lib                      # 工具函数
```

## 环境变量

需要在 Vercel 项目中设置以下环境变量：

- `VEO_API_KEY` - VEO API 密钥
- `MINIMAX_API_KEY` - MiniMax API 密钥（可选，可在页面输入）

## 快速开始

1. 克隆仓库
2. 安装依赖：`npm install` 或 `pnpm install`
3. 配置环境变量
4. 运行开发服务器：`npm run dev`
5. 访问 `http://localhost:3000`

## 部署

项目已配置自动部署到 Vercel：
- 推送到主分支自动触发部署
- 支持预览部署（Pull Request）

## 文档

- [MiniMax 语音合成完整指南](./MINIMAX1_COMPLETE_GUIDE.md)
- [MiniMax 错误解决方案](./MINIMAX1_ERROR_SOLUTION.md)

## API 文档

所有 API 路由都遵循 RESTful 规范：
- POST 请求用于创建资源
- GET 请求用于查询资源
- 通过请求头传递 API Key（`X-API-Key`）

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可

MIT License

---

**更新日期**: 2026-02-15
