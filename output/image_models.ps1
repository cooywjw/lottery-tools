$headers = @{
    "Authorization" = "Bearer $env:DASHSCOPE_API_KEY"
}

try {
    $response = Invoke-RestMethod -Uri "https://dashscope.aliyuncs.com/api/v1/models" -Method Get -Headers $headers -TimeoutSec 30
    
    # Filter for image-related models
    $models = $response.output.models | Where-Object { 
        $_.model -like "*image*" -or 
        $_.model -like "*t2i*" -or
        $_.inference_metadata.response_modality -contains "Image"
    }
    
    Write-Host "Image-related models found:"
    $models | ForEach-Object {
        Write-Host "  Model: $($_.model)"
        Write-Host "  Name: $($_.name)"
        Write-Host "  Response modality: $($_.inference_metadata.response_modality -join ', ')"
        Write-Host "  Request modality: $($_.inference_metadata.request_modality -join ', ')"
        Write-Host ""
    }
} catch {
    Write-Host "Error: $_"
}
