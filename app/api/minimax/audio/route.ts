import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get('api_key') || request.headers.get('X-API-Key') || process.env.MINIMAX_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ message: '请提供 API Key' }, { status: 401 })
    }

    const fileId = searchParams.get('file_id')

    if (!fileId) {
      return NextResponse.json({ message: '缺少 file_id 参数' }, { status: 400 })
    }

    console.log('[v0] Downloading audio file:', fileId)

    // Download audio file from MiniMax API
    const response = await fetch(
      `https://api.minimaxi.com/v1/files/retrieve_content?file_id=${fileId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    )

    console.log('[v0] MiniMax audio download status:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('[v0] MiniMax audio download error:', error)
      return NextResponse.json(
        { message: '下载音频失败', error },
        { status: response.status }
      )
    }

    // Get audio buffer
    const audioBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'audio/mpeg'

    console.log('[v0] Audio downloaded successfully, size:', audioBuffer.byteLength, 'type:', contentType)

    // Return audio with proper headers
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error: any) {
    console.error('[v0] Audio download error:', error)
    return NextResponse.json(
      { message: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}
