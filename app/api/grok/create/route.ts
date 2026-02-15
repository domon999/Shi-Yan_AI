import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { model, prompt, aspect_ratio, size, images } = body

    if (!model || !prompt || !aspect_ratio || !size) {
      return NextResponse.json(
        { message: '缺少必填参数' },
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
    
    console.log('[v0] Creating Grok video task with prompt:', prompt)

    try {
      const response = await fetch('https://api.kuai.host/v1/video/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          aspect_ratio,
          size,
          images: images || [],
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()
      
      console.log('[v0] Grok API response status:', response.status)
      console.log('[v0] Grok API response data:', JSON.stringify(data))
      
      // Check if API returned error in response body even with 200 status
      if (data.status === 'error') {
        console.error('[v0] Grok API returned error status:', data.error)
        // Still return the task info so user can query it later
        return NextResponse.json(data, { status: 200 })
      }
      
      if (!response.ok) {
        console.error('[v0] Grok API HTTP error:', response.status, data)
        return NextResponse.json(
          { message: data.error || '调用 Grok API 失败' },
          { status: response.status }
        )
      }

      return NextResponse.json(data)
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { message: '请求超时，但视频可能仍在生成中' },
          { status: 408 }
        )
      }
      throw fetchError
    }
  } catch (error) {
    console.error('[v0] Create video error:', error)
    return NextResponse.json(
      { message: '服务器错误' },
      { status: 500 }
    )
  }
}
