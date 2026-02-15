'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import { Upload, Play, Loader2, Download, Copy, Mic } from 'lucide-react'

const models = [
  { value: 'speech-2.8-hd', label: 'Speech 2.8 HD', desc: '精准还原真实语气细节' },
  { value: 'speech-2.6-hd', label: 'Speech 2.6 HD', desc: '超低延时，更高自然度' },
  { value: 'speech-2.8-turbo', label: 'Speech 2.8 Turbo', desc: '更快更优惠' },
  { value: 'speech-2.6-turbo', label: 'Speech 2.6 Turbo (推荐)', desc: '极速版，适用于数字人' },
  { value: 'speech-02-hd', label: 'Speech 02 HD', desc: '出色的韵律和稳定性' },
  { value: 'speech-02-turbo', label: 'Speech 02 Turbo', desc: '小语种能力加强' },
]

const popularVoices = [
  { id: 'male-qn-qingse', name: '青涩青年音色', lang: '中文(普通话)' },
  { id: 'male-qn-jingying', name: '精英青年音色', lang: '中文(普通话)' },
  { id: 'female-shaonv', name: '少女音色', lang: '中文(普通话)' },
  { id: 'female-yujie', name: '御姐音色', lang: '中文(普通话)' },
  { id: 'female-tianmei', name: '甜美女性音色', lang: '中文(普通话)' },
  { id: 'audiobook_male_1', name: '有声书男声1', lang: '中文(普通话)' },
]

export default function Minimax1Page() {
  const { toast } = useToast()
  
  // Common states
  const [apiKey, setApiKey] = useState('')
  const [groupId, setGroupId] = useState('1735116464916009528')
  const [loading, setLoading] = useState(false)
  
  // Sync TTS states
  const [syncModel, setSyncModel] = useState('speech-2.6-turbo')
  const [syncVoiceId, setSyncVoiceId] = useState('male-qn-qingse')
  const [syncText, setSyncText] = useState('')
  const [syncSpeed, setSyncSpeed] = useState([1])
  const [syncVolume, setSyncVolume] = useState([1])
  const [syncPitch, setSyncPitch] = useState([0])
  const [syncAudioUrl, setSyncAudioUrl] = useState('')
  
  // Async TTS states
  const [asyncModel, setAsyncModel] = useState('speech-2.8-hd')
  const [asyncVoiceId, setAsyncVoiceId] = useState('audiobook_male_1')
  const [asyncText, setAsyncText] = useState('')
  const [asyncTaskId, setAsyncTaskId] = useState('')
  const [asyncStatus, setAsyncStatus] = useState<any>(null)
  const [polling, setPolling] = useState(false)
  
  // Voice Clone states
  const [cloneFile, setCloneFile] = useState<File | null>(null)
  const [promptFile, setPromptFile] = useState<File | null>(null)
  const [cloneVoiceId, setCloneVoiceId] = useState('')
  const [cloneText, setCloneText] = useState('')
  const [promptText, setPromptText] = useState('')
  const [cloneResult, setCloneResult] = useState<any>(null)

  // Sync TTS
  const handleSyncTTS = async () => {
    if (!apiKey) {
      toast({ title: '请输入 API Key', variant: 'destructive' })
      return
    }
    if (!syncText) {
      toast({ title: '请输入文本内容', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/minimax/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          model: syncModel,
          text: syncText,
          voice_id: syncVoiceId,
          speed: syncSpeed[0],
          vol: syncVolume[0],
          pitch: syncPitch[0],
        }),
      })

      if (!response.ok) throw new Error('合成失败')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setSyncAudioUrl(url)
      
      toast({ title: '合成成功', description: '音频已生成，可以播放或下载' })
    } catch (error: any) {
      toast({ title: '合成失败', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Async TTS
  const handleAsyncTTS = async () => {
    if (!apiKey) {
      toast({ title: '请输入 API Key', variant: 'destructive' })
      return
    }
    if (!asyncText) {
      toast({ title: '请输入文本内容', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/minimax/async/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
          'X-Group-ID': groupId,
        },
        body: JSON.stringify({
          model: asyncModel,
          text: asyncText,
          voice_id: asyncVoiceId,
        }),
      })

      if (!response.ok) throw new Error('创建任务失败')

      const data = await response.json()
      setAsyncTaskId(data.task_id)
      
      toast({ title: '任务创建成功', description: `任务ID: ${data.task_id}` })
      startPolling(data.task_id)
    } catch (error: any) {
      toast({ title: '创建任务失败', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const startPolling = (taskId: string) => {
    setPolling(true)
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/minimax/async/query?task_id=${taskId}`, {
          headers: {
            'X-API-Key': apiKey,
            'X-Group-ID': groupId,
          },
        })
        
        if (!response.ok) throw new Error('查询失败')
        
        const data = await response.json()
        console.log('[v0] Async status update:', data)
        
        // Add API key to audio URL for proxy access
        if (data.audio_file && !data.audio_file.includes('X-API-Key')) {
          data.audio_file = `${data.audio_file}&api_key=${encodeURIComponent(apiKey)}`
        }
        
        setAsyncStatus(data)
        
        if (data.status === 'Success') {
          clearInterval(interval)
          setPolling(false)
          toast({ title: '任务完成', description: '音频生成完成' })
        } else if (data.status === 'Failed') {
          clearInterval(interval)
          setPolling(false)
          toast({ title: '任务失败', variant: 'destructive' })
        }
      } catch (error) {
        clearInterval(interval)
        setPolling(false)
      }
    }, 3000)
  }

  // Voice Clone
  const handleVoiceClone = async () => {
    if (!apiKey) {
      toast({ title: '请输入 API Key', variant: 'destructive' })
      return
    }
    if (!cloneFile) {
      toast({ title: '请上传复刻音频', variant: 'destructive' })
      return
    }
    if (!cloneVoiceId) {
      toast({ title: '请输入自定义音色ID', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      // 1. Upload clone audio
      const formData = new FormData()
      formData.append('file', cloneFile)
      formData.append('purpose', 'voice_clone')
      
      const uploadRes = await fetch('/api/minimax/upload', {
        method: 'POST',
        headers: { 'X-API-Key': apiKey },
        body: formData,
      })
      
      if (!uploadRes.ok) throw new Error('上传失败')
      const uploadData = await uploadRes.json()
      
      // 2. Upload prompt audio if exists
      let promptFileId = null
      if (promptFile) {
        const promptFormData = new FormData()
        promptFormData.append('file', promptFile)
        promptFormData.append('purpose', 'prompt_audio')
        
        const promptRes = await fetch('/api/minimax/upload', {
          method: 'POST',
          headers: { 'X-API-Key': apiKey },
          body: promptFormData,
        })
        
        if (promptRes.ok) {
          const promptData = await promptRes.json()
          promptFileId = promptData.file_id
        }
      }
      
      // 3. Clone voice
      const cloneRes = await fetch('/api/minimax/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          file_id: uploadData.file_id,
          voice_id: cloneVoiceId,
          clone_prompt: promptFileId ? {
            prompt_audio: promptFileId,
            prompt_text: promptText,
          } : undefined,
          text: cloneText,
          model: 'speech-2.8-hd',
        }),
      })
      
      if (!cloneRes.ok) throw new Error('复刻失败')
      
      const cloneData = await cloneRes.json()
      setCloneResult(cloneData)
      
      toast({ title: '复刻成功', description: '音色已复刻，可以使用该音色ID进行合成' })
    } catch (error: any) {
      toast({ title: '复刻失败', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">MiniMax 语音合成测试</h1>
          <p className="text-muted-foreground">
            测试 MiniMax TTS API - 同步合成、异步合成、音色复刻
          </p>
        </div>

        {/* API Key and GroupID */}
        <Card>
          <CardHeader>
            <CardTitle>API 配置</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="apiKey">MiniMax API Key *</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="输入您的 MiniMax API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  您的 API Key 将安全地用于调用 MiniMax API
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupId">GroupID</Label>
                <Input
                  id="groupId"
                  type="text"
                  placeholder="输入 GroupID"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  用于任务管理和查询（默认：1735116464916009528）
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="sync" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sync">同步合成</TabsTrigger>
            <TabsTrigger value="async">异步合成</TabsTrigger>
            <TabsTrigger value="clone">音色复刻</TabsTrigger>
            <TabsTrigger value="voices">音色列表</TabsTrigger>
          </TabsList>

          {/* Sync TTS */}
          <TabsContent value="sync" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>同步语音合成</CardTitle>
                <CardDescription>实时生成语音，最长支持 10,000 字符</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>模型</Label>
                    <Select value={syncModel} onValueChange={setSyncModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label} - {m.desc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>音色</Label>
                    <Select value={syncVoiceId} onValueChange={setSyncVoiceId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {popularVoices.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>语速: {syncSpeed[0]}</Label>
                    <Slider
                      value={syncSpeed}
                      onValueChange={setSyncSpeed}
                      min={0.5}
                      max={2}
                      step={0.1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>音量: {syncVolume[0]}</Label>
                    <Slider
                      value={syncVolume}
                      onValueChange={setSyncVolume}
                      min={0}
                      max={2}
                      step={0.1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>音调: {syncPitch[0]}</Label>
                    <Slider
                      value={syncPitch}
                      onValueChange={setSyncPitch}
                      min={-12}
                      max={12}
                      step={1}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>文本内容</Label>
                    <div className="text-xs text-muted-foreground">
                      {syncText.length} 字符 / 预计消耗约 {Math.ceil(syncText.length * 1)} 积分
                    </div>
                  </div>
                  <Textarea
                    placeholder="输入要合成的文本内容..."
                    value={syncText}
                    onChange={(e) => setSyncText(e.target.value)}
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    按字符数计费，约 1 积分/字符（不同模型价格可能不同）
                  </p>
                </div>

                <Button
                  onClick={handleSyncTTS}
                  disabled={loading || !apiKey || !syncText}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      合成中...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      开始合成
                    </>
                  )}
                </Button>

                {syncAudioUrl && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6 space-y-4">
                      <audio controls src={syncAudioUrl} className="w-full" />
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const a = document.createElement('a')
                          a.href = syncAudioUrl
                          a.download = 'minimax-sync.mp3'
                          a.click()
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        下载音频
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Async TTS */}
          <TabsContent value="async" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>异步语音合成</CardTitle>
                <CardDescription>适用于长文本，最长支持 100,000 字符</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>模型</Label>
                    <Select value={asyncModel} onValueChange={setAsyncModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>音色</Label>
                    <Select value={asyncVoiceId} onValueChange={setAsyncVoiceId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {popularVoices.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>文本内容</Label>
                    <div className="text-xs text-muted-foreground">
                      {asyncText.length} 字符 / 预计消耗约 {Math.ceil(asyncText.length * 1)} 积分
                    </div>
                  </div>
                  <Textarea
                    placeholder="输入要合成的长文本内容..."
                    value={asyncText}
                    onChange={(e) => setAsyncText(e.target.value)}
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    按字符数计费，约 1 积分/字符（不同模型价格可能不同）
                  </p>
                </div>

                <Button
                  onClick={handleAsyncTTS}
                  disabled={loading || !apiKey || !asyncText}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      创建任务中...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      创建合成任务
                    </>
                  )}
                </Button>

                {asyncTaskId && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs">任务 ID</Label>
                        <div className="flex gap-2">
                          <Input value={asyncTaskId} readOnly className="font-mono text-xs" />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText(asyncTaskId)
                              toast({ title: '已复制任务ID' })
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {asyncStatus && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">状态:</span>
                            <span className={`text-sm font-bold ${
                              asyncStatus.status === 'Success' ? 'text-green-500' :
                              asyncStatus.status === 'Failed' ? 'text-red-500' :
                              'text-yellow-500'
                            }`}>
                              {asyncStatus.status}
                            </span>
                          </div>

                          {asyncStatus.status === 'Success' && asyncStatus.audio_file && (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label className="text-xs">生成的音频</Label>
                                <audio controls src={asyncStatus.audio_file} className="w-full" />
                              </div>
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  const a = document.createElement('a')
                                  a.href = asyncStatus.audio_file
                                  a.download = `minimax-async-${asyncTaskId}.mp3`
                                  a.click()
                                }}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                下载音频文件
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {polling && (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          正在轮询任务状态...
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice Clone */}
          <TabsContent value="clone" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>音色快速复刻</CardTitle>
                <CardDescription>上传音频复刻音色，获取自定义 Voice ID</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>自定义音色 ID *</Label>
                  <Input
                    placeholder="输入自定义的音色ID，如: my-custom-voice-001"
                    value={cloneVoiceId}
                    onChange={(e) => setCloneVoiceId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>复刻音频 * (10秒-5分钟, mp3/m4a/wav, 最大20MB)</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".mp3,.m4a,.wav"
                      onChange={(e) => setCloneFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="clone-file"
                    />
                    <label htmlFor="clone-file" className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {cloneFile ? cloneFile.name : '点击上传复刻音频'}
                      </p>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>参考音频 (可选, 最长8秒)</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".mp3,.m4a,.wav"
                      onChange={(e) => setPromptFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="prompt-file"
                    />
                    <label htmlFor="prompt-file" className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {promptFile ? promptFile.name : '点击上传参考音频'}
                      </p>
                    </label>
                  </div>
                </div>

                {promptFile && (
                  <div className="space-y-2">
                    <Label>参考音频文本</Label>
                    <Input
                      placeholder="输入参考音频的文本内容..."
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>试听文本</Label>
                    <div className="text-xs text-muted-foreground">
                      {cloneText.length} 字符 / 预计消耗约 {Math.ceil(cloneText.length * 1)} 积分
                    </div>
                  </div>
                  <Textarea
                    placeholder="输入用于生成试听音频的文本..."
                    value={cloneText}
                    onChange={(e) => setCloneText(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    音色复刻 + 试听文本合成按字符计费
                  </p>
                </div>

                <Button
                  onClick={handleVoiceClone}
                  disabled={loading || !apiKey || !cloneFile || !cloneVoiceId}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      复刻中...
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4" />
                      开始复刻
                    </>
                  )}
                </Button>

                {cloneResult && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">复刻成功!</Label>
                        <p className="text-sm text-muted-foreground">
                          音色 ID: <code className="font-mono">{cloneVoiceId}</code>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          您现在可以在同步或异步合成中使用此音色ID
                        </p>
                      </div>
                      
                      {cloneResult.audio_file && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-xs">试听音频</Label>
                            <audio controls src={cloneResult.audio_file} className="w-full" />
                          </div>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              const a = document.createElement('a')
                              a.href = cloneResult.audio_file
                              a.download = `minimax-clone-${cloneVoiceId}.mp3`
                              a.click()
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            下载试听音频
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice List */}
          <TabsContent value="voices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>系统音色列表</CardTitle>
                <CardDescription>MiniMax 提供 100+ 系统音色可供选择</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {popularVoices.map((voice) => (
                    <div
                      key={voice.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{voice.name}</p>
                        <p className="text-sm text-muted-foreground">{voice.lang}</p>
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {voice.id}
                        </code>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(voice.id)
                          toast({ title: '已复制音色ID', description: voice.id })
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <div className="text-center pt-4">
                    <p className="text-sm text-muted-foreground">
                      更多音色请查看{' '}
                      <a
                        href="https://platform.minimaxi.com/document/Preset%20voices?key=66719005a427f0c8a5701643"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        官方文档
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
