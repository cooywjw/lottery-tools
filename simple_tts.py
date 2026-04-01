#!/usr/bin/env python3
import sys
import os
import pyttsx3

def text_to_speech(text, output_file):
    """Convert text to speech using pyttsx3"""
    try:
        engine = pyttsx3.init()
        
        # 设置中文语音（如果可用）
        voices = engine.getProperty('voices')
        for voice in voices:
            if 'chinese' in voice.name.lower() or 'zh' in voice.id.lower():
                engine.setProperty('voice', voice.id)
                break
        
        # 设置语速
        engine.setProperty('rate', 150)
        
        # 保存到文件
        engine.save_to_file(text, output_file)
        engine.runAndWait()
        print(f"TTS 完成: {output_file}")
        return True
    except Exception as e:
        print(f"TTS 失败: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("用法: python simple_tts.py <文本> <输出文件>")
        sys.exit(1)
    
    text = sys.argv[1]
    output_file = sys.argv[2]
    
    success = text_to_speech(text, output_file)
    sys.exit(0 if success else 1)