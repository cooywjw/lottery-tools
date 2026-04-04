$apiKey = $env:DASHSCOPE_API_KEY
$url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis"

$body = @{
    model = "qwen-image-2.0"
    input = @{
        prompt = "A beautiful sunset over mountains, digital art style"
    }
} | ConvertTo-Json -Depth 10

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

try {
    Write-Host "Submitting task..."
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body -TimeoutSec 60
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "Error: $_"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $errorBody = $reader.ReadToEnd()
    Write-Host "Error body: $errorBody"
}
