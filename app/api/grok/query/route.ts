import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { message: '缺少任务 ID' },
        { status: 400 }
      )
    }

    // Get API key from header or environment variable
    const apiKey = request.headers.get('X-API-Key') || process.env.VEO_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { message: '请提供 API Key' },
        { status: 401 }
      )
    }

    // Call Grok API with 200 seconds timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 200000) // 200 seconds

    try {
      const response = await fetch(`https://api.kuai.host/v1/video/query?id=${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.text()
        console.error('[v0] Grok API error:', error)
        return NextResponse.json(
          { message: '调用 Grok API 失败' },
          { status: response.status }
        )
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { message: '查询超时，请稍后重试' },
          { status: 408 }
        )
      }
      throw fetchError
    }
  } catch (error) {
    console.error('[v0] Query task error:', error)
    return NextResponse.json(
      { message: '服务器错误' },
      { status: 500 }
    )
  }
}
