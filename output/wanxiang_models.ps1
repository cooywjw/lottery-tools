$apiKey = $env:DASHSCOPE_API_KEY
$url = "https://dashscope.aliyuncs.com/api/v1/models"

$headers = @{
    "Authorization" = "Bearer $apiKey"
}

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers -TimeoutSec 30
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_"
    $_.Exception.Response
}
