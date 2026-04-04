$apiKey = $env:DASHSCOPE_API_KEY

$body = @{
    model = "wanx2.0-t2i-turbo"
    input = @{
        prompt = "Chinese ink wash painting style football stadium, dark tones"
    }
} | ConvertTo-Json -Depth 10

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

# More endpoint variations
$endpoints = @(
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/wanx2.0/text2image",
    "https://dashscope.aliyuncs.com/api/v1/services/wanx2.0/text2image",
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/wanx/t2i-turbo",
    "https://dashscope.aliyuncs.com/api/v1/services/wanx/wanx2.0/t2i"
)

foreach ($url in $endpoints) {
    Write-Host "Trying: $url"
    try {
        $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body -TimeoutSec 30
        Write-Host "Success! Response: $($response | ConvertTo-Json -Depth 5)"
        break
    } catch {
        Write-Host "Error: $($_.Exception.Message.Substring(0, [Math]::Min(200, $_.Exception.Message.Length)))"
    }
}
