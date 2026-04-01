#!/usr/bin/env python3
import sys
import os
import subprocess
import tempfile

def text_to_speech(text, output_file):
    """Convert text to speech using PowerShell SpeechSynthesizer"""
    try:
        # 创建临时 WAV 文件
        temp_wav = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        temp_wav.close()
        
        # 使用 PowerShell 生成 WAV
        ps_script = f"""
        Add-Type -AssemblyName System.Speech
        $speech = New-Object System.Speech.Synthesis.SpeechSynthesizer
        $speech.SetOutputToWaveFile('{temp_wav.name}')
        $speech.Speak('{text}')
        $speech.Dispose()
        """
        
        # 运行 PowerShell
        result = subprocess.run(
            ['powershell', '-Command', ps_script],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            print(f"PowerShell 错误: {result.stderr}")
            return False
        
        # 使用 FFmpeg 转换为 MP3
        if output_file.lower().endswith('.mp3'):
            ffmpeg_cmd = [
                'ffmpeg', '-i', temp_wav.name,
                '-codec:a', 'libmp3lame',
                '-qscale:a', '2',
                output_file,
                '-y'
            ]
            
            result = subprocess.run(
                ffmpeg_cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                print(f"FFmpeg 错误: {result.stderr}")
                return False
        
        # 清理临时文件
        os.unlink(temp_wav.name)
        
        print(f"TTS 完成: {output_file}")
        return True
        
    except Exception as e:
        print(f"TTS 失败: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("用法: python tts_wrapper.py <文本> <输出文件>")
        sys.exit(1)
    
    text = sys.argv[1]
    output_file = sys.argv[2]
    
    success = text_to_speech(text, output_file)
    sys.exit(0 if success else 1)