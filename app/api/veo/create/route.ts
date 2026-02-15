import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const apiKey = process.env.VEO_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: '服务配置错误：未设置 API 密钥' },
        { status: 500 }
      )
    }

    // Call VEO API
    const response = await fetch('https://api.kuai.host/v1/video/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[v0] VEO API error:', error)
      return NextResponse.json(
        { error: '视频创建失败', details: error },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Create video error:', error)
    return NextResponse.json(
      { error: '请求处理失败', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
