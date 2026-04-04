$outputFile = "D:\work\media\football_video_01.mp4"

$subtitles = @(
    "欢迎来到今晚的足球赛事分析",
    "曼城 vs 利物浦 英超焦点战",
    "皇马客战马洛卡 西甲精彩对决",
    "更多赛事分析，请持续关注"
)

$images = @(
    "D:\work\media\football_01.png",
    "D:\work\media\football_02.png",
    "D:\work\media\football_03.png",
    "D:\work\media\football_04.png"
)

$listFile = "D:\work\media\input_list.txt"
$subtitleFile = "D:\work\media\subtitles.ass"

"file 'D:/work/media/football_01.png'" | Out-File -FilePath $listFile -Encoding utf8
"duration 5" | Add-Content -Path $listFile -Encoding utf8
"file 'D:/work/media/football_02.png'" | Add-Content -Path $listFile -Encoding utf8
"duration 5" | Add-Content -Path $listFile -Encoding utf8
"file 'D:/work/media/football_03.png'" | Add-Content -Path $listFile -Encoding utf8
"duration 5" | Add-Content -Path $listFile -Encoding utf8
"file 'D:/work/media/football_04.png'" | Add-Content -Path $listFile -Encoding utf8

Write-Host "Input list:"
Get-Content $listFile

$ass = @"
[Script Info]
Title: Football Subtitles
ScriptType: v4.00+

[Events]
Format: Layer, Start, End, Style, Text
Dialogue: 0,0:00:00.00,0:00:04.90,Default,,0,0,0,,欢迎来到今晚的足球赛事分析
Dialogue: 0,0:00:05.00,0:00:09.90,Default,,0,0,0,,曼城 vs 利物浦 英超焦点战
Dialogue: 0,0:00:10.00,0:00:14.90,Default,,0,0,0,,皇马客战马洛卡 西甲精彩对决
Dialogue: 0,0:00:15.00,0:00:19.90,Default,,0,0,0,,更多赛事分析，请持续关注
"@

$ass | Out-File -FilePath $subtitleFile -Encoding utf8

Write-Host "Subtitles file created"
Write-Host "Running ffmpeg..."

ffmpeg -y -f concat -safe 0 -i "D:\work\media\input_list.txt" -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,ass=D:\work\media\subtitles.ass" -c:v libx264 -preset fast -crf 23 -c:a copy "$outputFile" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: $outputFile"
} else {
    Write-Host "FAILED with exit code $LASTEXITCODE"
}
