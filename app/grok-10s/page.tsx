'use client'

import React from "react"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Upload, Video, Loader2, Download, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface TaskInfo {
  id: string
  status: TaskStatus
  video_url?: string
  thumbnail_url?: string
  enhanced_prompt?: string
  status_update_time: number
  progress?: number
}

const getStatusInfo = (status: TaskStatus) => {
  const statusMap = {
    pending: { label: '等待中', icon: Clock, color: 'text-yellow-500' },
    processing: { label: '生成中', icon: Loader2, color: 'text-blue-500' },
    completed: { label: '完成', icon: CheckCircle2, color: 'text-green-500' },
    failed: { label: '失败', icon: XCircle, color: 'text-red-500' },
  }
  return statusMap[status] || statusMap.pending
}

export default function Grok10sPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [taskInfo, setTaskInfo] = useState<TaskInfo | null>(null)
  const [polling, setPolling] = useState(false)
  
  // Form state
  const [apiKey, setApiKey] = useState('')
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<'2:3' | '3:2' | '1:1'>('3:2')
  const [size] = useState('720P')
  const [images, setImages] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const fileArray = Array.from(files)
    setImageFiles(prev => [...prev, ...fileArray])

    // Create preview URLs
    fileArray.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setImages(prev => [...prev, e.target.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  const createVideo = async () => {
    if (!apiKey.trim()) {
      toast({
        title: 'API Key 不能为空',
        variant: 'destructive'
      })
      return
    }

    if (!prompt.trim()) {
      toast({
        title: '提示词不能为空',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      // First, upload images if any
      let imageUrls: string[] = []
      if (imageFiles.length > 0) {
        const formData = new FormData()
        imageFiles.forEach(file => {
          formData.append('files', file)
        })

        const uploadRes = await fetch('/api/veo/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) {
          throw new Error('图片上传失败')
        }

        const uploadData = await uploadRes.json()
        imageUrls = uploadData.urls
      }

      // Create video task
      const response = await fetch('/api/grok/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          model: 'grok-video-3-10s',
          prompt,
          aspect_ratio: aspectRatio,
          size,
          images: imageUrls,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '创建任务失败')
      }

      const data = await response.json()
      console.log('[v0] Create video response:', data)
      
      // Handle error status in response
      if (data.status === 'error') {
        toast({
          title: '任务创建失败',
          description: data.error || '服务器返回错误，请稍后重试',
          variant: 'destructive'
        })
        return
      }
      
      setTaskInfo(data)
      
      toast({
        title: '任务创建成功',
        description: `任务 ID: ${data.id}。视频生成约需 1-3 分钟，请耐心等待。`,
      })

      // Start polling
      if (data.id) {
        startPolling(data.id)
      }
    } catch (error) {
      toast({
        title: '创建失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const startPolling = (taskId: string) => {
    setPolling(true)
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/grok/query?id=${taskId}`, {
          headers: {
            'X-API-Key': apiKey,
          },
        })
        if (!response.ok) {
          throw new Error('查询任务失败')
        }

        const data = await response.json()
        console.log('[v0] Grok task status:', data.status)
        setTaskInfo(data)

        // Stop polling when completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval)
          setPolling(false)
          
          if (data.status === 'completed') {
            toast({
              title: '视频生成完成！',
              description: '您可以预览和下载视频了',
            })
          } else {
            toast({
              title: '任务失败',
              description: data.error || '视频生成失败，请重试',
              variant: 'destructive'
            })
          }
        }
      } catch (error) {
      clearInterval(interval)
      setPolling(false)
    }
    }, 3000)
  }

  const queryTask = async (taskId: string) => {
    if (!taskId.trim()) {
      toast({
        title: '请输入任务 ID',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/grok/query?id=${taskId}`)
      if (!response.ok) {
        throw new Error('查询任务失败')
      }

      const data = await response.json()
      setTaskInfo(data)

      toast({
        title: '查询成功',
        description: `状态: ${getStatusInfo(data.status).label}`,
      })

      // Start polling if not completed
      if (data.status !== 'completed' && data.status !== 'failed') {
        startPolling(taskId)
      }
    } catch (error) {
      toast({
        title: '查询失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const statusInfo = taskInfo ? getStatusInfo(taskInfo.status) : null
  const StatusIcon = statusInfo?.icon

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Grok 10秒视频生成</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            快速生成 10 秒 AI 视频，支持图片参考和多种宽高比
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Panel - Input Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>创建视频任务</CardTitle>
                <CardDescription>模型: grok-video-3-10s | 时长: 10秒 | 生成时间约 60-180 秒</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* API Key */}
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key *</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="输入您的 API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    您的 API Key 将安全地用于调用 Grok API
                  </p>
                </div>

                {/* Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">提示词 *</Label>
                  <Textarea
                    id="prompt"
                    placeholder="描述您想生成的视频内容...&#10;例如：小猫在吃鱼  --mode=custom"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    支持添加 --mode=custom 等参数控制生成模式
                  </p>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-2">
                  <Label>宽高比</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={aspectRatio === '2:3' ? 'default' : 'outline'}
                      onClick={() => setAspectRatio('2:3')}
                      className="flex-col h-auto py-3"
                    >
                      <div className="text-lg font-bold">2:3</div>
                      <div className="text-xs">竖屏</div>
                    </Button>
                    <Button
                      variant={aspectRatio === '3:2' ? 'default' : 'outline'}
                      onClick={() => setAspectRatio('3:2')}
                      className="flex-col h-auto py-3"
                    >
                      <div className="text-lg font-bold">3:2</div>
                      <div className="text-xs">横屏</div>
                    </Button>
                    <Button
                      variant={aspectRatio === '1:1' ? 'default' : 'outline'}
                      onClick={() => setAspectRatio('1:1')}
                      className="flex-col h-auto py-3"
                    >
                      <div className="text-lg font-bold">1:1</div>
                      <div className="text-xs">方形</div>
                    </Button>
                  </div>
                </div>

                {/* Size Info */}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">分辨率</span>
                    <Badge variant="secondary">{size}</Badge>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>参考图片（可选）</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        点击上传参考图片
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        支持多张图片
                      </p>
                    </label>
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img || "/placeholder.svg"} alt={`Preview ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-border" />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(idx)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={createVideo}
                  disabled={loading || !prompt.trim() || !apiKey.trim()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      生成 10 秒视频
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Query Task Card */}
            <Card>
              <CardHeader>
                <CardTitle>查询任务</CardTitle>
                <CardDescription>根据任务 ID 查询视频生成状态</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="输入任务 ID (例如: grok:xxx)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        queryTask(e.currentTarget.value)
                      }
                    }}
                  />
                  <Button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement
                      if (input?.value) {
                        queryTask(input.value)
                      }
                    }}
                  >
                    查询
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Result */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>任务状态</CardTitle>
                <CardDescription>实时显示视频生成进度</CardDescription>
              </CardHeader>
              <CardContent>
                {taskInfo ? (
                  <div className="space-y-4">
                    {/* Task ID */}
                    <div>
                      <Label className="text-xs text-muted-foreground">任务 ID</Label>
                      <p className="text-sm font-mono mt-1 p-2 bg-muted rounded break-all">{taskInfo.id}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <Label className="text-xs text-muted-foreground">状态</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {StatusIcon && (
                          <StatusIcon className={`h-5 w-5 ${statusInfo?.color} ${polling && taskInfo.status === 'processing' ? 'animate-spin' : ''}`} />
                        )}
                        <Badge variant="outline" className={statusInfo?.color}>
                          {statusInfo?.label}
                        </Badge>
                        {taskInfo.progress !== undefined && (
                          <span className="text-sm text-muted-foreground">
                            {taskInfo.progress}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Prompt */}
                    {taskInfo.enhanced_prompt && (
                      <div>
                        <Label className="text-xs text-muted-foreground">优化后的提示词</Label>
                        <p className="text-sm mt-1 p-3 bg-muted rounded leading-relaxed">
                          {taskInfo.enhanced_prompt}
                        </p>
                      </div>
                    )}

                    {/* Video Preview */}
                    {taskInfo.video_url && taskInfo.status === 'completed' && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">生成的视频</Label>
                        <video
                          src={taskInfo.video_url}
                          controls
                          className="w-full rounded-lg border border-border"
                          poster={taskInfo.thumbnail_url}
                        />
                        <Button
                          variant="outline"
                          className="w-full bg-transparent"
                          onClick={() => {
                            if (taskInfo.video_url) {
                              window.open(taskInfo.video_url, '_blank')
                            }
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          下载视频
                        </Button>
                      </div>
                    )}

                    {/* Thumbnail Preview */}
                    {taskInfo.thumbnail_url && !taskInfo.video_url && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">缩略图</Label>
                        <img
                          src={taskInfo.thumbnail_url || "/placeholder.svg"}
                          alt="Video thumbnail"
                          className="w-full rounded-lg border border-border"
                        />
                      </div>
                    )}

                    {/* Processing indicator */}
                    {polling && taskInfo.status === 'processing' && (
                      <div className="text-center py-4">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                        <p className="text-sm text-muted-foreground">
                          正在生成视频，请稍候...
                        </p>
                      </div>
                    )}

                    {/* Update Time */}
                    <div>
                      <Label className="text-xs text-muted-foreground">更新时间</Label>
                      <p className="text-sm mt-1">
                        {new Date(taskInfo.status_update_time * 1000).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Zap className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      还没有任务记录
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      创建一个视频任务或查询现有任务
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
