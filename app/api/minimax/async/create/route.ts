import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key') || process.env.MINIMAX_API_KEY
    const groupId = request.headers.get('X-Group-ID')
    
    if (!apiKey) {
      return NextResponse.json({ message: '请提供 API Key' }, { status: 401 })
    }

    const body = await request.json()
    const { model, text, voice_id } = body

    console.log('[v0] MiniMax async TTS create:', { model, voice_id, textLength: text?.length, groupId })

    // Call MiniMax API
    const response = await fetch('https://api.minimaxi.com/v1/t2a_async_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        text,
        ...(groupId && { GroupID: groupId }),
        voice_setting: {
          voice_id,
          speed: 1,
          vol: 10,
          pitch: 1,
        },
        audio_setting: {
          audio_sample_rate: 32000,
          bitrate: 128000,
          format: 'mp3',
          channel: 2,
        },
      }),
    })

    console.log('[v0] MiniMax async API response status:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('[v0] MiniMax async API error:', error)
      return NextResponse.json(
        { message: '创建任务失败', error },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[v0] Async task created:', data.task_id)
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[v0] Async create error:', error)
    return NextResponse.json(
      { message: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}
