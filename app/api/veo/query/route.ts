import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const taskId = searchParams.get('id')

    if (!taskId) {
      return NextResponse.json(
        { error: '缺少任务 ID' },
        { status: 400 }
      )
    }

    const apiKey = process.env.VEO_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: '服务配置错误：未设置 API 密钥' },
        { status: 500 }
      )
    }

    // Call VEO API
    const response = await fetch(`https://api.kuai.host/v1/video/query?id=${encodeURIComponent(taskId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[v0] VEO API query error:', error)
      return NextResponse.json(
        { error: '任务查询失败', details: error },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Query task error:', error)
    return NextResponse.json(
      { error: '请求处理失败', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
