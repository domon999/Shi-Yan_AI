import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key') || process.env.MINIMAX_API_KEY
    if (!apiKey) {
      return NextResponse.json({ message: '请提供 API Key' }, { status: 401 })
    }

    const body = await request.json()
    const { file_id, voice_id, clone_prompt, text, model } = body

    console.log('[v0] MiniMax voice clone:', { voice_id, model })

    // Call MiniMax API
    const response = await fetch('https://api.minimaxi.com/v1/voice_clone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_id,
        voice_id,
        clone_prompt,
        text,
        model,
      }),
    })

    console.log('[v0] MiniMax clone API response status:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('[v0] MiniMax clone API error:', error)
      return NextResponse.json(
        { message: '音色复刻失败', error },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[v0] Voice cloned successfully')
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[v0] Clone error:', error)
    return NextResponse.json(
      { message: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}
