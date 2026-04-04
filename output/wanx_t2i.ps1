$apiKey = $env:DASHSCOPE_API_KEY

# wanx2.0-t2i-turbo 模型
$body = @{
    model = "wanx2.0-t2i-turbo"
    input = @{
        prompt = "Chinese ink wash painting style football stadium landscape, black and white with subtle gray gradients, a vast football pitch extending into misty mountains, traditional East Asian art aesthetic, soft atmospheric lighting, elegant minimal composition, 1280x500 wide banner format, dark moody tones"
    }
    parameters = @{
        size = "1280*500"
    }
} | ConvertTo-Json -Depth 10

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

# Try different wanx endpoints
$endpoints = @(
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/wanx/text2image",
    "https://dashscope.aliyuncs.com/api/v1/services/wanx/t2i"
)

foreach ($url in $endpoints) {
    Write-Host "Trying: $url"
    try {
        $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body -TimeoutSec 30
        Write-Host "Success! Response: $($response | ConvertTo-Json -Depth 5)"
        break
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
    }
}
