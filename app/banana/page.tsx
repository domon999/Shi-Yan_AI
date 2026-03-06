'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Upload, X, Download, Copy, ImageIcon, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const models = [
  {
    value: 'gemini-2.5-flash-image-preview',
    label: 'gemini-2.5-flash-image-preview',
    desc: '文本生成图片，不支持上传参考图',
    supportsImage: false,
    supportsAspectRatio: false,
  },
  {
    value: 'gemini-2.5-flash-image',
    label: 'gemini-2.5-flash-image',
    desc: '支持参考图片编辑，可控制宽高比',
    supportsImage: true,
    supportsAspectRatio: true,
  },
  {
    value: 'gemini-3-pro-image-preview',
    label: 'gemini-3-pro-image-preview',
    desc: '高清图片生成，支持宽高比与清晰度控制',
    supportsImage: true,
    supportsAspectRatio: true,
  },
]

const aspectRatios = [
  { value: '1:1', label: '1:1 正方形' },
  { value: '16:9', label: '16:9 横屏' },
  { value: '9:16', label: '9:16 竖屏' },
  { value: '4:3', label: '4:3 标准' },
  { value: '3:4', label: '3:4 竖版' },
]

export default function BananaPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [apiKey, setApiKey] = useState('sk-SUMVLwc89J68PCN7uwxPjOj85Z8wNRiNudvPLda0BjwgbBmm')
  const [model, setModel] = useState('gemini-2.5-flash-image-preview')
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [refImage, setRefImage] = useState<string | null>(null)
  const [refImageMime, setRefImageMime] = useState('image/jpeg')
  const [loading, setLoading] = useState(false)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [resultText, setResultText] = useState<string | null>(null)

  const currentModel = models.find((m) => m.value === model)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const mime = file.type || 'image/jpeg'
    setRefImageMime(mime)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      // Remove data URL prefix, keep only base64
      const base64 = result.split(',')[1]
      setRefImage(base64)
    }
    reader.readAsDataURL(file)
  }

  const removeRefImage = () => {
    setRefImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const generate = async () => {
    if (!apiKey.trim()) {
      toast({ title: 'API Key 不能为空', variant: 'destructive' })
      return
    }
    if (!prompt.trim()) {
      toast({ title: '提示词不能为空', variant: 'destructive' })
      return
    }

    setLoading(true)
    setResultImage(null)
    setResultText(null)

    try {
      const response = await fetch('/api/banana/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          model,
          prompt,
          aspectRatio: currentModel?.supportsAspectRatio ? aspectRatio : undefined,
          refImage: currentModel?.supportsImage ? refImage : undefined,
          refImageMime: currentModel?.supportsImage ? refImageMime : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '生成失败')
      }

      if (data.imageBase64) {
        setResultImage(`data:image/png;base64,${data.imageBase64}`)
      }
      if (data.text) {
        setResultText(data.text)
      }

      toast({ title: '生成成功', description: '图片已生成完成' })
    } catch (err: any) {
      toast({ title: '生成失败', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const downloadImage = () => {
    if (!resultImage) return
    const a = document.createElement('a')
    a.href = resultImage
    a.download = `gemini-image-${Date.now()}.png`
    a.click()
  }

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt)
    toast({ title: '已复制提示词' })
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Gemini 图片生成</h1>
              <p className="text-xs text-muted-foreground">Google Gemini Image API 测试工具</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">返回首页</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Panel - Settings */}
          <div className="space-y-4">
            {/* API Key */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">API 配置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="输入 API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Model Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">模型选择</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>模型</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          <div>
                            <div className="font-medium text-sm">{m.label}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentModel && (
                    <p className="text-xs text-muted-foreground">{currentModel.desc}</p>
                  )}
                </div>

                {/* Aspect Ratio */}
                {currentModel?.supportsAspectRatio && (
                  <div className="space-y-1.5">
                    <Label>宽高比</Label>
                    <div className="flex flex-wrap gap-2">
                      {aspectRatios.map((ar) => (
                        <button
                          key={ar.value}
                          type="button"
                          onClick={() => setAspectRatio(ar.value)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            aspectRatio === ar.value
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-foreground border-border hover:border-primary'
                          }`}
                        >
                          {ar.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reference Image */}
            {currentModel?.supportsImage && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">参考图片（可选）</CardTitle>
                </CardHeader>
                <CardContent>
                  {refImage ? (
                    <div className="relative">
                      <img
                        src={`data:${refImageMime};base64,${refImage}`}
                        alt="参考图片"
                        className="w-full rounded-lg object-cover max-h-48"
                      />
                      <button
                        type="button"
                        onClick={removeRefImage}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">点击上传参考图片</p>
                      <p className="text-xs text-muted-foreground mt-1">支持 JPG、PNG、WEBP</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </CardContent>
              </Card>
            )}

            {/* Prompt */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  提示词
                  <button type="button" onClick={copyPrompt} className="text-muted-foreground hover:text-foreground">
                    <Copy className="h-4 w-4" />
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="描述你想要生成的图片内容，例如：a beautiful sunset over the ocean with vibrant colors..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">{prompt.length} 个字符</p>
                <Button
                  onClick={generate}
                  disabled={loading || !prompt.trim() || !apiKey.trim()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      生成图片
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Result */}
          <div className="space-y-4">
            <Card className="min-h-[500px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  生成结果
                  {resultImage && (
                    <Button variant="outline" size="sm" onClick={downloadImage}>
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      下载图片
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading && (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                      <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">正在生成图片，请稍候...</p>
                  </div>
                )}

                {!loading && !resultImage && !resultText && (
                  <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                    <ImageIcon className="h-16 w-16 opacity-20" />
                    <p className="text-sm">生成的图片将在这里显示</p>
                  </div>
                )}

                {resultImage && (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={resultImage}
                        alt="生成的图片"
                        width={800}
                        height={800}
                        className="w-full h-auto object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={downloadImage}>
                        <Download className="mr-2 h-4 w-4" />
                        下载图片
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          if (resultImage) {
                            navigator.clipboard.writeText(resultImage)
                            toast({ title: '已复制图片 Base64 数据' })
                          }
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        复制数据
                      </Button>
                    </div>
                  </div>
                )}

                {resultText && (
                  <div className="mt-4 p-3 rounded-lg bg-muted">
                    <p className="text-sm font-medium mb-1 text-muted-foreground">模型文本回复</p>
                    <p className="text-sm">{resultText}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Model Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">模型说明</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {models.map((m) => (
                    <div
                      key={m.value}
                      className={`p-3 rounded-lg border text-sm transition-colors ${
                        model === m.value ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="font-medium font-mono text-xs mb-1">{m.label}</div>
                      <div className="text-muted-foreground text-xs">{m.desc}</div>
                      <div className="flex gap-2 mt-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${m.supportsImage ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                          {m.supportsImage ? '支持参考图' : '仅文生图'}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${m.supportsAspectRatio ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                          {m.supportsAspectRatio ? '支持宽高比' : '默认比例'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
