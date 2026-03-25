# 手动保存对话 - PowerShell 版本
# 用法: .\save-dialog.ps1 "对话内容摘要" [-Important]

param(
    [Parameter(Mandatory=$true)]
    [string]$Content,
    
    [switch]$Important
)

$Date = Get-Date -Format "yyyy-MM-dd"
$Time = Get-Date -Format "HH:mm"
$MemoryDir = "$env:USERPROFILE\.openclaw\workspace\memory"
$LongTermFile = "$env:USERPROFILE\.openclaw\workspace\MEMORY.md"

# 确保目录存在
New-Item -ItemType Directory -Force -Path $MemoryDir | Out-Null

# 保存到每日笔记
$DailyFile = "$MemoryDir\$Date.md"
Add-Content -Path $DailyFile -Value ""
Add-Content -Path $DailyFile -Value "### $Time [手动保存]"
Add-Content -Path $DailyFile -Value $Content
Add-Content -Path $DailyFile -Value ""

# 如果是重要内容，同时保存到长期记忆
if ($Important) {
    Add-Content -Path $LongTermFile -Value ""
    Add-Content -Path $LongTermFile -Value "## $(Get-Date -Format "yyyy-MM-dd HH:mm")"
    Add-Content -Path $LongTermFile -Value $Content
    Write-Host "[已同步到长期记忆]" -ForegroundColor Green
}

Write-Host "✅ 对话已保存到 memory/$Date.md" -ForegroundColor Green
