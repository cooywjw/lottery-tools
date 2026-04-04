$apiKey = $env:DASHSCOPE_API_KEY

# Simplified request body
$body = @{
    model = "wanx2.0-t2i-turbo"
    input = @{
        prompt = "a beautiful sunset over mountains"
    }
} | ConvertTo-Json -Depth 10

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

$url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis"

try {
    Write-Host "Sending request to: $url"
    Write-Host "Body: $body"
    
    $response = Invoke-WebRequest -Uri $url -Method Post -Headers $headers -Body $body -TimeoutSec 30
    
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Exception: $($_.Exception.GetType().Name)"
    Write-Host "Message: $($_.Exception.Message)"
    
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Write-Host "Status Code: $statusCode"
        
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Body: $errorBody"
    }
}
