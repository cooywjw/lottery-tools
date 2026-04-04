$apiKey = $env:DASHSCOPE_API_KEY

# Try different endpoint formats
$endpoints = @(
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis",
    "https://dashscope.aliyuncs.com/api/v1/services/wanx/text2image/image-synthesis",
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/text2image"
)

$body = @{
    model = "qwen-image-2.0"
    input = @{
        prompt = "A beautiful sunset"
    }
} | ConvertTo-Json -Depth 10

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

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
