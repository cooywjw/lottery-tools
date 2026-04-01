#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
只测试图片生成，跳过 TTS
"""

import sys
import os
from pathlib import Path

# 添加 scripts 目录到路径
sys.path.insert(0, str(Path(__file__).parent / "scripts"))

# 导入函数
from generate import parse_script, generate_slide, _detect_chrome

def test_images_only():
    """只生成图片，不生成音频"""
    script_path = os.path.join(os.path.dirname(__file__), "test_full_script.md")
    images_dir = "test_images_output"
    
    print("测试图片生成")
    print("=" * 60)
    
    # 解析脚本
    print("[1/3] 解析脚本...")
    segments = parse_script(script_path)
    print(f"  找到 {len(segments)} 个段落")
    
    # 创建图片目录
    os.makedirs(images_dir, exist_ok=True)
    
    print(f"\n[2/3] 生成图片到: {images_dir}")
    
    for i, segment in enumerate(segments, 1):
        print(f"\n  - 段落 {i}: {segment['subtitle'][:30]}...")
        
        output_path = os.path.join(images_dir, f"slide_{i:02d}.png")
        
        try:
            result = generate_slide(
                subtitle=segment["subtitle"],
                visual=segment["visual"],
                output_path=output_path,
                width=1080,
                height=1920,
                index=i
            )
            print(f"    图片生成成功: {result}")
        except Exception as e:
            print(f"    图片生成失败: {e}")
            import traceback
            traceback.print_exc()
    
    print(f"\n[3/3] 检查生成结果")
    
    # 列出生成的图片
    if os.path.exists(images_dir):
        png_files = [f for f in os.listdir(images_dir) if f.endswith('.png')]
        print(f"  生成 {len(png_files)} 张图片:")
        for f in sorted(png_files):
            path = os.path.join(images_dir, f)
            size = os.path.getsize(path)
            print(f"    - {f}: {size:,} 字节")
    else:
        print("  图片目录不存在")

if __name__ == "__main__":
    test_images_only()