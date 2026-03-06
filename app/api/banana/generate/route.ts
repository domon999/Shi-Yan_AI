import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey, model, prompt, aspectRatio, refImage, refImageMime } = body

    if (!apiKey) {
      return NextResponse.json({ message: '请提供 API Key' }, { status: 401 })
    }
    if (!prompt) {
      return NextResponse.json({ message: '请提供提示词' }, { status: 400 })
    }

    // Build parts array
    const parts: any[] = [{ text: prompt }]

    // Add reference image if provided
    if (refImage) {
      parts.push({
        inline_data: {
          mime_type: refImageMime || 'image/jpeg',
          data: refImage,
        },
      })
    }

    // Build generationConfig
    const generationConfig: any = {
      responseModalities: ['TEXT', 'IMAGE'],
    }

    // Add aspectRatio if supported and provided
    if (aspectRatio) {
      generationConfig.imageConfig = {
        aspectRatio,
      }
    }

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      generationConfig,
    }

    console.log('[v0] Gemini image generate request:', { model, promptLength: prompt.length, hasRefImage: !!refImage, aspectRatio })

    const url = `https://api.kuai.host/v1beta/models/${model}:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()
    console.log('[v0] Gemini API response status:', response.status)

    if (!response.ok) {
      console.error('[v0] Gemini API error:', JSON.stringify(data))
      return NextResponse.json(
        { message: data?.error?.message || '调用 Gemini API 失败', detail: data },
        { status: response.status }
      )
    }

    // Parse response: find image and text parts
    let imageBase64: string | null = null
    let text: string | null = null

    const candidates = data?.candidates || []
    for (const candidate of candidates) {
      const contentParts = candidate?.content?.parts || []
      for (const part of contentParts) {
        if (part.inlineData?.data) {
          imageBase64 = part.inlineData.data
        }
        if (part.text) {
          text = part.text
        }
      }
    }

    if (!imageBase64) {
      console.warn('[v0] No image found in response:', JSON.stringify(data))
      return NextResponse.json(
        { message: '未能从响应中提取图片', text, rawResponse: data },
        { status: 200 }
      )
    }

    return NextResponse.json({ imageBase64, text })
  } catch (error: any) {
    console.error('[v0] Generate error:', error)
    return NextResponse.json(
      { message: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}
