# 后台轮询任务并下载首帧
$taskId = "ebad9487-a507-4970-9ce8-fd9791080b83"
$apiKey = "sk-e0fed1bc564947439b1584f3d771346f"
$baseUrl = "https://dashscope.aliyuncs.com/api/v1/tasks/$taskId"

Write-Host "⏳ 正在轮询任务状态（最多等待 120 秒）..." -ForegroundColor Yellow

for ($i = 0; $i -lt 12; $i++) {
    Start-Sleep -Seconds 10
    try {
        $res = Invoke-RestMethod -Uri $baseUrl -Headers @{ 'Authorization' = "Bearer $apiKey"; 'Content-Type' = 'application/json' }
        $status = $res.output?.task_status ?? $res.task_status
        if ($status -eq 'SUCCEEDED') {
            $videoUrl = $res.output?.video_url ?? $res.results?.[0]?.url
            if ($videoUrl) {
                $fileName = "D:\work\media\suzhou-ink-$(Get-Date -Format 'yyyyMMdd-HHmmss').mp4"
                Write-Host "`n✅ 视频 URL 获取成功！正在下载..." -ForegroundColor Green
                Invoke-WebRequest -Uri $videoUrl -OutFile $fileName
                Write-Host "🎬 视频已保存：$fileName" -ForegroundColor Green
                
                # 截取首帧
                $pngName = $fileName -replace '\.mp4$', '.png'
                if (Get-Command ffmpeg -ErrorAction SilentlyContinue) {
                    ffmpeg -i "$fileName" -vframes 1 -q:v 2 "$pngName"
                    Write-Host "🖼️  首帧已保存：$pngName" -ForegroundColor Green
                    
                    # 输出路径供 OpenClaw 引用
                    Write-Output "IMAGE_PATH:$pngName"
                } else {
                    Write-Host "⚠️  ffmpeg 未安装，无法截取首帧。视频文件：$fileName" -ForegroundColor Yellow
                }
                exit 0
            }
        } elseif ($status -eq 'FAILED') {
            Write-Host "`n❌ 任务失败：$($res.output?.message ?? $res.message)" -ForegroundColor Red
            exit 1
        }
        Write-Host "." -NoNewline -ForegroundColor Gray
    } catch { 
        Write-Host "x" -NoNewline -ForegroundColor Red
    }
}
Write-Host "`n⏰ 超时：任务仍在处理中，请稍后手动查询。" -ForegroundColor Yellow
exit 2