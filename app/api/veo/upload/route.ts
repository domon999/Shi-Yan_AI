import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return NextResponse.json(
        { error: '没有上传文件' },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob
    const uploadPromises = files.map(async (file) => {
      const blob = await put(file.name, file, {
        access: 'public',
        addRandomSuffix: true,
      })
      return blob.url
    })

    const urls = await Promise.all(uploadPromises)

    return NextResponse.json({ urls })
  } catch (error) {
    console.error('[v0] Upload error:', error)
    
    // If Vercel Blob is not configured, provide a helpful error message
    if (error instanceof Error && error.message.includes('BLOB_READ_WRITE_TOKEN')) {
      return NextResponse.json(
        { 
          error: '文件上传服务未配置',
          message: '需要配置 Vercel Blob 存储。请在项目设置中添加 Blob 集成。',
          fallback: '您可以直接使用图片 URL 而不是上传文件'
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: '文件上传失败', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
