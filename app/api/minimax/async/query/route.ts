import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key') || process.env.MINIMAX_API_KEY
    if (!apiKey) {
      return NextResponse.json({ message: '请提供 API Key' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('task_id')

    if (!taskId) {
      return NextResponse.json({ message: '缺少 task_id 参数' }, { status: 400 })
    }

    console.log('[v0] Querying MiniMax task:', taskId)

    // Call MiniMax API
    const response = await fetch(
      `https://api.minimaxi.com/v1/query/t2a_async_query_v2?task_id=${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('[v0] MiniMax query API response status:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('[v0] MiniMax query API error:', error)
      return NextResponse.json(
        { message: '查询任务失败', error },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[v0] Task status:', data.status)
    console.log('[v0] Full task data:', JSON.stringify(data))
    
    // If task is successful and has file_id, construct proxy URL
    if (data.status === 'Success' && data.file_id) {
      // Use our proxy API to download the audio file
      data.audio_file = `/api/minimax/audio?file_id=${data.file_id}`
      console.log('[v0] Audio proxy URL:', data.audio_file)
    }
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[v0] Async query error:', error)
    return NextResponse.json(
      { message: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}
