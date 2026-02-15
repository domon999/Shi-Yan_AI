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
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Upload, Video, Loader2, Download, Copy, CheckCircle2, XCircle, Clock, AlertCircle, ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const models = [
  { value: 'veo3.1-fast', label: 'VEO 3.1 Fast (推荐)', desc: '快速模式，支持音频和首尾帧，性价比最高', supportsFrames: true, supportsComponents: false },
  { value: 'veo_3_1-fast', label: 'VEO 3.1 Fast', desc: '快速模式标准版本，支持首尾帧', supportsFrames: true, supportsComponents: false },
  { value: 'veo3.1-fast-components', label: 'VEO 3.1 Fast Components', desc: '快速组件模式，支持3张图片元素', supportsFrames: false, supportsComponents: true },
  { value: 'veo_3_1-fast-4K', label: 'VEO 3.1 Fast 4K', desc: '快速4K高清模式，支持首尾帧', supportsFrames: true, supportsComponents: false },
  { value: 'veo3.1', label: 'VEO 3.1', desc: '标准质量，自适应首帧和文生视频', supportsFrames: true, supportsComponents: false },
  { value: 'veo3.1-pro', label: 'VEO 3.1 Pro', desc: '高质量，支持音频，价格较高', supportsFrames: false, supportsComponents: false },
  { value: 'veo3', label: 'VEO 3', desc: '全球独家带声音的视频模型', supportsFrames: false, supportsComponents: false },
  { value: 'veo3-fast', label: 'VEO 3 Fast', desc: '快速模式，自动配套音频生成', supportsFrames: false, supportsComponents: false },
  { value: 'veo3-fast-frames', label: 'VEO 3 Fast Frames', desc: '支持首帧传递，自动音频', supportsFrames: true, supportsComponents: false },
  { value: 'veo3-frames', label: 'VEO 3 Frames', desc: '支持首帧传递，自动音频', supportsFrames: true, supportsComponents: false },
  { value: 'veo3-pro', label: 'VEO 3 Pro', desc: '超高质量，自动音频，价格超高', supportsFrames: false, supportsComponents: false },
  { value: 'veo3-pro-frames', label: 'VEO 3 Pro Frames', desc: '支持首帧，超高质量，价格超高', supportsFrames: true, supportsComponents: false },
  { value: 'veo2', label: 'VEO 2', desc: 'VEO 2 Fast 模式，质量好速度快', supportsFrames: false, supportsComponents: false },
  { value: 'veo2-fast', label: 'VEO 2 Fast', desc: '质量好速度快', supportsFrames: false, supportsComponents: false },
  { value: 'veo2-fast-frames', label: 'VEO 2 Fast Frames', desc: '支持首尾帧', supportsFrames: true, supportsComponents: false },
  { value: 'veo2-fast-components', label: 'VEO 2 Fast Components', desc: '支持3张图片素材元素', supportsFrames: false, supportsComponents: true },
  { value: 'veo2-pro', label: 'VEO 2 Pro', desc: '高质量模式，价格昂贵', supportsFrames: false, supportsComponents: false },
  { value: 'veo2-pro-components', label: 'VEO 2 Pro Components', desc: 'Pro模式，支持3张图片素材', supportsFrames: false, supportsComponents: true },
]

type TaskStatus = 'pending' | 'image_downloading' | 'video_generating' | 'video_generation_completed' | 
  'video_upsampling' | 'video_upsampling_completed' | 'completed' | 'failed' | 'error'

interface TaskInfo {
  id: string
  status: TaskStatus
  video_url?: string
  enhanced_prompt?: string
  status_update_time: number
}

const getStatusInfo = (status: TaskStatus) => {
  const statusMap = {
    pending: { label: '等待中', icon: Clock, color: 'text-yellow-500' },
    image_downloading: { label: '图片下载中', icon: Download, color: 'text-blue-500' },
    video_generating: { label: '视频生成中', icon: Loader2, color: 'text-purple-500' },
    video_generation_completed: { label: '视频生成完成', icon: CheckCircle2, color: 'text-green-500' },
    video_upsampling: { label: '视频超分中', icon: Loader2, color: 'text-indigo-500' },
    video_upsampling_completed: { label: '视频超分完成', icon: CheckCircle2, color: 'text-green-500' },
    completed: { label: '全部完成', icon: CheckCircle2, color: 'text-green-500' },
    failed: { label: '失败', icon: XCircle, color: 'text-red-500' },
    error: { label: '错误', icon: AlertCircle, color: 'text-red-500' },
  }
  return statusMap[status] || statusMap.pending
}

export default function VeoKgPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [taskInfo, setTaskInfo] = useState<TaskInfo | null>(null)
  const [polling, setPolling] = useState(false)
  
  // Form state
  const [model, setModel] = useState('veo3.1-fast')
  const [prompt, setPrompt] = useState('')
  
  // Regular images for components models
  const [images, setImages] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  
  // First and last frame images for frames models
  const [firstFrameImage, setFirstFrameImage] = useState<string>('')
  const [firstFrameFile, setFirstFrameFile] = useState<File | null>(null)
  const [lastFrameImage, setLastFrameImage] = useState<string>('')
  const [lastFrameFile, setLastFrameFile] = useState<File | null>(null)
  
  const [enhancePrompt, setEnhancePrompt] = useState(true)
  const [enableUpsample, setEnableUpsample] = useState(false)
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9')

  const currentModel = models.find(m => m.value === model)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const fileArray = Array.from(files)
    
    // Limit to 3 images for components models
    const maxImages = 3
    const availableSlots = maxImages - imageFiles.length
    const filesToAdd = fileArray.slice(0, availableSlots)
    
    if (filesToAdd.length < fileArray.length) {
      toast({
        title: '图片数量限制',
        description: `最多只能上传 ${maxImages} 张图片`,
        variant: 'destructive'
      })
    }
    
    setImageFiles(prev => [...prev, ...filesToAdd])

    // Create preview URLs
    filesToAdd.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setImages(prev => [...prev, e.target.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleFirstFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFirstFrameFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        setFirstFrameImage(e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleLastFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLastFrameFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        setLastFrameImage(e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  const createVideo = async () => {
    if (!prompt.trim()) {
      toast({
        title: '提示词不能为空',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      let imageUrls: string[] = []
      
      // Upload images based on model type
      if (currentModel?.supportsFrames) {
        // For frames models, upload first and last frame
        if (firstFrameFile || lastFrameFile) {
          const formData = new FormData()
          if (firstFrameFile) formData.append('files', firstFrameFile)
          if (lastFrameFile) formData.append('files', lastFrameFile)

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
      } else if (currentModel?.supportsComponents) {
        // For components models, upload multiple images
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
      }

      console.log('[v0] Creating video with model:', model, 'aspect_ratio:', aspectRatio)

      // Create video task
      const response = await fetch('/api/veo/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          images: imageUrls.length > 0 ? imageUrls : undefined,
          enhance_prompt: enhancePrompt,
          enable_upsample: enableUpsample,
          aspect_ratio: aspectRatio,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '创建任务失败')
      }

      const data = await response.json()
      console.log('[v0] Create video response:', data)
      setTaskInfo(data)
      
      toast({
        title: '任务创建成功',
        description: `任务 ID: ${data.id}`,
      })

      // Start polling
      startPolling(data.id)
    } catch (error) {
      console.error('[v0] Create video error:', error)
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
        const response = await fetch(`/api/veo/query?id=${taskId}`)
        if (!response.ok) {
          throw new Error('查询任务失败')
        }

        const data = await response.json()
        setTaskInfo(data)

        console.log('[v0] Task status:', data.status)

        // Stop polling when completed or failed
        if (data.status === 'completed' || data.status === 'failed' || data.status === 'error') {
          clearInterval(interval)
          setPolling(false)
          
          if (data.status === 'completed') {
            toast({
              title: '视频生成完成！',
              description: '您可以下载视频了',
            })
          } else {
            toast({
              title: '任务失败',
              description: '视频生成失败，请重试',
              variant: 'destructive'
            })
          }
        }
      } catch (error) {
        console.error('[v0] Polling error:', error)
        clearInterval(interval)
        setPolling(false)
      }
    }, 3000)
  }

  const queryTask = async (taskId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/veo/query?id=${taskId}`)
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
      if (data.status !== 'completed' && data.status !== 'failed' && data.status !== 'error') {
        startPolling(taskId)
      }
    } catch (error) {
      console.error('[v0] Query task error:', error)
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
            <Video className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">VEO 视频生成</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            基于 Google VEO 模型的 AI 视频生成工具
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Panel - Input Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>创建视频任务</CardTitle>
                <CardDescription>配置视频生成参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Model Selection */}
                <div className="space-y-2">
                  <Label htmlFor="model">模型选择</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger id="model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map(m => (
                        <SelectItem key={m.value} value={m.value}>
                          <div className="flex flex-col">
                            <span>{m.label}</span>
                            <span className="text-xs text-muted-foreground">{m.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">提示词 *</Label>
                  <Textarea
                    id="prompt"
                    placeholder="描述您想生成的视频内容..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Image Upload - Frames Models */}
                {currentModel?.supportsFrames && (
                  <div className="space-y-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <p className="text-sm font-medium text-primary mb-1">🎬 首尾帧模式</p>
                      <p className="text-xs text-muted-foreground">
                        该模型支持首尾帧图片上传，分别上传首帧和尾帧可以更好地控制视频效果
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                    {/* First Frame */}
                    <div className="space-y-2">
                      <Label className="font-semibold">首帧图片</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFirstFrameUpload}
                          className="hidden"
                          id="first-frame-upload"
                        />
                        <label htmlFor="first-frame-upload" className="cursor-pointer">
                          {firstFrameImage ? (
                            <div className="relative group">
                              <img src={firstFrameImage || "/placeholder.svg"} alt="First frame" className="w-full h-32 object-cover rounded-lg" />
                              <Button
                                size="sm"
                                variant="destructive"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setFirstFrameImage('')
                                  setFirstFrameFile(null)
                                }}
                              >
                                移除
                              </Button>
                            </div>
                          ) : (
                            <>
                              <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">上传首帧图片</p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Last Frame */}
                    <div className="space-y-2">
                      <Label className="font-semibold">尾帧图片</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLastFrameUpload}
                          className="hidden"
                          id="last-frame-upload"
                        />
                        <label htmlFor="last-frame-upload" className="cursor-pointer">
                          {lastFrameImage ? (
                            <div className="relative group">
                              <img src={lastFrameImage || "/placeholder.svg"} alt="Last frame" className="w-full h-32 object-cover rounded-lg" />
                              <Button
                                size="sm"
                                variant="destructive"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setLastFrameImage('')
                                  setLastFrameFile(null)
                                }}
                              >
                                移除
                              </Button>
                            </div>
                          ) : (
                            <>
                              <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">上传尾帧图片</p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                    </div>
                  </div>
                )}

                {/* Image Upload - Components Models */}
                {currentModel?.supportsComponents && (
                  <div className="space-y-2">
                    <Label>参考图片（最多3张）</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                        disabled={imageFiles.length >= 3}
                      />
                      <label htmlFor="image-upload" className={`cursor-pointer ${imageFiles.length >= 3 ? 'opacity-50' : ''}`}>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {imageFiles.length >= 3 ? '已达到上传上限' : '点击上传图片'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          已上传 {imageFiles.length} / 3 张
                        </p>
                      </label>
                    </div>

                    {images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img src={img || "/placeholder.svg"} alt={`Preview ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
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
                )}

                {/* Regular image upload for other models */}
                {!currentModel?.supportsFrames && !currentModel?.supportsComponents && (
                  <div className="space-y-2">
                    <Label>参考图片（可选）</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload-regular"
                      />
                      <label htmlFor="image-upload-regular" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          点击上传图片
                        </p>
                      </label>
                    </div>

                    {images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img src={img || "/placeholder.svg"} alt={`Preview ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
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
                )}

                {/* Options */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enhance-prompt">智能优化提示词</Label>
                      <p className="text-xs text-muted-foreground">
                        自动将中文转为英文并优化
                      </p>
                    </div>
                    <Switch
                      id="enhance-prompt"
                      checked={enhancePrompt}
                      onCheckedChange={setEnhancePrompt}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="upsample">启用超分</Label>
                      <p className="text-xs text-muted-foreground">
                        提升视频分辨率
                      </p>
                    </div>
                    <Switch
                      id="upsample"
                      checked={enableUpsample}
                      onCheckedChange={setEnableUpsample}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>视频方向</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={aspectRatio === '16:9' ? 'default' : 'outline'}
                        onClick={() => setAspectRatio('16:9')}
                        className="flex-1"
                      >
                        16:9 横屏
                      </Button>
                      <Button
                        variant={aspectRatio === '9:16' ? 'default' : 'outline'}
                        onClick={() => setAspectRatio('9:16')}
                        className="flex-1"
                      >
                        9:16 竖屏
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      横屏: 1280x720 | 竖屏: 720x1280
                    </p>
                  </div>
                </div>

                <Button
                  onClick={createVideo}
                  disabled={loading || !prompt.trim()}
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
                      <Video className="mr-2 h-4 w-4" />
                      创建视频
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
                    placeholder="输入任务 ID"
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
                      <p className="text-sm font-mono mt-1 p-2 bg-muted rounded">{taskInfo.id}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <Label className="text-xs text-muted-foreground">状态</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {StatusIcon && (
                          <StatusIcon className={`h-5 w-5 ${statusInfo?.color} ${polling ? 'animate-spin' : ''}`} />
                        )}
                        <Badge variant="outline" className={statusInfo?.color}>
                          {statusInfo?.label}
                        </Badge>
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

                    {/* Progress indicator */}
                    {polling && taskInfo.status !== 'completed' && (
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">生成进度</Label>
                        <Progress className="h-2" value={undefined} />
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          正在处理中，请稍候...
                        </p>
                      </div>
                    )}

                    {/* Video Player */}
                    {taskInfo.video_url && taskInfo.status === 'completed' && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">生成的视频</Label>
                        <video
                          src={taskInfo.video_url}
                          controls
                          className="w-full rounded-lg border border-border"
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
                        
                        {/* Video URL with copy button */}
                        <div className="space-y-2 pt-2">
                          <Label className="text-xs text-muted-foreground">视频链接</Label>
                          <div className="flex gap-2">
                            <Input
                              value={taskInfo.video_url}
                              readOnly
                              className="flex-1 text-xs font-mono"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                if (taskInfo.video_url) {
                                  navigator.clipboard.writeText(taskInfo.video_url)
                                  toast({
                                    title: '已复制',
                                    description: '视频链接已复制到剪贴板',
                                  })
                                }
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Update Time */}
                    <div>
                      <Label className="text-xs text-muted-foreground">更新时间</Label>
                      <p className="text-sm mt-1">
                        {new Date(taskInfo.status_update_time).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      暂无任务信息
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      创建任务后将在此显示进度
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
