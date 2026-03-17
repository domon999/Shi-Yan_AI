# Gemini 图片生成 /banana 页面复刻技术文档

## 项目概述

本文档详细描述如何复刻 `/banana` 页面的 Gemini 图片生成功能，包含完整的 API 接口实现、前端代码和常见问题解决方案。

**功能特性**：
- 文本生成图片（Text-to-Image）
- 参考图片编辑（Image-to-Image）
- 宽高比控制（1:1, 16:9, 9:16, 4:3, 3:4）
- 多模型支持（gemini-2.5-flash-image-preview, gemini-2.5-flash-image, gemini-3-pro-image-preview）

---

## 技术栈

- **前端框架**：Next.js 14+ (App Router)
- **UI 组件**：shadcn/ui + Tailwind CSS
- **API**：Google Gemini Image Generation API（通过 api.kuai.host 代理）
- **语言**：TypeScript

---

## 文件结构

```
app/
├── banana/
│   └── page.tsx          # 前端页面组件
└── api/
    └── banana/
        └── generate/
            └── route.ts  # 后端 API 路由
```

---

## 核心 API 接口实现

### 1. API 端点信息

| 模型 | 端点 URL | 特性 |
|------|---------|------|
| `gemini-2.5-flash-image-preview` | `https://api.kuai.host/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key={API_KEY}` | 纯文生图，不支持参考图 |
| `gemini-2.5-flash-image` | `https://api.kuai.host/v1beta/models/gemini-2.5-flash-image:generateContent?key={API_KEY}` | 支持参考图编辑 + 宽高比控制 |
| `gemini-3-pro-image-preview` | `https://api.kuai.host/v1beta/models/gemini-3-pro-image-preview:generateContent?key={API_KEY}` | 高清图片 + 宽高比 + 清晰度控制 |

### 2. 请求方法

**HTTP Method**: `POST`

**Content-Type**: `application/json`

### 3. 请求体结构

#### 3.1 纯文本生成图片（无参考图）

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        { "text": "a beautiful sunset over the ocean with vibrant colors" }
      ]
    }
  ],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"]
  }
}
```

#### 3.2 带参考图片的生成

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        { "text": "将这张图片转换为油画风格" },
        {
          "inline_data": {
            "mime_type": "image/jpeg",
            "data": "BASE64_ENCODED_IMAGE_DATA"
          }
        }
      ]
    }
  ],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"]
  }
}
```

#### 3.3 带宽高比控制的生成

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        { "text": "a futuristic city skyline at night" }
      ]
    }
  ],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"],
    "imageConfig": {
      "aspectRatio": "16:9"
    }
  }
}
```

### 4. 响应体结构

**成功响应**：

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "inlineData": {
              "mimeType": "image/png",
              "data": "BASE64_ENCODED_IMAGE_DATA"
            }
          },
          {
            "text": "I've generated the image for you..."
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP"
    }
  ]
}
```

**错误响应**：

```json
{
  "error": {
    "code": 400,
    "message": "Invalid request",
    "status": "INVALID_ARGUMENT"
  }
}
```

---

## 完整后端 API 代码

### `/app/api/banana/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey, model, prompt, aspectRatio, refImage, refImageMime } = body

    // 参数验证
    if (!apiKey) {
      return NextResponse.json({ message: '请提供 API Key' }, { status: 401 })
    }
    if (!prompt) {
      return NextResponse.json({ message: '请提供提示词' }, { status: 400 })
    }

    // 构建 parts 数组
    const parts: any[] = [{ text: prompt }]

    // 如果有参考图片，添加到 parts
    if (refImage) {
      parts.push({
        inline_data: {
          mime_type: refImageMime || 'image/jpeg',
          data: refImage, // Base64 编码的图片数据（不含 data:xxx;base64, 前缀）
        },
      })
    }

    // 构建 generationConfig
    const generationConfig: any = {
      responseModalities: ['TEXT', 'IMAGE'],
    }

    // 如果支持宽高比且有传入，添加 imageConfig
    if (aspectRatio) {
      generationConfig.imageConfig = {
        aspectRatio,
      }
    }

    // 构建完整请求体
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      generationConfig,
    }

    // 调用 Gemini API
    const url = `https://api.kuai.host/v1beta/models/${model}:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()

    // 错误处理
    if (!response.ok) {
      return NextResponse.json(
        { message: data?.error?.message || '调用 Gemini API 失败', detail: data },
        { status: response.status }
      )
    }

    // 解析响应：提取图片和文本
    let imageBase64: string | null = null
    let text: string | null = null

    const candidates = data?.candidates || []
    for (const candidate of candidates) {
      const contentParts = candidate?.content?.parts || []
      for (const part of contentParts) {
        if (part.inlineData?.data) {
          imageBase64 = part.inlineData.data
        }
        if (part.text) {
          text = part.text
        }
      }
    }

    // 如果没有找到图片
    if (!imageBase64) {
      return NextResponse.json(
        { message: '未能从响应中提取图片', text, rawResponse: data },
        { status: 200 }
      )
    }

    // 返回成功结果
    return NextResponse.json({ imageBase64, text })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}
```

---

## 前端调用示例

### 基础调用

```typescript
const response = await fetch('/api/banana/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: 'your-api-key',
    model: 'gemini-2.5-flash-image-preview',
    prompt: '一只可爱的橘猫在阳光下打盹',
  }),
})

const data = await response.json()

if (data.imageBase64) {
  // 显示图片
  const imageUrl = `data:image/png;base64,${data.imageBase64}`
  document.getElementById('result').src = imageUrl
}
```

### 带参考图片调用

```typescript
// 将图片文件转换为 Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      // 移除 data:xxx;base64, 前缀，只保留 Base64 数据
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.readAsDataURL(file)
  })
}

// 调用 API
const refImageBase64 = await fileToBase64(selectedFile)

const response = await fetch('/api/banana/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: 'your-api-key',
    model: 'gemini-2.5-flash-image',
    prompt: '将这张图片转换为水彩画风格',
    aspectRatio: '1:1',
    refImage: refImageBase64,
    refImageMime: 'image/jpeg',
  }),
})
```

---

## 模型对比

| 模型 | 支持参考图 | 支持宽高比 | 生成质量 | 速度 |
|------|-----------|-----------|---------|------|
| `gemini-2.5-flash-image-preview` | 否 | 否 | 中等 | 快 |
| `gemini-2.5-flash-image` | 是 | 是 | 中等 | 快 |
| `gemini-3-pro-image-preview` | 是 | 是 | 高 | 中等 |

---

## 常见错误和解决方案

### 错误 1: API Key 无效

**错误信息**：
```json
{
  "error": {
    "code": 401,
    "message": "API key not valid"
  }
}
```

**解决方案**：
- 检查 API Key 是否正确
- 确认 API Key 是否已激活
- 检查是否有足够的配额

### 错误 2: 响应中没有图片

**错误信息**：
```json
{
  "message": "未能从响应中提取图片",
  "text": "I cannot generate images..."
}
```

**原因**：
- 提示词可能触发了内容安全过滤
- 模型可能无法理解请求

**解决方案**：
- 修改提示词，避免敏感内容
- 使用更具体的描述

### 错误 3: 参考图片格式错误

**错误信息**：
```json
{
  "error": {
    "message": "Invalid inline data"
  }
}
```

**解决方案**：
- 确保 Base64 数据不包含 `data:xxx;base64,` 前缀
- 确保 `mime_type` 与实际图片格式匹配
- 支持的格式：`image/jpeg`, `image/png`, `image/webp`

### 错误 4: 宽高比无效

**错误信息**：
```json
{
  "error": {
    "message": "Invalid aspect ratio"
  }
}
```

**解决方案**：
- 仅使用支持的宽高比：`1:1`, `16:9`, `9:16`, `4:3`, `3:4`
- 确认所选模型支持宽高比控制

---

## 完整请求示例（cURL）

### 文本生成图片

```bash
curl -X POST "https://api.kuai.host/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [
      {
        "role": "user",
        "parts": [
          { "text": "a beautiful sunset over the ocean" }
        ]
      }
    ],
    "generationConfig": {
      "responseModalities": ["TEXT", "IMAGE"]
    }
  }'
```

### 带宽高比的图片生成

```bash
curl -X POST "https://api.kuai.host/v1beta/models/gemini-2.5-flash-image:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [
      {
        "role": "user",
        "parts": [
          { "text": "a futuristic city skyline at night" }
        ]
      }
    ],
    "generationConfig": {
      "responseModalities": ["TEXT", "IMAGE"],
      "imageConfig": {
        "aspectRatio": "16:9"
      }
    }
  }'
```

---

## 注意事项

1. **Base64 格式**：参考图片的 Base64 数据不要包含 `data:image/xxx;base64,` 前缀，只需要纯 Base64 字符串

2. **MIME 类型**：确保 `mime_type` 与实际图片格式一致

3. **模型选择**：
   - 纯文生图使用 `gemini-2.5-flash-image-preview`
   - 图片编辑使用 `gemini-2.5-flash-image` 或 `gemini-3-pro-image-preview`

4. **响应解析**：图片数据在 `candidates[0].content.parts[].inlineData.data` 中

5. **错误处理**：始终检查响应中是否包含有效的图片数据

---

## 参考文档

- Google Gemini 图片生成官方文档：https://ai.google.dev/gemini-api/docs/image-generation
- API 代理文档：https://doc.kuai.host/

---

*文档版本：1.0*
*最后更新：2026-03-17*
