$apiKey = $env:DASHSCOPE_API_KEY
$url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis"

$body = @{
    model = "qwen-image-2.0"
    input = @{
        prompt = "Chinese ink wash painting style (水墨画), a vast football stadium pitch extending into misty mountains and fog, traditional East Asian art aesthetic, elegant minimal composition, soft atmospheric lighting with subtle gradients, dark moody tones in black and white, a football goal net barely visible in the mist, cinematic wide panoramic view, no text, no people, ultra detailed, high quality"
    }
    parameters = @{
        size = "1280*500"
    }
} | ConvertTo-Json -Depth 10

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body -TimeoutSec 60
    $taskId = $response.output.task_id
    Write-Host "Task ID: $taskId"
    
    # Poll for result
    $statusUrl = "https://dashscope.aliyuncs.com/api/v1/tasks/$taskId"
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 3
        $statusResponse = Invoke-RestMethod -Uri $statusUrl -Method Get -Headers $headers -TimeoutSec 30
        $status = $statusResponse.output.task_status
        Write-Host "Status: $status"
        if ($status -eq "SUCCEEDED") {
            $imageUrl = $statusResponse.output.results[0].url
            Write-Host "Image URL: $imageUrl"
            
            # Download image
            $webClient = New-Object System.Net.WebClient
            $webClient.DownloadFile($imageUrl, "D:\work\media\football_cover_wanxiang.png")
            Write-Host "Image saved to D:\work\media\football_cover_wanxiang.png"
            break
        } elseif ($status -eq "FAILED") {
            Write-Host "Task failed"
            break
        }
    }
} catch {
    Write-Host "Error: $_"
}
