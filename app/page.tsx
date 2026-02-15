import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Video, Mic, Sparkles, ArrowRight } from 'lucide-react'

export default function HomePage() {
  const pages = [
    {
      title: 'VEO 视频生成',
      description: '基于 VEO API 的视频生成工具，支持文本生成视频、图片参考、首尾帧控制等功能',
      path: '/veo_kg',
      icon: Video,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      features: ['多模型支持', '首尾帧控制', '横竖屏选择', '超分辨率'],
    },
    {
      title: 'Grok 10秒视频',
      description: '快速生成10秒短视频，支持参考图片上传、多种宽高比选择',
      path: '/grok-10s',
      icon: Sparkles,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      features: ['10秒快速生成', '多宽高比', '参考图支持', '实时状态监控'],
    },
    {
      title: 'MiniMax 语音合成',
      description: '强大的语音合成工具，支持同步/异步TTS、音色克隆、100+系统音色',
      path: '/minimax1',
      icon: Mic,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      features: ['同步/异步TTS', '音色快速克隆', '100+系统音色', '多音频格式'],
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto py-6 px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">AI API 测试平台</h1>
              <p className="text-muted-foreground mt-1">
                集成多种 AI API 的测试工具集合
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-12 px-4">
        {/* Hero Section */}
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-balance">
            探索 AI 视频与语音生成能力
          </h2>
          <p className="text-xl text-muted-foreground text-pretty">
            一站式测试平台，轻松体验前沿的 AI 生成技术
          </p>
        </div>

        {/* Page Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {pages.map((page) => {
            const Icon = page.icon
            return (
              <Card key={page.path} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${page.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${page.color}`} />
                  </div>
                  <CardTitle className="text-xl">{page.title}</CardTitle>
                  <CardDescription className="text-pretty">
                    {page.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Features List */}
                  <div className="space-y-2">
                    {page.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <Link href={page.path} className="block">
                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      进入测试
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">
              持续更新中，更多 AI 功能即将上线
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
