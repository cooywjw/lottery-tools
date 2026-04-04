$apiKey = $env:DASHSCOPE_API_KEY
$url = "https://dashscope.aliyuncs.com/api/v1/models"

$body = @{
    model = "wanx2.1-pro"
    input = @{
        prompt = "Chinese ink wash painting style football stadium landscape, black and white with subtle gray gradients, a vast football pitch extending into misty mountains, traditional East Asian art aesthetic, soft atmospheric lighting, elegant minimal composition, cinematic wide banner format"
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
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body -TimeoutSec 120
    Write-Host $response
} catch {
    Write-Host "Error: $_"
    Write-Host $_.Exception.Response
}
