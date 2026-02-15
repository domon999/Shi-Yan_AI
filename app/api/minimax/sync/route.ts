import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key') || process.env.MINIMAX_API_KEY
    if (!apiKey) {
      return NextResponse.json({ message: '请提供 API Key' }, { status: 401 })
    }

    const body = await request.json()
    const { model, text, voice_id, speed, vol, pitch } = body

    console.log('[v0] MiniMax sync TTS request:', { model, voice_id, textLength: text?.length })

    // Call MiniMax API
    const response = await fetch('https://api.minimaxi.com/v1/t2a_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        text,
        voice_setting: {
          voice_id,
          speed: speed || 1,
          vol: vol || 1,
          pitch: pitch || 0,
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format: 'mp3',
          channel: 1,
        },
      }),
    })

    console.log('[v0] MiniMax API response status:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('[v0] MiniMax API error:', error)
      return NextResponse.json(
        { message: '调用 MiniMax API 失败', error },
        { status: response.status }
      )
    }

    // Return audio stream
    const audioData = await response.arrayBuffer()
    return new NextResponse(audioData, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="minimax-sync.mp3"',
      },
    })
  } catch (error: any) {
    console.error('[v0] Sync TTS error:', error)
    return NextResponse.json(
      { message: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}
