$headers = @{
    "Authorization" = "Bearer $env:DASHSCOPE_API_KEY"
}

try {
    $response = Invoke-RestMethod -Uri "https://dashscope.aliyuncs.com/api/v1/models" -Method Get -Headers $headers -TimeoutSec 30
    
    # Filter for wanx models
    $models = $response.output.models | Where-Object { $_.model -like "*wanx*" -or $_.model -like "*wan*" }
    
    Write-Host "Wanx/Wan models found:"
    $models | ForEach-Object {
        Write-Host "  Model: $($_.model)"
        Write-Host "  Name: $($_.name)"
        Write-Host "  Description: $($_.description)"
        Write-Host "  Response modality: $($_.inference_metadata.response_modality)"
        Write-Host "  Request modality: $($_.inference_metadata.request_modality -join ', ')"
        Write-Host ""
    }
} catch {
    Write-Host "Error: $_"
}
