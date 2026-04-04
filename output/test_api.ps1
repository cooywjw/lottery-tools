$headers = @{
    "Authorization" = "Bearer $env:DASHSCOPE_API_KEY"
}

try {
    $response = Invoke-RestMethod -Uri "https://dashscope.aliyuncs.com/api/v1/models" -Method Get -Headers $headers -TimeoutSec 30
    Write-Host "API works! Total models: $($response.output.total)"
} catch {
    Write-Host "Error: $_"
}
