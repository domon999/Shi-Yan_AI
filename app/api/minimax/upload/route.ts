import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key') || process.env.MINIMAX_API_KEY
    if (!apiKey) {
      return NextResponse.json({ message: '请提供 API Key' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const purpose = formData.get('purpose') as string

    if (!file || !purpose) {
      return NextResponse.json({ message: '缺少必要参数' }, { status: 400 })
    }

    console.log('[v0] Uploading file to MiniMax:', { filename: file.name, purpose })

    // Create FormData for MiniMax API
    const minimaxFormData = new FormData()
    minimaxFormData.append('file', file)
    minimaxFormData.append('purpose', purpose)

    // Call MiniMax API
    const response = await fetch('https://api.minimaxi.com/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: minimaxFormData,
    })

    console.log('[v0] MiniMax upload API response status:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('[v0] MiniMax upload API error:', error)
      return NextResponse.json(
        { message: '上传文件失败', error },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[v0] File uploaded:', data.file?.file_id)
    
    return NextResponse.json({ file_id: data.file?.file_id })
  } catch (error: any) {
    console.error('[v0] Upload error:', error)
    return NextResponse.json(
      { message: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}
