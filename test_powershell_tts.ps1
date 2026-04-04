Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SetOutputToWaveFile("D:\work\media\tts_test.wav")
[System.Speech.Synthesis.PromptBuilder]$pb = New-Object System.Speech.Synthesis.PromptBuilder
$pb.AppendText("各位观众大家好，欢迎来到今天的足球赛事分析")
$synth.Speak($pb)
Write-Host "OK"
